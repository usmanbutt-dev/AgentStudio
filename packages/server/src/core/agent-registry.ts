import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { Agent, AgentStatus, CreateAgentInput } from '@agent-studio/shared';
import { eventBus } from './event-bus.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('AgentRegistry');

function rowToAgent(row: typeof schema.agents.$inferSelect): Agent {
  return {
    id: row.id,
    name: row.name,
    role: row.role as Agent['role'],
    provider: row.provider as Agent['provider'],
    model: row.model,
    status: row.status as AgentStatus,
    config: row.config as Agent['config'],
    stats: row.stats as Agent['stats'],
    position: { x: row.positionX, y: row.positionY },
    createdAt: row.createdAt,
  };
}

const defaultStats = (): Agent['stats'] => ({
  tasksCompleted: 0,
  totalTokensUsed: 0,
  totalCost: 0,
  avgResponseTime: 0,
});

class AgentRegistry {
  getAll(): Agent[] {
    return db.select().from(schema.agents).all().map(rowToAgent);
  }

  getById(id: string): Agent | null {
    const row = db.select().from(schema.agents).where(eq(schema.agents.id, id)).get();
    return row ? rowToAgent(row) : null;
  }

  getByRole(role: string): Agent[] {
    return db.select().from(schema.agents).where(eq(schema.agents.role, role)).all().map(rowToAgent);
  }

  getIdle(): Agent[] {
    return db.select().from(schema.agents).where(eq(schema.agents.status, 'idle')).all().map(rowToAgent);
  }

  register(input: CreateAgentInput): Agent {
    const id = uuid();
    const now = new Date().toISOString();
    const position = input.position ?? { x: Math.random() * 600, y: Math.random() * 400 };

    db.insert(schema.agents).values({
      id,
      name: input.name,
      role: input.role,
      provider: input.provider,
      model: input.model,
      status: 'idle',
      config: input.config,
      stats: defaultStats(),
      positionX: position.x,
      positionY: position.y,
      createdAt: now,
    }).run();

    const agent = this.getById(id)!;
    log.info(`Registered agent: ${agent.name} (${agent.provider}/${agent.model})`);
    eventBus.emit('agent:registered', { agent });
    return agent;
  }

  update(id: string, updates: Partial<Pick<Agent, 'name' | 'role' | 'model' | 'config' | 'position'>>): Agent | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const values: Record<string, unknown> = {};
    if (updates.name) values.name = updates.name;
    if (updates.role) values.role = updates.role;
    if (updates.model) values.model = updates.model;
    if (updates.config) values.config = updates.config;
    if (updates.position) {
      values.positionX = updates.position.x;
      values.positionY = updates.position.y;
    }

    if (Object.keys(values).length > 0) {
      db.update(schema.agents).set(values).where(eq(schema.agents.id, id)).run();
    }

    const agent = this.getById(id)!;
    eventBus.emit('agent:updated', { agent });
    return agent;
  }

  setStatus(id: string, status: AgentStatus) {
    db.update(schema.agents).set({ status }).where(eq(schema.agents.id, id)).run();
    eventBus.emit('agent:status-changed', { agentId: id, status });
    log.debug(`Agent ${id} → ${status}`);
  }

  updateStats(id: string, stats: Partial<Agent['stats']>) {
    const agent = this.getById(id);
    if (!agent) return;

    const merged = { ...agent.stats, ...stats };
    db.update(schema.agents).set({ stats: merged }).where(eq(schema.agents.id, id)).run();
  }

  remove(id: string): boolean {
    const existing = this.getById(id);
    if (!existing) return false;

    db.delete(schema.agents).where(eq(schema.agents.id, id)).run();
    eventBus.emit('agent:removed', { agentId: id });
    log.info(`Removed agent: ${existing.name}`);
    return true;
  }
}

export const agentRegistry = new AgentRegistry();
