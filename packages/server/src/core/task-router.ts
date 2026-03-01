import type { Agent, Task } from '@agent-studio/shared';
import { agentRegistry } from './agent-registry.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('TaskRouter');

/**
 * Find the best available agent for a task.
 * Strategy: match by role, prefer idle agents, pick least loaded.
 */
export function findBestAgent(task: Task): Agent | null {
  // If task has an explicit assignee, use that
  if (task.assigneeId) {
    const agent = agentRegistry.getById(task.assigneeId);
    if (agent && agent.status === 'idle') return agent;
    if (agent && agent.status !== 'offline' && agent.status !== 'error') return agent;
    // Assignee not available — fall through to auto-assign
    log.warn(`Assigned agent ${task.assigneeId} not available, auto-assigning`);
  }

  // Map task type to preferred agent role
  const preferredRole = TASK_ROLE_MAP[task.type] ?? null;

  // Get all idle agents
  const idleAgents = agentRegistry.getIdle();

  if (idleAgents.length === 0) {
    log.debug('No idle agents available');
    return null;
  }

  // Prefer agents matching the role
  if (preferredRole) {
    const roleMatch = idleAgents.filter((a) => a.role === preferredRole);
    if (roleMatch.length > 0) {
      // Pick the one with fewest tasks completed (spread work)
      return roleMatch.sort((a, b) => a.stats.tasksCompleted - b.stats.tasksCompleted)[0];
    }
  }

  // No role match — pick any idle agent with fewest tasks
  return idleAgents.sort((a, b) => a.stats.tasksCompleted - b.stats.tasksCompleted)[0];
}

const TASK_ROLE_MAP: Record<string, string> = {
  code: 'coder',
  review: 'reviewer',
  debug: 'debugger',
  research: 'researcher',
  refactor: 'coder',
  test: 'coder',
  custom: 'custom',
};
