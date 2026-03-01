import type { AgentRole } from './agent.js';
import type { TaskType } from './task.js';

export interface WorkflowStepTemplate {
  id: string;
  role: AgentRole;
  taskTemplate: {
    type: TaskType;
    promptTemplate: string;
    approvalRequired: boolean;
  };
  next: string[];
  condition?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStepTemplate[];
  createdAt: string;
}

export interface WorkflowRun {
  id: string;
  templateId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStepId: string | null;
  taskIds: string[];
  variables: Record<string, string>;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateWorkflowInput {
  name: string;
  description: string;
  steps: WorkflowStepTemplate[];
}
