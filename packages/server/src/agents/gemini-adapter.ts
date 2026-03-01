import { GoogleGenAI } from '@google/genai';
import { BaseAgentAdapter, type ExecuteParams, type AgentResponse, type StreamChunk, type ChatMessage } from './base-adapter.js';
import type { Provider } from '@agent-studio/shared';
import { createLogger } from '../utils/logger.js';

const log = createLogger('GeminiAdapter');

export class GeminiAdapter extends BaseAgentAdapter {
  readonly provider: Provider = 'gemini';
  private client: GoogleGenAI;

  constructor(config: { apiKey?: string; model: string }) {
    super(config);
    this.client = new GoogleGenAI({
      apiKey: config.apiKey || process.env.GOOGLE_AI_API_KEY || '',
    });
  }

  private toGeminiContents(messages: ChatMessage[]) {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: m.content }],
      }));
  }

  async execute(params: ExecuteParams): Promise<AgentResponse> {
    try {
      const response = await this.client.models.generateContent({
        model: this.config.model,
        contents: this.toGeminiContents(params.messages),
        config: {
          maxOutputTokens: params.maxTokens ?? 4096,
          temperature: params.temperature ?? 0.7,
          systemInstruction: params.systemPrompt,
        },
      });

      const text = response.text ?? '';
      const usage = response.usageMetadata;

      return {
        content: text,
        tokenUsage: {
          input: usage?.promptTokenCount ?? 0,
          output: usage?.candidatesTokenCount ?? 0,
        },
        finishReason: 'stop',
      };
    } catch (err) {
      log.error('Execute failed', err);
      throw err;
    }
  }

  async *executeStream(params: ExecuteParams): AsyncGenerator<StreamChunk> {
    try {
      const response = await this.client.models.generateContentStream({
        model: this.config.model,
        contents: this.toGeminiContents(params.messages),
        config: {
          maxOutputTokens: params.maxTokens ?? 4096,
          temperature: params.temperature ?? 0.7,
          systemInstruction: params.systemPrompt,
        },
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
          yield { type: 'text', content: text };
        }
        if (chunk.usageMetadata) {
          inputTokens = chunk.usageMetadata.promptTokenCount ?? 0;
          outputTokens = chunk.usageMetadata.candidatesTokenCount ?? 0;
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
      await this.client.models.generateContent({
        model: this.config.model,
        contents: 'ping',
      });
      return true;
    } catch {
      return false;
    }
  }
}
