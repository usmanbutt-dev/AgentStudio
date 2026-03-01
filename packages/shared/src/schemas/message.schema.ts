import { z } from 'zod';

export const messageTypes = [
  'task_request',
  'task_result',
  'clarification',
  'review_feedback',
  'decision_proposal',
  'status_update',
  'error_report',
  'context_share',
] as const;

export const CreateMessageSchema = z.object({
  fromAgentId: z.string().uuid(),
  toAgentId: z.string().uuid().nullable().optional(),
  taskId: z.string().uuid().nullable().optional(),
  type: z.enum(messageTypes),
  payload: z.record(z.unknown()),
});
