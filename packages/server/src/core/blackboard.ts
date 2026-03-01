import { db, schema } from '../db/index.js';
import { eq, like, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { eventBus } from './event-bus.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('Blackboard');

export interface BlackboardEntry {
  id: string;
  key: string;
  value: unknown;
  agentId: string | null;
  tags: string[];
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

class Blackboard {
  set(key: string, value: unknown, agentId: string, tags: string[] = []) {
    const now = new Date().toISOString();

    // Upsert by key
    const existing = db.select().from(schema.blackboardEntries).where(eq(schema.blackboardEntries.key, key)).get();

    if (existing) {
      db.update(schema.blackboardEntries)
        .set({ value, agentId, tags, updatedAt: now })
        .where(eq(schema.blackboardEntries.key, key))
        .run();
    } else {
      db.insert(schema.blackboardEntries).values({
        id: uuid(),
        key,
        value,
        agentId,
        tags,
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      }).run();
    }

    log.debug(`Set: ${key}`, { agentId });
    eventBus.emit('blackboard:updated', { key, value, agentId });
  }

  get(key: string): unknown | null {
    const entry = db.select().from(schema.blackboardEntries).where(eq(schema.blackboardEntries.key, key)).get();
    return entry?.value ?? null;
  }

  getByTag(tag: string): BlackboardEntry[] {
    // SQLite JSON array contains check — tags is stored as JSON array
    const all = db.select().from(schema.blackboardEntries).all();
    return all.filter(e => {
      const tags = e.tags as string[];
      return tags.includes(tag);
    }) as BlackboardEntry[];
  }

  getRecent(limit: number = 20): BlackboardEntry[] {
    return db.select()
      .from(schema.blackboardEntries)
      .orderBy(desc(schema.blackboardEntries.updatedAt))
      .limit(limit)
      .all() as BlackboardEntry[];
  }

  search(pattern: string): BlackboardEntry[] {
    return db.select()
      .from(schema.blackboardEntries)
      .where(like(schema.blackboardEntries.key, `%${pattern}%`))
      .all() as BlackboardEntry[];
  }

  delete(key: string) {
    db.delete(schema.blackboardEntries).where(eq(schema.blackboardEntries.key, key)).run();
  }
}

export const blackboard = new Blackboard();
