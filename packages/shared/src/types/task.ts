export type TaskType = 'code' | 'review' | 'debug' | 'research' | 'refactor' | 'test' | 'custom';
export type TaskStatus = 'pending' | 'queued' | 'assigned' | 'in_progress' | 'awaiting_approval' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Artifact {
  type: 'file' | 'diff' | 'code' | 'text' | 'decision';
  path?: string;
  content: string;
}

export interface TaskInput {
  prompt: string;
  context: string[];
  fromTaskId?: string;
}

export interface TaskOutput {
  result: string | null;
  artifacts: Artifact[];
  tokenUsage: { input: number; output: number };
  cost: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  workflowId: string | null;
  dependencies: string[];
  input: TaskInput;
  output: TaskOutput;
  approvalRequired: boolean;
  maxRetries: number;
  retryCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  assigneeId?: string | null;
  workflowId?: string | null;
  dependencies?: string[];
  input: TaskInput;
  approvalRequired?: boolean;
  maxRetries?: number;
}
