import type { AgentRole, Provider } from './types/agent.js';

/** Colors for agent roles on the canvas */
export const ROLE_COLORS: Record<AgentRole, string> = {
  architect: '#3B82F6',   // blue
  coder: '#22C55E',       // green
  reviewer: '#F97316',    // orange
  debugger: '#EF4444',    // red
  researcher: '#A855F7',  // purple
  custom: '#6B7280',      // gray
};

/** Display labels for roles */
export const ROLE_LABELS: Record<AgentRole, string> = {
  architect: 'Architect',
  coder: 'Coder',
  reviewer: 'Reviewer',
  debugger: 'Debugger',
  researcher: 'Researcher',
  custom: 'Custom',
};

/** Display labels for providers */
export const PROVIDER_LABELS: Record<Provider, string> = {
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI',
  gemini: 'Gemini (Google)',
  ollama: 'Ollama (Local)',
  lmstudio: 'LM Studio (Local)',
  custom: 'Custom Endpoint',
};

/** Default models per provider */
export const DEFAULT_MODELS: Record<Provider, string> = {
  claude: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
  ollama: 'llama3.1',
  lmstudio: 'local-model',
  custom: 'custom-model',
};

/** Default system prompts per role */
export const DEFAULT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  architect: 'You are a software architect. Analyze requirements, design system architecture, define interfaces, and create implementation plans. Focus on scalability, maintainability, and clean separation of concerns.',
  coder: 'You are a software developer. Write clean, well-structured code based on specifications. Follow best practices, include error handling, and write code that is easy to understand and maintain.',
  reviewer: 'You are a code reviewer. Review code for bugs, security issues, performance problems, and adherence to best practices. Provide specific, actionable feedback with suggested fixes.',
  debugger: 'You are a debugging specialist. Analyze error messages, stack traces, and code to identify root causes. Propose targeted fixes and explain why the bug occurred.',
  researcher: 'You are a technical researcher. Investigate technologies, APIs, libraries, and patterns. Provide concise summaries with pros, cons, and recommendations.',
  custom: 'You are a helpful AI assistant.',
};

/** Default base URLs for local providers */
export const LOCAL_PROVIDER_URLS: Partial<Record<Provider, string>> = {
  ollama: 'http://localhost:11434/v1',
  lmstudio: 'http://localhost:1234/v1',
};

/** Cost per 1M tokens (input/output) for common models — used for cost tracking */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-opus-4-20250514': { input: 15, output: 75 },
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-haiku-4-20250506': { input: 0.80, output: 4 },
  // OpenAI
  'gpt-4o': { input: 2.50, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'o3-mini': { input: 1.10, output: 4.40 },
  // Google
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
};
