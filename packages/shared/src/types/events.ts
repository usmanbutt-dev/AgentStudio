import type { Agent, AgentStatus } from './agent.js';
import type { Task, TaskOutput } from './task.js';
import type { AgentMessage } from './message.js';
import type { Decision } from './decision.js';

/** Events emitted by the server event bus and forwarded via Socket.io */
export interface ServerToClientEvents {
  'agent:registered': (data: { agent: Agent }) => void;
  'agent:updated': (data: { agent: Agent }) => void;
  'agent:removed': (data: { agentId: string }) => void;
  'agent:status-changed': (data: { agentId: string; status: AgentStatus }) => void;

  'task:created': (data: { task: Task }) => void;
  'task:updated': (data: { task: Task }) => void;
  'task:assigned': (data: { taskId: string; agentId: string }) => void;
  'task:progress': (data: { taskId: string; chunk: string }) => void;
  'task:completed': (data: { taskId: string; output: TaskOutput }) => void;
  'task:failed': (data: { taskId: string; error: string }) => void;
  'task:approval-needed': (data: { taskId: string }) => void;

  'message:sent': (data: { message: AgentMessage }) => void;

  'decision:proposed': (data: { decision: Decision }) => void;
  'decision:updated': (data: { decision: Decision }) => void;

  'blackboard:updated': (data: { key: string; value: unknown; agentId: string }) => void;
}

/** Events sent from client to server */
export interface ClientToServerEvents {
  'task:approve': (data: { taskId: string }) => void;
  'task:reject': (data: { taskId: string; reason: string }) => void;
  'task:cancel': (data: { taskId: string }) => void;

  'decision:approve': (data: { decisionId: string }) => void;
  'decision:reject': (data: { decisionId: string }) => void;

  'agent:move': (data: { agentId: string; position: { x: number; y: number } }) => void;
}
