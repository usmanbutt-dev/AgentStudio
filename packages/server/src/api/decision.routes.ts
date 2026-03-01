import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { Decision } from '@agent-studio/shared';
import { eventBus } from '../core/event-bus.js';
import { blackboard } from '../core/blackboard.js';

export const decisionRouter = Router();

function rowToDecision(row: typeof schema.decisions.$inferSelect): Decision {
  return {
    id: row.id,
    title: row.title,
    reasoning: row.reasoning,
    proposedBy: row.proposedBy,
    approvedBy: row.approvedBy,
    status: row.status as Decision['status'],
    tags: row.tags as string[],
    taskId: row.taskId,
    createdAt: row.createdAt,
  };
}

// GET /api/decisions
decisionRouter.get('/', (_req, res) => {
  const decisions = db.select().from(schema.decisions).orderBy(desc(schema.decisions.createdAt)).all().map(rowToDecision);
  res.json(decisions);
});

// POST /api/decisions — propose a new decision
decisionRouter.post('/', (req, res) => {
  const { title, reasoning, proposedBy, tags, taskId } = req.body;
  if (!title || !reasoning || !proposedBy) {
    return res.status(400).json({ error: 'title, reasoning, and proposedBy are required' });
  }

  const id = uuid();
  const now = new Date().toISOString();

  db.insert(schema.decisions).values({
    id,
    title,
    reasoning,
    proposedBy,
    approvedBy: null,
    status: 'proposed',
    tags: tags ?? [],
    taskId: taskId ?? null,
    createdAt: now,
  }).run();

  const decision = rowToDecision(db.select().from(schema.decisions).where(eq(schema.decisions.id, id)).get()!);
  eventBus.emit('decision:proposed', { decision });
  res.status(201).json(decision);
});

// POST /api/decisions/:id/approve
decisionRouter.post('/:id/approve', (req, res) => {
  const row = db.select().from(schema.decisions).where(eq(schema.decisions.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: 'Decision not found' });

  db.update(schema.decisions)
    .set({ status: 'approved', approvedBy: 'user' })
    .where(eq(schema.decisions.id, req.params.id))
    .run();

  const decision = rowToDecision(db.select().from(schema.decisions).where(eq(schema.decisions.id, req.params.id)).get()!);

  // Store approved decision in blackboard for agents to reference
  const tags = decision.tags;
  blackboard.set(`decision:${decision.id}`, {
    title: decision.title,
    reasoning: decision.reasoning,
  }, decision.proposedBy, ['decision', ...tags]);

  eventBus.emit('decision:updated', { decision });
  res.json(decision);
});

// POST /api/decisions/:id/reject
decisionRouter.post('/:id/reject', (req, res) => {
  const row = db.select().from(schema.decisions).where(eq(schema.decisions.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: 'Decision not found' });

  db.update(schema.decisions)
    .set({ status: 'rejected', approvedBy: 'user' })
    .where(eq(schema.decisions.id, req.params.id))
    .run();

  const decision = rowToDecision(db.select().from(schema.decisions).where(eq(schema.decisions.id, req.params.id)).get()!);
  eventBus.emit('decision:updated', { decision });
  res.json(decision);
});

// DELETE /api/decisions/:id
decisionRouter.delete('/:id', (req, res) => {
  const row = db.select().from(schema.decisions).where(eq(schema.decisions.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: 'Decision not found' });
  db.delete(schema.decisions).where(eq(schema.decisions.id, req.params.id)).run();
  res.status(204).send();
});
