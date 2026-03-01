import Anthropic from '@anthropic-ai/sdk';
import { BaseAgentAdapter, type ExecuteParams, type AgentResponse, type StreamChunk, type ChatMessage } from './base-adapter.js';
import type { Provider } from '@agent-studio/shared';
import { createLogger } from '../utils/logger.js';

const log = createLogger('ClaudeAdapter');

export class ClaudeAdapter extends BaseAgentAdapter {
  readonly provider: Provider = 'claude';
  private client: Anthropic;

  constructor(config: { apiKey?: string; model: string }) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  private toAnthropicMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  async execute(params: ExecuteParams): Promise<AgentResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: params.maxTokens ?? 4096,
        temperature: params.temperature ?? 0.7,
        system: params.systemPrompt,
        messages: this.toAnthropicMessages(params.messages),
      });

      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return {
        content,
        tokenUsage: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
        finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'max_tokens',
      };
    } catch (err) {
      log.error('Execute failed', err);
      throw err;
    }
  }

  async *executeStream(params: ExecuteParams): AsyncGenerator<StreamChunk> {
    try {
      const stream = this.client.messages.stream({
        model: this.config.model,
        max_tokens: params.maxTokens ?? 4096,
        temperature: params.temperature ?? 0.7,
        system: params.systemPrompt,
        messages: this.toAnthropicMessages(params.messages),
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { type: 'text', content: event.delta.text };
        }
      }

      const finalMessage = await stream.finalMessage();
      yield {
        type: 'done',
        content: '',
        tokenUsage: {
          input: finalMessage.usage.input_tokens,
          output: finalMessage.usage.output_tokens,
        },
      };
    } catch (err) {
      log.error('Stream failed', err);
      yield { type: 'error', content: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.messages.create({
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
