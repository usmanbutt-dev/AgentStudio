import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import { agentRegistry } from '../core/agent-registry.js';
import { blackboard } from '../core/blackboard.js';
import { eventBus } from '../core/event-bus.js';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { createLogger } from '../utils/logger.js';
import type { Task, TaskOutput, AgentMessage } from '@agent-studio/shared';

const log = createLogger('MCP');

// --- Helpers (reused from routes) ---

function rowToTask(row: typeof schema.tasks.$inferSelect): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as Task['type'],
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    assigneeId: row.assigneeId,
    workflowId: row.workflowId,
    dependencies: row.dependencies as string[],
    input: row.input as Task['input'],
    output: row.output as TaskOutput,
    approvalRequired: row.approvalRequired,
    maxRetries: row.maxRetries,
    retryCount: row.retryCount,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}

const emptyOutput = (): TaskOutput => ({
  result: null,
  artifacts: [],
  tokenUsage: { input: 0, output: 0 },
  cost: 0,
});

// --- Create the MCP server ---

function createAgentStudioMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'agent-studio', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  // ==================== AGENT TOOLS ====================

  server.registerTool('list_agents', {
    title: 'List Agents',
    description: 'List all registered agents with their status, role, provider, and model.',
  }, async () => {
    const agents = agentRegistry.getAll();
    return {
      content: [{ type: 'text', text: JSON.stringify(agents, null, 2) }],
    };
  });

  server.registerTool('get_agent', {
    title: 'Get Agent',
    description: 'Get details of a specific agent by ID.',
    inputSchema: { agentId: z.string().describe('The agent ID') },
  }, async (args) => {
    const agent = agentRegistry.getById(args.agentId);
    if (!agent) {
      return { content: [{ type: 'text', text: `Agent not found: ${args.agentId}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(agent, null, 2) }] };
  });

  server.registerTool('get_idle_agents', {
    title: 'Get Idle Agents',
    description: 'List all agents currently in idle status, available for task assignment.',
  }, async () => {
    const agents = agentRegistry.getIdle();
    return { content: [{ type: 'text', text: JSON.stringify(agents, null, 2) }] };
  });

  // ==================== TASK TOOLS ====================

  server.registerTool('list_tasks', {
    title: 'List Tasks',
    description: 'List all tasks, optionally filtered by status.',
    inputSchema: {
      status: z.string().optional().describe('Filter by status: pending, queued, assigned, in_progress, awaiting_approval, completed, failed'),
    },
  }, async (args) => {
    let tasks = db.select().from(schema.tasks).orderBy(desc(schema.tasks.createdAt)).all().map(rowToTask);
    if (args.status) {
      tasks = tasks.filter(t => t.status === args.status);
    }
    return { content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }] };
  });

  server.registerTool('get_task', {
    title: 'Get Task',
    description: 'Get details of a specific task by ID, including its input, output, and status.',
    inputSchema: { taskId: z.string().describe('The task ID') },
  }, async (args) => {
    const row = db.select().from(schema.tasks).where(eq(schema.tasks.id, args.taskId)).get();
    if (!row) {
      return { content: [{ type: 'text', text: `Task not found: ${args.taskId}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(rowToTask(row), null, 2) }] };
  });

  server.registerTool('create_task', {
    title: 'Create Task',
    description: 'Create a new task. The orchestrator will automatically assign it to an available agent.',
    inputSchema: {
      title: z.string().describe('Task title'),
      description: z.string().optional().describe('Task description'),
      type: z.enum(['code', 'review', 'debug', 'research', 'refactor', 'test', 'custom']).describe('Task type'),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Task priority (default: medium)'),
      prompt: z.string().describe('The prompt/instructions for the agent'),
      context: z.array(z.string()).optional().describe('Context strings (file paths, code snippets, references)'),
      assigneeId: z.string().optional().describe('Assign to a specific agent ID (auto-assigned if omitted)'),
      approvalRequired: z.boolean().optional().describe('Require human approval before completing (default: false)'),
    },
  }, async (args) => {
    const id = uuid();
    const now = new Date().toISOString();

    db.insert(schema.tasks).values({
      id,
      title: args.title,
      description: args.description ?? '',
      type: args.type,
      status: 'pending',
      priority: args.priority ?? 'medium',
      assigneeId: args.assigneeId ?? null,
      workflowId: null,
      dependencies: [],
      input: { prompt: args.prompt, context: args.context ?? [] },
      output: emptyOutput(),
      approvalRequired: args.approvalRequired ?? false,
      maxRetries: 2,
      retryCount: 0,
      createdAt: now,
      startedAt: null,
      completedAt: null,
    }).run();

    const row = db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get()!;
    const task = rowToTask(row);
    eventBus.emit('task:created', { task });

    return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
  });

  // ==================== BLACKBOARD TOOLS ====================

  server.registerTool('blackboard_read', {
    title: 'Read Blackboard',
    description: 'Read a value from the shared blackboard (key-value store used by all agents for shared context).',
    inputSchema: { key: z.string().describe('The blackboard key to read') },
  }, async (args) => {
    const value = blackboard.get(args.key);
    if (value === null) {
      return { content: [{ type: 'text', text: `No entry found for key: ${args.key}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
  });

  server.registerTool('blackboard_write', {
    title: 'Write to Blackboard',
    description: 'Write a value to the shared blackboard. Other agents can read this value.',
    inputSchema: {
      key: z.string().describe('The key to write'),
      value: z.string().describe('The value to store (will be parsed as JSON if valid, otherwise stored as string)'),
      tags: z.array(z.string()).optional().describe('Tags for categorization and search'),
    },
  }, async (args) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(args.value);
    } catch {
      parsed = args.value;
    }
    blackboard.set(args.key, parsed, 'mcp-client', args.tags ?? []);
    return { content: [{ type: 'text', text: `Written to blackboard: ${args.key}` }] };
  });

  server.registerTool('blackboard_search', {
    title: 'Search Blackboard',
    description: 'Search blackboard entries by key pattern or tag.',
    inputSchema: {
      pattern: z.string().optional().describe('Key pattern to search for (substring match)'),
      tag: z.string().optional().describe('Filter by tag'),
    },
  }, async (args) => {
    let results;
    if (args.tag) {
      results = blackboard.getByTag(args.tag);
    } else if (args.pattern) {
      results = blackboard.search(args.pattern);
    } else {
      results = blackboard.getRecent(20);
    }
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  });

  server.registerTool('blackboard_recent', {
    title: 'Recent Blackboard Entries',
    description: 'Get the most recent blackboard entries.',
    inputSchema: {
      limit: z.number().optional().describe('Number of entries to return (default: 20)'),
    },
  }, async (args) => {
    const entries = blackboard.getRecent(args.limit ?? 20);
    return { content: [{ type: 'text', text: JSON.stringify(entries, null, 2) }] };
  });

  // ==================== MESSAGE TOOLS ====================

  server.registerTool('send_message', {
    title: 'Send Message',
    description: 'Send a structured message to an agent or broadcast to the blackboard.',
    inputSchema: {
      fromAgentId: z.string().describe('Sender agent ID (use "mcp-client" for external clients)'),
      toAgentId: z.string().optional().describe('Recipient agent ID (omit to broadcast)'),
      taskId: z.string().optional().describe('Related task ID'),
      type: z.enum([
        'task_request', 'task_result', 'clarification',
        'review_feedback', 'decision_proposal', 'status_update',
        'error_report', 'context_share',
      ]).describe('Message type'),
      payload: z.string().describe('Message payload as JSON string'),
    },
  }, async (args) => {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(args.payload);
    } catch {
      payload = { text: args.payload };
    }

    const id = uuid();
    const now = new Date().toISOString();

    db.insert(schema.messages).values({
      id,
      fromAgentId: args.fromAgentId,
      toAgentId: args.toAgentId ?? null,
      taskId: args.taskId ?? null,
      type: args.type,
      payload,
      timestamp: now,
    }).run();

    const row = db.select().from(schema.messages).where(eq(schema.messages.id, id)).get()!;
    const message: AgentMessage = {
      id: row.id,
      fromAgentId: row.fromAgentId,
      toAgentId: row.toAgentId,
      taskId: row.taskId,
      type: row.type as AgentMessage['type'],
      payload: row.payload as Record<string, unknown>,
      timestamp: row.timestamp,
    };
    eventBus.emit('message:sent', { message });

    return { content: [{ type: 'text', text: JSON.stringify(message, null, 2) }] };
  });

  server.registerTool('list_messages', {
    title: 'List Messages',
    description: 'List recent agent messages.',
    inputSchema: {
      limit: z.number().optional().describe('Number of messages to return (default: 50)'),
    },
  }, async (args) => {
    const messages = db.select().from(schema.messages)
      .orderBy(desc(schema.messages.timestamp))
      .limit(args.limit ?? 50)
      .all();
    return { content: [{ type: 'text', text: JSON.stringify(messages, null, 2) }] };
  });

  // ==================== STATS TOOL ====================

  server.registerTool('get_stats', {
    title: 'Get Stats',
    description: 'Get aggregate stats: total agents, tasks, cost, tokens, and cost by model.',
  }, async () => {
    const agents = agentRegistry.getAll();
    const tasks = db.select().from(schema.tasks).all().map(rowToTask);

    let totalCost = 0;
    let totalTokens = 0;
    let completedTasks = 0;
    let failedTasks = 0;
    let pendingTasks = 0;

    for (const a of agents) {
      totalCost += a.stats.totalCost;
      totalTokens += a.stats.totalTokensUsed;
    }

    for (const t of tasks) {
      if (t.status === 'completed') completedTasks++;
      else if (t.status === 'failed') failedTasks++;
      else if (t.status === 'pending' || t.status === 'queued') pendingTasks++;
    }

    const stats = {
      totalAgents: agents.length,
      totalTasks: tasks.length,
      completedTasks,
      failedTasks,
      pendingTasks,
      totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
      totalTokens,
    };

    return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
  });

  log.info('MCP server initialized with tools: list_agents, get_agent, get_idle_agents, list_tasks, get_task, create_task, blackboard_read, blackboard_write, blackboard_search, blackboard_recent, send_message, list_messages, get_stats');

  return server;
}

// --- Transport management (one McpServer per session) ---

interface McpSession {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
}

const sessions = new Map<string, McpSession>();

/**
 * Handle POST /mcp — main MCP endpoint for Streamable HTTP transport
 */
export async function handleMcpPost(req: IncomingMessage, res: ServerResponse, parsedBody?: unknown) {
  const sessionId = (req.headers['mcp-session-id'] as string) || randomUUID();

  let session = sessions.get(sessionId);
  if (!session) {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => sessionId });
    const server = createAgentStudioMcpServer();

    transport.onclose = () => {
      sessions.delete(sessionId);
      log.debug(`MCP session closed: ${sessionId}`);
    };

    await server.connect(transport);
    session = { transport, server };
    sessions.set(sessionId, session);
    log.info(`MCP session started: ${sessionId}`);
  }

  await session.transport.handleRequest(req, res, parsedBody);
}

/**
 * Handle GET /mcp — SSE stream for server-initiated messages
 */
export async function handleMcpGet(req: IncomingMessage, res: ServerResponse) {
  const sessionId = req.headers['mcp-session-id'] as string;
  const session = sessions.get(sessionId);
  if (session) {
    await session.transport.handleRequest(req, res);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Session not found. Send a POST to /mcp first.' }));
  }
}

/**
 * Handle DELETE /mcp — close a session
 */
export async function handleMcpDelete(req: IncomingMessage, res: ServerResponse) {
  const sessionId = req.headers['mcp-session-id'] as string;
  const session = sessions.get(sessionId);
  if (session) {
    await session.transport.close();
    sessions.delete(sessionId);
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Session not found' }));
  }
}
