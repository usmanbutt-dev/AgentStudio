import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@agent-studio/shared';
import { eventBus } from '../core/event-bus.js';
import { agentRegistry } from '../core/agent-registry.js';
import { orchestrator } from '../core/orchestrator.js';
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
      log.info(`Task cancelled: ${taskId}`);
    });

    socket.on('decision:approve', ({ decisionId }) => {
      log.info(`Decision approved: ${decisionId}`);
    });

    socket.on('decision:reject', ({ decisionId }) => {
      log.info(`Decision rejected: ${decisionId}`);
    });

    socket.on('disconnect', () => {
      log.info(`Client disconnected: ${socket.id}`);
    });
  });
}
