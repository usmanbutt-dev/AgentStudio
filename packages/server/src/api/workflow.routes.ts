import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { WorkflowTemplate } from '@agent-studio/shared';
import { workflowEngine } from '../core/workflow-engine.js';

export const workflowRouter = Router();

function rowToTemplate(row: typeof schema.workflowTemplates.$inferSelect): WorkflowTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    steps: row.steps as WorkflowTemplate['steps'],
    createdAt: row.createdAt,
  };
}

// GET /api/workflows
workflowRouter.get('/', (_req, res) => {
  const templates = db.select().from(schema.workflowTemplates).all().map(rowToTemplate);
  res.json(templates);
});

// GET /api/workflows/:id
workflowRouter.get('/:id', (req, res) => {
  const row = db.select().from(schema.workflowTemplates).where(eq(schema.workflowTemplates.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: 'Workflow not found' });
  res.json(rowToTemplate(row));
});

// POST /api/workflows
workflowRouter.post('/', (req, res) => {
  const { name, description, steps } = req.body;
  if (!name || !steps) return res.status(400).json({ error: 'name and steps are required' });

  const id = uuid();
  const now = new Date().toISOString();

  db.insert(schema.workflowTemplates).values({
    id,
    name,
    description: description ?? '',
    steps,
    createdAt: now,
  }).run();

  const row = db.select().from(schema.workflowTemplates).where(eq(schema.workflowTemplates.id, id)).get()!;
  res.status(201).json(rowToTemplate(row));
});

// POST /api/workflows/:id/run — start a workflow run
workflowRouter.post('/:id/run', (req, res) => {
  const row = db.select().from(schema.workflowTemplates).where(eq(schema.workflowTemplates.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: 'Workflow not found' });
  const template = rowToTemplate(row);
  const variables = req.body.variables ?? {};
  try {
    const run = workflowEngine.start(template, variables);
    res.status(201).json(run);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to start workflow' });
  }
});

// DELETE /api/workflows/:id
workflowRouter.delete('/:id', (req, res) => {
  const row = db.select().from(schema.workflowTemplates).where(eq(schema.workflowTemplates.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: 'Workflow not found' });
  db.delete(schema.workflowTemplates).where(eq(schema.workflowTemplates.id, req.params.id)).run();
  res.status(204).send();
});
