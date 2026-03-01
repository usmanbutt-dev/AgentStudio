const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Agents
  getAgents: () => request<import('@agent-studio/shared').Agent[]>('/agents'),
  createAgent: (data: import('@agent-studio/shared').CreateAgentInput) =>
    request<import('@agent-studio/shared').Agent>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (id: string, data: Record<string, unknown>) =>
    request<import('@agent-studio/shared').Agent>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAgent: (id: string) =>
    request<void>(`/agents/${id}`, { method: 'DELETE' }),
  testAgent: (id: string) =>
    request<{ success: boolean; message: string }>(`/agents/${id}/test`, { method: 'POST' }),

  // Tasks
  getTasks: () => request<import('@agent-studio/shared').Task[]>('/tasks'),
  createTask: (data: import('@agent-studio/shared').CreateTaskInput) =>
    request<import('@agent-studio/shared').Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  // Workflows
  getWorkflows: () => request<import('@agent-studio/shared').WorkflowTemplate[]>('/workflows'),
  createWorkflow: (data: import('@agent-studio/shared').CreateWorkflowInput) =>
    request<import('@agent-studio/shared').WorkflowTemplate>('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  deleteWorkflow: (id: string) =>
    request<void>(`/workflows/${id}`, { method: 'DELETE' }),

  // Health
  health: () => request<{ status: string; timestamp: string }>('/health'),
};
