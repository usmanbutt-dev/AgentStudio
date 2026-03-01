import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { v4 as uuid } from 'uuid';
import type { Agent } from '@agent-studio/shared';
import { eventBus } from '../core/event-bus.js';

export const settingsRouter = Router();

const defaultStats = (): Agent['stats'] => ({
  tasksCompleted: 0,
  totalTokensUsed: 0,
  totalCost: 0,
  avgResponseTime: 0,
});

// GET /api/settings/export — export workspace as JSON (no API keys)
settingsRouter.get('/export', (_req, res) => {
  const agents = db.select().from(schema.agents).all().map((a) => {
    const config = a.config as Agent['config'];
    return {
      name: a.name,
      role: a.role,
      provider: a.provider,
      model: a.model,
      config: { ...config, apiKey: undefined }, // Strip API keys
    };
  });

  const workflows = db.select().from(schema.workflowTemplates).all().map((w) => ({
    name: w.name,
    description: w.description,
    steps: w.steps,
  }));

  const decisions = db.select().from(schema.decisions).all()
    .filter((d) => d.status === 'approved')
    .map((d) => ({
      title: d.title,
      reasoning: d.reasoning,
      tags: d.tags,
    }));

  res.json({
    version: '0.1.0',
    exportedAt: new Date().toISOString(),
    agents,
    workflows,
    decisions,
  });
});

// POST /api/settings/import — import workspace from JSON
settingsRouter.post('/import', (req, res) => {
  const data = req.body;
  if (!data || !data.version) {
    return res.status(400).json({ error: 'Invalid export format' });
  }

  const imported = { agents: 0, workflows: 0, decisions: 0 };
  const now = new Date().toISOString();

  // Import agents (without API keys — user must configure those after import)
  if (Array.isArray(data.agents)) {
    for (const a of data.agents) {
      if (!a.name || !a.role || !a.provider || !a.model) continue;

      const id = uuid();
      const config = {
        systemPrompt: a.config?.systemPrompt ?? '',
        temperature: a.config?.temperature ?? 0.7,
        maxTokens: a.config?.maxTokens ?? 4096,
        tools: a.config?.tools ?? [],
      };

      db.insert(schema.agents).values({
        id,
        name: a.name,
        role: a.role,
        provider: a.provider,
        model: a.model,
        status: 'idle',
        config,
        stats: defaultStats(),
        positionX: Math.random() * 600,
        positionY: Math.random() * 400,
        createdAt: now,
      }).run();

      imported.agents++;
    }
  }

  // Import workflow templates
  if (Array.isArray(data.workflows)) {
    for (const w of data.workflows) {
      if (!w.name || !w.steps) continue;

      db.insert(schema.workflowTemplates).values({
        id: uuid(),
        name: w.name,
        description: w.description ?? '',
        steps: w.steps,
        createdAt: now,
      }).run();

      imported.workflows++;
    }
  }

  // Import decisions as blackboard entries (decisions require agent FK references,
  // so we store them on the blackboard where they can still inform future agents)
  if (Array.isArray(data.decisions)) {
    for (const d of data.decisions) {
      if (!d.title) continue;

      db.insert(schema.blackboardEntries).values({
        id: uuid(),
        key: `decision:${d.title}`,
        value: { title: d.title, reasoning: d.reasoning, tags: d.tags },
        agentId: null,
        tags: d.tags ?? [],
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      }).run();

      imported.decisions++;
    }
  }

  res.json({
    success: true,
    message: `Imported ${imported.agents} agents, ${imported.workflows} workflows, ${imported.decisions} decisions`,
    imported,
  });
});
