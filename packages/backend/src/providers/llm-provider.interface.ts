/**
 * LLM Provider Interface
 * Abstracts LLM calls so we can swap OpenAI ↔ Anthropic with one env var.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMReply {
  content: string;
  tokenUsage: {
    prompt: number;
    completion: number;
  };
}

export interface LLMProvider {
  generateReply(
    history: ChatMessage[],
    userMessage: string,
    systemContext?: string
  ): Promise<LLMReply>;
}
