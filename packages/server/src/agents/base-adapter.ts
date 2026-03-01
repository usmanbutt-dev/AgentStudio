import type { Provider } from '@agent-studio/shared';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'done' | 'error';
  content: string;
  tokenUsage?: { input: number; output: number };
}

export interface AgentResponse {
  content: string;
  tokenUsage: { input: number; output: number };
  finishReason: 'stop' | 'tool_use' | 'max_tokens' | 'error';
}

export interface ExecuteParams {
  systemPrompt: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseAgentAdapter {
  abstract readonly provider: Provider;

  constructor(
    public readonly config: {
      apiKey?: string;
      baseUrl?: string;
      model: string;
    },
  ) {}

  /** Execute a prompt and return a complete response */
  abstract execute(params: ExecuteParams): Promise<AgentResponse>;

  /** Execute a prompt and stream chunks back */
  abstract executeStream(params: ExecuteParams): AsyncGenerator<StreamChunk>;

  /** Test the connection to the provider */
  abstract ping(): Promise<boolean>;
}
