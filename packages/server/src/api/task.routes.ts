import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { CreateTaskSchema } from '@agent-studio/shared';
import type { Task, TaskOutput } from '@agent-studio/shared';
import { eventBus } from '../core/event-bus.js';

export const taskRouter = Router();

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

// GET /api/tasks
taskRouter.get('/', (_req, res) => {
  const tasks = db.select().from(schema.tasks).orderBy(desc(schema.tasks.createdAt)).all().map(rowToTask);
  res.json(tasks);
});

// GET /api/tasks/:id
taskRouter.get('/:id', (req, res) => {
  const row = db.select().from(schema.tasks).where(eq(schema.tasks.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: 'Task not found' });
  res.json(rowToTask(row));
});

// POST /api/tasks
taskRouter.post('/', (req, res) => {
  const parsed = CreateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.insert(schema.tasks).values({
    id,
    title: data.title,
    description: data.description ?? '',
    type: data.type,
    status: 'pending',
    priority: data.priority ?? 'medium',
    assigneeId: data.assigneeId ?? null,
    workflowId: data.workflowId ?? null,
    dependencies: data.dependencies ?? [],
    input: data.input,
    output: emptyOutput(),
    approvalRequired: data.approvalRequired ?? false,
    maxRetries: data.maxRetries ?? 2,
    retryCount: 0,
    createdAt: now,
    startedAt: null,
    completedAt: null,
  }).run();

  const row = db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get()!;
  const task = rowToTask(row);
  eventBus.emit('task:created', { task });
  res.status(201).json(task);
});

// DELETE /api/tasks/:id
taskRouter.delete('/:id', (req, res) => {
  const row = db.select().from(schema.tasks).where(eq(schema.tasks.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: 'Task not found' });
  db.delete(schema.tasks).where(eq(schema.tasks.id, req.params.id)).run();
  res.status(204).send();
});
