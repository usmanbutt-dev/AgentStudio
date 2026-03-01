import type { Agent } from '@agent-studio/shared';
import { BaseAgentAdapter } from '../agents/base-adapter.js';
import { createAdapter } from '../agents/adapter-factory.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('AdapterManager');

/**
 * Manages live adapter instances for registered agents.
 * One adapter per agent — created on register, destroyed on remove.
 */
class AdapterManager {
  private adapters = new Map<string, BaseAgentAdapter>();

  /** Create and store an adapter for an agent */
  create(agent: Agent): BaseAgentAdapter {
    const existing = this.adapters.get(agent.id);
    if (existing) return existing;

    const adapter = createAdapter(agent.provider, agent.model, agent.config);
    this.adapters.set(agent.id, adapter);
    log.info(`Adapter created for ${agent.name} (${agent.provider}/${agent.model})`);
    return adapter;
  }

  /** Get adapter for an agent, creating if needed */
  get(agent: Agent): BaseAgentAdapter {
    return this.adapters.get(agent.id) ?? this.create(agent);
  }

  /** Get adapter by ID (returns null if not found) */
  getById(agentId: string): BaseAgentAdapter | null {
    return this.adapters.get(agentId) ?? null;
  }

  /** Remove and clean up an adapter */
  remove(agentId: string) {
    this.adapters.delete(agentId);
    log.debug(`Adapter removed for agent ${agentId}`);
  }

  /** Recreate adapter (e.g., after config change) */
  recreate(agent: Agent): BaseAgentAdapter {
    this.adapters.delete(agent.id);
    return this.create(agent);
  }

  /** Test connection for an agent */
  async testConnection(agent: Agent): Promise<boolean> {
    const adapter = this.get(agent);
    return adapter.ping();
  }
}

export const adapterManager = new AdapterManager();
