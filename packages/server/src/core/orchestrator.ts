import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import type { Task, TaskOutput } from '@agent-studio/shared';
import { eventBus } from './event-bus.js';
import { agentRegistry } from './agent-registry.js';
import { adapterManager } from './adapter-manager.js';
import { blackboard } from './blackboard.js';
import { findBestAgent } from './task-router.js';
import { calculateCost } from '../utils/cost-tracker.js';
import type { ChatMessage } from '../agents/base-adapter.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('Orchestrator');

class Orchestrator {
  private running = false;
  private interval: ReturnType<typeof setInterval> | null = null;
  private activeTasks = new Set<string>();
  private approvalResolvers = new Map<string, (approved: boolean) => void>();
  private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();

  start() {
    if (this.running) return;
    this.running = true;
    log.info('Orchestrator started');

    // Poll for pending tasks every 2 seconds
    this.interval = setInterval(() => this.tick(), 2000);

    // Listen for approval events
    this.setupApprovalListeners();
  }

  stop() {
    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }
    this.retryTimers.clear();
    log.info('Orchestrator stopped');
  }

  private setupApprovalListeners() {
    // These get called from socket handlers when user approves/rejects
    eventBus.on('task:completed', () => {}); // no-op, just to register
  }

  /** Called by socket handler when user approves a task */
  approveTask(taskId: string) {
    const resolver = this.approvalResolvers.get(taskId);
    if (resolver) {
      resolver(true);
      this.approvalResolvers.delete(taskId);
    }
  }

  /** Called by socket handler when user rejects a task */
  rejectTask(taskId: string) {
    const resolver = this.approvalResolvers.get(taskId);
    if (resolver) {
      resolver(false);
      this.approvalResolvers.delete(taskId);
    }
  }

  private async tick() {
    if (!this.running) return;

    // Find pending tasks with all dependencies resolved
    const allTasks = db.select().from(schema.tasks).all();
    const pendingTasks = allTasks.filter(
      (t) => t.status === 'pending' && !this.activeTasks.has(t.id),
    );

    for (const taskRow of pendingTasks) {
      const deps = taskRow.dependencies as string[];
      const allDepsResolved = deps.every((depId) => {
        const dep = allTasks.find((t) => t.id === depId);
        return dep && dep.status === 'completed';
      });

      if (!allDepsResolved) continue;

      // Build Task object
      const task = this.rowToTask(taskRow);

      // Find an agent
      const agent = findBestAgent(task);
      if (!agent) continue;

      // Execute asynchronously
      this.activeTasks.add(task.id);
      this.executeTask(task, agent.id).catch((err) => {
        log.error(`Task ${task.id} execution error`, err);
      });
    }
  }

  private async executeTask(task: Task, agentId: string) {
    const agent = agentRegistry.getById(agentId);
    if (!agent) {
      this.activeTasks.delete(task.id);
      return;
    }

    try {
      // Update statuses
      db.update(schema.tasks)
        .set({ status: 'in_progress', assigneeId: agentId, startedAt: new Date().toISOString() })
        .where(eq(schema.tasks.id, task.id))
        .run();
      agentRegistry.setStatus(agentId, 'working');
      eventBus.emit('task:assigned', { taskId: task.id, agentId });

      // Build messages
      const messages = this.buildMessages(task);

      // Get adapter and stream
      const adapter = adapterManager.get(agent);
      let fullContent = '';
      let tokenUsage = { input: 0, output: 0 };

      const stream = adapter.executeStream({
        systemPrompt: agent.config.systemPrompt,
        messages,
        temperature: agent.config.temperature,
        maxTokens: agent.config.maxTokens,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          fullContent += chunk.content;
          eventBus.emit('task:progress', { taskId: task.id, chunk: chunk.content });
        } else if (chunk.type === 'done') {
          tokenUsage = chunk.tokenUsage ?? tokenUsage;
        } else if (chunk.type === 'error') {
          throw new Error(chunk.content);
        }
      }

      // Calculate cost
      const cost = calculateCost(agent.model, {
        inputTokens: tokenUsage.input,
        outputTokens: tokenUsage.output,
      });

      // Build output
      const output: TaskOutput = {
        result: fullContent,
        artifacts: [],
        tokenUsage,
        cost,
      };

      // Check if approval is needed
      if (task.approvalRequired) {
        db.update(schema.tasks)
          .set({ status: 'awaiting_approval', output })
          .where(eq(schema.tasks.id, task.id))
          .run();
        agentRegistry.setStatus(agentId, 'idle');
        eventBus.emit('task:approval-needed', { taskId: task.id });

        // Wait for user approval
        const approved = await this.waitForApproval(task.id);
        if (!approved) {
          db.update(schema.tasks)
            .set({ status: 'failed', completedAt: new Date().toISOString() })
            .where(eq(schema.tasks.id, task.id))
            .run();
          eventBus.emit('task:failed', { taskId: task.id, error: 'Rejected by user' });
          this.activeTasks.delete(task.id);
          return;
        }
      }

      // Mark completed
      db.update(schema.tasks)
        .set({ status: 'completed', output, completedAt: new Date().toISOString() })
        .where(eq(schema.tasks.id, task.id))
        .run();
      agentRegistry.setStatus(agentId, 'idle');

      // Update agent stats
      const stats = agent.stats;
      agentRegistry.updateStats(agentId, {
        tasksCompleted: stats.tasksCompleted + 1,
        totalTokensUsed: stats.totalTokensUsed + tokenUsage.input + tokenUsage.output,
        totalCost: stats.totalCost + cost,
      });

      // Post result to blackboard
      blackboard.set(`task:${task.id}:result`, fullContent, agentId, [task.type]);

      eventBus.emit('task:completed', { taskId: task.id, output });
      log.info(`Task "${task.title}" completed by ${agent.name} (cost: $${cost.toFixed(6)})`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      log.error(`Task "${task.title}" failed: ${errorMsg}`);

      // Retry logic with exponential backoff
      const currentRetry = task.retryCount + 1;
      if (currentRetry <= task.maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, currentRetry - 1), 30000); // 1s, 2s, 4s, ... max 30s
        log.info(`Retrying task "${task.title}" in ${delayMs / 1000}s (${currentRetry}/${task.maxRetries})`);
        db.update(schema.tasks)
          .set({ status: 'queued', retryCount: currentRetry, assigneeId: null })
          .where(eq(schema.tasks.id, task.id))
          .run();
        const timer = setTimeout(() => {
          this.retryTimers.delete(task.id);
          db.update(schema.tasks)
            .set({ status: 'pending' })
            .where(eq(schema.tasks.id, task.id))
            .run();
        }, delayMs);
        this.retryTimers.set(task.id, timer);
      } else {
        db.update(schema.tasks)
          .set({ status: 'failed', completedAt: new Date().toISOString() })
          .where(eq(schema.tasks.id, task.id))
          .run();
        eventBus.emit('task:failed', { taskId: task.id, error: errorMsg });
      }

      agentRegistry.setStatus(agentId, 'idle');
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  private buildMessages(task: Task): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // If task has context from a previous task, include it
    if (task.input.fromTaskId) {
      const prevResult = blackboard.get(`task:${task.input.fromTaskId}:result`);
      if (prevResult && typeof prevResult === 'string') {
        messages.push({
          role: 'user',
          content: `Previous task output:\n\n${prevResult}`,
        });
      }
    }

    // Add any context
    if (task.input.context.length > 0) {
      messages.push({
        role: 'user',
        content: `Context:\n${task.input.context.join('\n')}`,
      });
    }

    // Main prompt
    messages.push({
      role: 'user',
      content: task.input.prompt,
    });

    return messages;
  }

  private waitForApproval(taskId: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.approvalResolvers.set(taskId, resolve);

      // Auto-timeout after 30 minutes
      setTimeout(() => {
        if (this.approvalResolvers.has(taskId)) {
          this.approvalResolvers.delete(taskId);
          resolve(false);
        }
      }, 30 * 60 * 1000);
    });
  }

  private rowToTask(row: typeof schema.tasks.$inferSelect): Task {
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
}

export const orchestrator = new Orchestrator();
