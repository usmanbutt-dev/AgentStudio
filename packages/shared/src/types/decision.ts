export type DecisionStatus = 'proposed' | 'approved' | 'rejected';

export interface Decision {
  id: string;
  title: string;
  reasoning: string;
  proposedBy: string;
  approvedBy: string | null;
  status: DecisionStatus;
  tags: string[];
  taskId: string | null;
  createdAt: string;
}

export interface CreateDecisionInput {
  title: string;
  reasoning: string;
  proposedBy: string;
  tags: string[];
  taskId?: string | null;
}
