import { EventEmitter } from 'events';
import type { ServerToClientEvents } from '@agent-studio/shared';
import { createLogger } from '../utils/logger.js';

const log = createLogger('EventBus');

type EventMap = {
  [K in keyof ServerToClientEvents]: Parameters<ServerToClientEvents[K]>[0];
};

class TypedEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    log.debug(`Event: ${event}`);
    this.emitter.emit(event, data);
  }

  on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void) {
    this.emitter.on(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void) {
    this.emitter.off(event, handler);
  }

  /** Get all event names this bus supports for bridging to Socket.io */
  get eventNames(): (keyof EventMap)[] {
    return [
      'agent:registered', 'agent:updated', 'agent:removed', 'agent:status-changed',
      'task:created', 'task:updated', 'task:assigned', 'task:progress',
      'task:completed', 'task:failed', 'task:approval-needed',
      'message:sent',
      'decision:proposed', 'decision:updated',
      'blackboard:updated',
    ];
  }
}

/** Singleton event bus — all server components emit and listen here */
export const eventBus = new TypedEventBus();
