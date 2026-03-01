import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@agent-studio/shared';
import { eventBus } from '../core/event-bus.js';
import { agentRegistry } from '../core/agent-registry.js';
import { orchestrator } from '../core/orchestrator.js';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { createLogger } from '../utils/logger.js';

const log = createLogger('Socket');

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketHandlers(io: TypedServer) {
  // Bridge all event bus events → Socket.io broadcasts
  for (const eventName of eventBus.eventNames) {
    const name = eventName;
    eventBus.on(name, ((data: unknown) => {
      io.emit(name, data as never);
    }) as never);
  }

  io.on('connection', (socket: TypedSocket) => {
    log.info(`Client connected: ${socket.id}`);

    // Handle agent position updates from canvas drag
    socket.on('agent:move', ({ agentId, position }) => {
      agentRegistry.update(agentId, { position });
    });

    // Handle task approvals/rejections
    socket.on('task:approve', ({ taskId }) => {
      log.info(`Task approved: ${taskId}`);
      orchestrator.approveTask(taskId);
    });

    socket.on('task:reject', ({ taskId, reason }) => {
      log.info(`Task rejected: ${taskId} — ${reason}`);
      orchestrator.rejectTask(taskId);
    });

    socket.on('task:cancel', ({ taskId }) => {
      log.info(`Task cancel requested: ${taskId}`);
      const row = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
      if (row && row.status !== 'completed' && row.status !== 'failed') {
        db.update(schema.tasks)
          .set({ status: 'failed', completedAt: new Date().toISOString() })
          .where(eq(schema.tasks.id, taskId))
          .run();
        if (row.assigneeId) {
          agentRegistry.setStatus(row.assigneeId, 'idle');
        }
        eventBus.emit('task:failed', { taskId, error: 'Cancelled by user' });
        log.info(`Task cancelled: ${taskId}`);
      }
    });

    socket.on('decision:approve', ({ decisionId }) => {
      log.info(`Decision approve requested: ${decisionId}`);
      const row = db.select().from(schema.decisions).where(eq(schema.decisions.id, decisionId)).get();
      if (row && row.status === 'proposed') {
        db.update(schema.decisions)
          .set({ status: 'approved', approvedBy: 'user' })
          .where(eq(schema.decisions.id, decisionId))
          .run();
        eventBus.emit('decision:approved' as never, { decisionId } as never);
        log.info(`Decision approved: ${decisionId}`);
      }
    });

    socket.on('decision:reject', ({ decisionId }) => {
      log.info(`Decision reject requested: ${decisionId}`);
      const row = db.select().from(schema.decisions).where(eq(schema.decisions.id, decisionId)).get();
      if (row && row.status === 'proposed') {
        db.update(schema.decisions)
          .set({ status: 'rejected', approvedBy: 'user' })
          .where(eq(schema.decisions.id, decisionId))
          .run();
        eventBus.emit('decision:rejected' as never, { decisionId } as never);
        log.info(`Decision rejected: ${decisionId}`);
      }
    });

    socket.on('disconnect', () => {
      log.info(`Client disconnected: ${socket.id}`);
    });
  });
}
