import { MODEL_PRICING } from '@agent-studio/shared';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/** Calculate cost in USD for a given model and token usage */
export function calculateCost(model: string, usage: TokenUsage): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal places
}
