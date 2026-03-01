import { db, schema } from '../db/index.js';
import { eq, like, desc, lt } from 'drizzle-orm';
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
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  startCleanup(intervalMs: number = 60_000) {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => this.removeExpired(), intervalMs);
    log.debug('Blackboard TTL cleanup started');
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  set(key: string, value: unknown, agentId: string, tags: string[] = [], ttlMs?: number) {
    const now = new Date().toISOString();
    const expiresAt = ttlMs ? new Date(Date.now() + ttlMs).toISOString() : null;

    // Upsert by key
    const existing = db.select().from(schema.blackboardEntries).where(eq(schema.blackboardEntries.key, key)).get();

    if (existing) {
      db.update(schema.blackboardEntries)
        .set({ value, agentId, tags, expiresAt, updatedAt: now })
        .where(eq(schema.blackboardEntries.key, key))
        .run();
    } else {
      db.insert(schema.blackboardEntries).values({
        id: uuid(),
        key,
        value,
        agentId,
        tags,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      }).run();
    }

    log.debug(`Set: ${key}`, { agentId });
    eventBus.emit('blackboard:updated', { key, value, agentId });
  }

  get(key: string): unknown | null {
    const entry = db.select().from(schema.blackboardEntries).where(eq(schema.blackboardEntries.key, key)).get();
    if (!entry) return null;
    // Check TTL
    if (entry.expiresAt && new Date(entry.expiresAt) <= new Date()) {
      db.delete(schema.blackboardEntries).where(eq(schema.blackboardEntries.key, key)).run();
      return null;
    }
    return entry.value ?? null;
  }

  private isExpired(entry: { expiresAt?: string | null }): boolean {
    return !!entry.expiresAt && new Date(entry.expiresAt) <= new Date();
  }

  getByTag(tag: string): BlackboardEntry[] {
    const all = db.select().from(schema.blackboardEntries).all();
    return all.filter(e => {
      if (this.isExpired(e)) return false;
      const tags = e.tags as string[];
      return tags.includes(tag);
    }) as BlackboardEntry[];
  }

  getRecent(limit: number = 20): BlackboardEntry[] {
    const rows = db.select()
      .from(schema.blackboardEntries)
      .orderBy(desc(schema.blackboardEntries.updatedAt))
      .limit(limit + 10) // fetch extra to account for expired
      .all();
    return rows.filter(e => !this.isExpired(e)).slice(0, limit) as BlackboardEntry[];
  }

  search(pattern: string): BlackboardEntry[] {
    const rows = db.select()
      .from(schema.blackboardEntries)
      .where(like(schema.blackboardEntries.key, `%${pattern}%`))
      .all();
    return rows.filter(e => !this.isExpired(e)) as BlackboardEntry[];
  }

  delete(key: string) {
    db.delete(schema.blackboardEntries).where(eq(schema.blackboardEntries.key, key)).run();
  }

  removeExpired(): number {
    const now = new Date().toISOString();
    const result = db.delete(schema.blackboardEntries)
      .where(lt(schema.blackboardEntries.expiresAt, now))
      .run();
    const count = result.changes;
    if (count > 0) {
      log.debug(`Removed ${count} expired blackboard entries`);
    }
    return count;
  }
}

export const blackboard = new Blackboard();
