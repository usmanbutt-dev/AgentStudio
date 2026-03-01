import type { Provider, AgentConfig } from '@agent-studio/shared';
import { BaseAgentAdapter } from './base-adapter.js';
import { ClaudeAdapter } from './claude-adapter.js';
import { OpenAIAdapter } from './openai-adapter.js';
import { GeminiAdapter } from './gemini-adapter.js';

/**
 * Create an agent adapter for a given provider.
 * OpenAI adapter is reused for ollama, lmstudio, and custom endpoints.
 */
export function createAdapter(provider: Provider, model: string, config: AgentConfig): BaseAgentAdapter {
  switch (provider) {
    case 'claude':
      return new ClaudeAdapter({ apiKey: config.apiKey, model });

    case 'openai':
      return new OpenAIAdapter({ apiKey: config.apiKey, baseUrl: config.baseUrl, model, provider: 'openai' });

    case 'gemini':
      return new GeminiAdapter({ apiKey: config.apiKey, model });

    case 'ollama':
      return new OpenAIAdapter({ baseUrl: config.baseUrl, model, provider: 'ollama' });

    case 'lmstudio':
      return new OpenAIAdapter({ baseUrl: config.baseUrl, model, provider: 'lmstudio' });

    case 'custom':
      return new OpenAIAdapter({ apiKey: config.apiKey, baseUrl: config.baseUrl, model, provider: 'custom' });

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
