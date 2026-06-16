import type { LLMProvider } from './llm-provider.interface.js';
import { OpenAIProvider } from './openai.provider.js';
import { AnthropicProvider } from './anthropic.provider.js';
import type { Env } from '../config/index.js';
import { logger } from '../utils/logger.js';

export function createLLMProvider(env: Env): LLMProvider {
  const provider = env.LLM_PROVIDER;

  logger.info({ provider, model: env.LLM_MODEL }, 'Initializing LLM provider');

  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider({
        apiKey: env.ANTHROPIC_API_KEY!,
        model: env.LLM_MODEL,
        maxTokens: env.LLM_MAX_TOKENS,
      });

    case 'openai':
    default:
      return new OpenAIProvider({
        apiKey: env.OPENAI_API_KEY!,
        model: env.LLM_MODEL,
        maxTokens: env.LLM_MAX_TOKENS,
        temperature: env.LLM_TEMPERATURE,
      });
  }
}
