import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { CreateMessageSchema, type AgentMessage } from '@agent-studio/shared';
import { eventBus } from '../core/event-bus.js';

export const messageRouter = Router();

function rowToMessage(row: typeof schema.messages.$inferSelect): AgentMessage {
  return {
    id: row.id,
    fromAgentId: row.fromAgentId,
    toAgentId: row.toAgentId,
    taskId: row.taskId,
    type: row.type as AgentMessage['type'],
    payload: row.payload as Record<string, unknown>,
    timestamp: row.timestamp,
  };
}

// GET /api/messages
messageRouter.get('/', (req, res) => {
  const limit = parseInt(req.query.limit as string ?? '50', 10);
  const messages = db.select().from(schema.messages).orderBy(desc(schema.messages.timestamp)).limit(limit).all().map(rowToMessage);
  res.json(messages);
});

// GET /api/messages?agentId=xxx — filter by agent
messageRouter.get('/by-agent/:agentId', (req, res) => {
  const messages = db.select().from(schema.messages)
    .where(eq(schema.messages.fromAgentId, req.params.agentId))
    .orderBy(desc(schema.messages.timestamp))
    .limit(50)
    .all()
    .map(rowToMessage);
  res.json(messages);
});

// POST /api/messages — send a message
messageRouter.post('/', (req, res) => {
  const parsed = CreateMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.insert(schema.messages).values({
    id,
    fromAgentId: data.fromAgentId,
    toAgentId: data.toAgentId ?? null,
    taskId: data.taskId ?? null,
    type: data.type,
    payload: data.payload,
    timestamp: now,
  }).run();

  const message = rowToMessage(db.select().from(schema.messages).where(eq(schema.messages.id, id)).get()!);
  eventBus.emit('message:sent', { message });
  res.status(201).json(message);
});
