import { z } from 'zod';

export const agentRoles = ['architect', 'coder', 'reviewer', 'debugger', 'researcher', 'custom'] as const;
export const providers = ['claude', 'openai', 'gemini', 'ollama', 'lmstudio', 'custom'] as const;
export const agentStatuses = ['idle', 'working', 'blocked', 'error', 'offline'] as const;

export const AgentConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  systemPrompt: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(200000).default(4096),
  tools: z.array(z.string()).default([]),
});

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.enum(agentRoles),
  provider: z.enum(providers),
  model: z.string().min(1),
  config: AgentConfigSchema,
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
