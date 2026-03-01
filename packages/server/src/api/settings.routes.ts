import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import type { Agent, Task, TaskOutput, WorkflowTemplate, Decision } from '@agent-studio/shared';

export const settingsRouter = Router();

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

  let imported = { agents: 0, workflows: 0, decisions: 0 };

  // Import is a future enhancement — just validate for now
  res.json({
    success: true,
    message: 'Import functionality coming soon',
    imported,
  });
});
