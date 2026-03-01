import { Router } from 'express';
import { db, schema } from '../db/index.js';
import type { Agent, Task, TaskOutput } from '@agent-studio/shared';

export const statsRouter = Router();

// GET /api/stats — aggregate stats across all agents and tasks
statsRouter.get('/', (_req, res) => {
  const agents = db.select().from(schema.agents).all();
  const tasks = db.select().from(schema.tasks).all();

  const agentStats = agents.map((a) => {
    const stats = a.stats as Agent['stats'];
    return {
      id: a.id,
      name: a.name,
      role: a.role,
      provider: a.provider,
      model: a.model,
      ...stats,
    };
  });

  let totalCost = 0;
  let totalTokens = 0;
  let completedTasks = 0;
  let failedTasks = 0;
  let pendingTasks = 0;

  for (const a of agents) {
    const stats = a.stats as Agent['stats'];
    totalCost += stats.totalCost;
    totalTokens += stats.totalTokensUsed;
  }

  for (const t of tasks) {
    if (t.status === 'completed') completedTasks++;
    else if (t.status === 'failed') failedTasks++;
    else if (t.status === 'pending' || t.status === 'queued') pendingTasks++;
  }

  // Cost by model
  const costByModel: Record<string, number> = {};
  for (const t of tasks) {
    if (t.status !== 'completed') continue;
    const output = t.output as TaskOutput;
    const assignee = agents.find((a) => a.id === t.assigneeId);
    if (assignee && output.cost > 0) {
      const model = assignee.model;
      costByModel[model] = (costByModel[model] ?? 0) + output.cost;
    }
  }

  res.json({
    overview: {
      totalAgents: agents.length,
      totalTasks: tasks.length,
      completedTasks,
      failedTasks,
      pendingTasks,
      totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
      totalTokens,
    },
    agents: agentStats,
    costByModel,
  });
});
