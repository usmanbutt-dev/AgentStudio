import { z } from 'zod';

export const taskTypes = ['code', 'review', 'debug', 'research', 'refactor', 'test', 'custom'] as const;
export const taskStatuses = ['pending', 'queued', 'assigned', 'in_progress', 'awaiting_approval', 'completed', 'failed'] as const;
export const taskPriorities = ['low', 'medium', 'high', 'critical'] as const;

export const TaskInputSchema = z.object({
  prompt: z.string().min(1),
  context: z.array(z.string()).default([]),
  fromTaskId: z.string().uuid().optional(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(''),
  type: z.enum(taskTypes),
  priority: z.enum(taskPriorities).default('medium'),
  assigneeId: z.string().uuid().nullable().optional(),
  workflowId: z.string().uuid().nullable().optional(),
  dependencies: z.array(z.string().uuid()).default([]),
  input: TaskInputSchema,
  approvalRequired: z.boolean().default(false),
  maxRetries: z.number().min(0).max(10).default(2),
});
