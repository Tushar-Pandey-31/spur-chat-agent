import OpenAI from 'openai';
import type { LLMProvider, ChatMessage, LLMReply } from './llm-provider.interface.js';
import { LLMError, LLMRateLimitError, LLMTimeoutError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: { apiKey: string; model?: string; maxTokens?: number; temperature?: number }) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? 'gpt-4o-mini';
    this.maxTokens = config.maxTokens ?? 1024;
    this.temperature = config.temperature ?? 0.7;
  }

  async generateReply(
    history: ChatMessage[],
    userMessage: string,
    systemContext?: string
  ): Promise<LLMReply> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: this.buildSystemPrompt(systemContext) },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    try {
      logger.debug({ model: this.model, messageCount: messages.length }, 'Calling OpenAI');

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new LLMError('Empty response from OpenAI');
      }

      return {
        content: choice.message.content,
        tokenUsage: {
          prompt: response.usage?.prompt_tokens ?? 0,
          completion: response.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      if (err instanceof LLMError) throw err;

      if (err instanceof OpenAI.APIError) {
        logger.error({ status: err.status, message: err.message }, 'OpenAI API error');
        if (err.status === 429) throw new LLMRateLimitError();
        if (err.status === 401) throw new LLMError('Invalid API key. Please check your OPENAI_API_KEY.', 401);
        if (err.status === 408 || err.code === 'ETIMEDOUT') throw new LLMTimeoutError();
        throw new LLMError(`OpenAI error: ${err.message}`, err.status ?? 502);
      }

      throw new LLMError('Failed to generate AI response. Please try again.');
    }
  }

  private buildSystemPrompt(context?: string): string {
    const base = `You are a helpful customer support agent for "Spur Shop", a small e-commerce store. Answer clearly and concisely. Be friendly but professional. If you don't know the answer to something, say so honestly rather than making things up. Keep responses under 300 words unless the customer asks for more detail.`;

    if (context) {
      return `${base}\n\nRelevant store information:\n${context}`;
    }
    return base;
  }
}
