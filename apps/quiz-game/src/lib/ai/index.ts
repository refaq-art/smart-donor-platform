import { MockAIProvider } from './mock-provider';
import { OpenAICompatibleProvider } from './openai-provider';
import type { AIProvider } from './types';

export function getAIProvider(): AIProvider {
  const baseUrl = process.env.AI_PROVIDER_BASE_URL;
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const model = process.env.AI_PROVIDER_MODEL ?? 'gpt-4o-mini';

  if (baseUrl && apiKey) {
    return new OpenAICompatibleProvider(baseUrl, apiKey, model);
  }
  return new MockAIProvider();
}

export type { AIGenerateParams, AIQuestionDraft, AIGenerateOutcome, AIProvider } from './types';
