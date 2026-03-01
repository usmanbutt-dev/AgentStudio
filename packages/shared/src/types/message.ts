export type MessageType =
  | 'task_request'
  | 'task_result'
  | 'clarification'
  | 'review_feedback'
  | 'decision_proposal'
  | 'status_update'
  | 'error_report'
  | 'context_share';

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string | null;
  taskId: string | null;
  type: MessageType;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface CreateMessageInput {
  fromAgentId: string;
  toAgentId?: string | null;
  taskId?: string | null;
  type: MessageType;
  payload: Record<string, unknown>;
}
