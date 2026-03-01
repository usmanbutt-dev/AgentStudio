export type AgentRole = 'architect' | 'coder' | 'reviewer' | 'debugger' | 'researcher' | 'custom';
export type Provider = 'claude' | 'openai' | 'gemini' | 'ollama' | 'lmstudio' | 'custom';
export type AgentStatus = 'idle' | 'working' | 'blocked' | 'error' | 'offline';

export interface AgentConfig {
  apiKey?: string;
  baseUrl?: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
}

export interface AgentStats {
  tasksCompleted: number;
  totalTokensUsed: number;
  totalCost: number;
  avgResponseTime: number;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  provider: Provider;
  model: string;
  status: AgentStatus;
  config: AgentConfig;
  stats: AgentStats;
  position: { x: number; y: number };
  createdAt: string;
}

export interface CreateAgentInput {
  name: string;
  role: AgentRole;
  provider: Provider;
  model: string;
  config: AgentConfig;
  position?: { x: number; y: number };
}
