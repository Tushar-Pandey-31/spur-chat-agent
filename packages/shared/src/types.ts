export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  messageId: string;
}

export interface HistoryResponse {
  sessionId: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
}

export interface LLMResponse {
  content: string;
  tokenUsage: {
    prompt: number;
    completion: number;
  };
}

export interface LLMProvider {
  generateReply(
    messages: ChatMessage[],
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<LLMResponse>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
