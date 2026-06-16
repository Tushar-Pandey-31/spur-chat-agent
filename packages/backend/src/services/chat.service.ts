import type { LLMProvider } from '../providers/llm-provider.interface.js';
import type { ConversationService } from './conversation.service.js';
import type { KnowledgeService } from './knowledge.service.js';
import type { SendMessageRequest } from '@spur/shared';
import { logger } from '../utils/logger.js';

export interface ChatReply {
  reply: string;
  sessionId: string;
}

/**
 * Chat Orchestrator — the heart of the application.
 * Coordinates: input validation → knowledge retrieval → conversation context → LLM call → persistence.
 */
export class ChatService {
  constructor(
    private llmProvider: LLMProvider,
    private conversationService: ConversationService,
    private knowledgeService: KnowledgeService
  ) {}

  async handleMessage(input: SendMessageRequest): Promise<ChatReply> {
    // 1. Get or create conversation
    const conversation = await this.conversationService.getOrCreate(input.sessionId);

    // 2. Persist user message
    await this.conversationService.addMessage(conversation.id, 'user', input.message);

    // 3. Retrieve relevant knowledge context (RAG-lite)
    const context = await this.knowledgeService.getRelevantContext(input.message);

    // 4. Build conversation history for LLM context
    const history = await this.conversationService.getRecentMessages(conversation.id);

    // 5. Generate LLM reply
    logger.info(
      { sessionId: conversation.sessionId, hasContext: !!context, historyLength: history.length },
      'Generating reply'
    );

    const llmReply = await this.llmProvider.generateReply(history, input.message, context);

    // 6. Persist assistant reply
    await this.conversationService.addMessage(
      conversation.id,
      'assistant',
      llmReply.content,
      llmReply.tokenUsage.completion
    );

    logger.info(
      {
        sessionId: conversation.sessionId,
        promptTokens: llmReply.tokenUsage.prompt,
        completionTokens: llmReply.tokenUsage.completion,
      },
      'Reply generated'
    );

    return {
      reply: llmReply.content,
      sessionId: conversation.sessionId,
    };
  }
}
