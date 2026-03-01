import OpenAI from 'openai';
import { BaseAgentAdapter, type ExecuteParams, type AgentResponse, type StreamChunk, type ChatMessage } from './base-adapter.js';
import type { Provider } from '@agent-studio/shared';
import { LOCAL_PROVIDER_URLS } from '@agent-studio/shared';
import { createLogger } from '../utils/logger.js';

const log = createLogger('OpenAIAdapter');

/**
 * Works with OpenAI, Ollama, LM Studio, and any OpenAI-compatible endpoint.
 * Set baseUrl to point at local servers.
 */
export class OpenAIAdapter extends BaseAgentAdapter {
  readonly provider: Provider;
  private client: OpenAI;

  constructor(config: { apiKey?: string; baseUrl?: string; model: string; provider?: Provider }) {
    super(config);
    this.provider = config.provider ?? 'openai';

    const baseURL = config.baseUrl
      ?? LOCAL_PROVIDER_URLS[this.provider]
      ?? undefined;

    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || 'not-needed',
      baseURL,
    });
  }

  private toOpenAIMessages(systemPrompt: string, messages: ChatMessage[]): OpenAI.ChatCompletionMessageParam[] {
    const result: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];
    for (const m of messages) {
      if (m.role === 'system') continue;
      result.push({ role: m.role, content: m.content });
    }
    return result;
  }

  async execute(params: ExecuteParams): Promise<AgentResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: params.maxTokens ?? 4096,
        temperature: params.temperature ?? 0.7,
        messages: this.toOpenAIMessages(params.systemPrompt, params.messages),
      });

      const choice = response.choices[0];
      return {
        content: choice?.message?.content ?? '',
        tokenUsage: {
          input: response.usage?.prompt_tokens ?? 0,
          output: response.usage?.completion_tokens ?? 0,
        },
        finishReason: choice?.finish_reason === 'stop' ? 'stop' : 'max_tokens',
      };
    } catch (err) {
      log.error('Execute failed', err);
      throw err;
    }
  }

  async *executeStream(params: ExecuteParams): AsyncGenerator<StreamChunk> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: params.maxTokens ?? 4096,
        temperature: params.temperature ?? 0.7,
        messages: this.toOpenAIMessages(params.systemPrompt, params.messages),
        stream: true,
        stream_options: { include_usage: true },
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield { type: 'text', content: delta.content };
        }
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens ?? 0;
          outputTokens = chunk.usage.completion_tokens ?? 0;
        }
      }

      yield {
        type: 'done',
        content: '',
        tokenUsage: { input: inputTokens, output: outputTokens },
      };
    } catch (err) {
      log.error('Stream failed', err);
      yield { type: 'error', content: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
