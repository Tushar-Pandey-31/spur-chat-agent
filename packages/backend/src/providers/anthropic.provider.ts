import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, ChatMessage, LLMReply } from './llm-provider.interface.js';
import { LLMError, LLMRateLimitError, LLMTimeoutError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(config: { apiKey: string; model?: string; maxTokens?: number }) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model ?? 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens ?? 1024;
  }

  async generateReply(
    history: ChatMessage[],
    userMessage: string,
    systemContext?: string
  ): Promise<LLMReply> {
    const system = this.buildSystemPrompt(systemContext);

    // Anthropic uses separate system param, messages must alternate user/assistant
    const messages = this.buildMessages(history, userMessage);

    try {
      logger.debug({ model: this.model, messageCount: messages.length }, 'Calling Anthropic');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system,
        messages,
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock) {
        throw new LLMError('Empty response from Anthropic');
      }

      return {
        content: textBlock.text,
        tokenUsage: {
          prompt: response.usage.input_tokens,
          completion: response.usage.output_tokens,
        },
      };
    } catch (err) {
      if (err instanceof LLMError) throw err;

      if (err instanceof Anthropic.APIError) {
        logger.error({ status: err.status, message: err.message }, 'Anthropic API error');
        if (err.status === 429) throw new LLMRateLimitError();
        if (err.status === 401) throw new LLMError('Invalid API key. Please check your ANTHROPIC_API_KEY.', 401);
        if (err.status === 408) throw new LLMTimeoutError();
        throw new LLMError(`Anthropic error: ${err.message}`, err.status ?? 502);
      }

      throw new LLMError('Failed to generate AI response. Please try again.');
    }
  }

  private buildMessages(history: ChatMessage[], userMessage: string): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = [];

    // Flatten history into Anthropic format, ensuring alternation
    for (const msg of history) {
      if (msg.role === 'system') continue; // system goes in system param
      messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }

    // Ensure last message is user
    if (messages.length > 0 && messages[messages.length - 1]?.role === 'assistant') {
      // If last was assistant, merge user message into the conversation
    }

    messages.push({ role: 'user', content: userMessage });

    // Ensure alternation: collapse consecutive same-role messages
    return messages.reduce<Anthropic.MessageParam[]>((acc, msg) => {
      if (acc.length > 0 && acc[acc.length - 1]?.role === msg.role) {
        const prev = acc[acc.length - 1]!;
        prev.content = `${prev.content}\n\n${msg.content}`;
        return acc;
      }
      acc.push({ ...msg });
      return acc;
    }, []);
  }

  private buildSystemPrompt(context?: string): string {
    const base = `You are a helpful customer support agent for "Spur Shop", a small e-commerce store. Answer clearly and concisely. Be friendly but professional. If you don't know the answer to something, say so honestly rather than making things up. Keep responses under 300 words unless the customer asks for more detail.`;

    return context ? `${base}\n\nRelevant store information:\n${context}` : base;
  }
}
