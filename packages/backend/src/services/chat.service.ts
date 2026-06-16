import type { LLMProvider } from '../providers/llm-provider.interface.js';
import type { ConversationService } from './conversation.service.js';
import type { KnowledgeService } from './knowledge.service.js';
import type { SendMessageRequest } from '@spur/shared';
import { sanitizeOutput } from '../guardrails/output-sanitizer.js';
import { getFallbackResponse } from '../guardrails/graceful-degradation.js';
import { LLMError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface ChatReply {
  reply: string;
  sessionId: string;
}

/**
 * Chat Orchestrator — the heart of the application.
 * Coordinates: input → knowledge retrieval → context → LLM → sanitization → persistence.
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

    // 5. Generate LLM reply (with graceful degradation)
    logger.info(
      { sessionId: conversation.sessionId, hasContext: !!context, historyLength: history.length },
      'Generating reply'
    );

    let replyContent: string;
    let tokenUsage = { prompt: 0, completion: 0 };

    try {
      const llmReply = await this.llmProvider.generateReply(history, input.message, context);

      // 6. Sanitize LLM output
      replyContent = sanitizeOutput(llmReply.content);
      tokenUsage = llmReply.tokenUsage;
    } catch (err) {
      if (err instanceof LLMError) {
        // Graceful degradation: return a friendly fallback instead of crashing
        logger.warn({ code: err.code, message: err.message }, 'LLM error, using fallback');
        replyContent = getFallbackResponse(err.code);
      } else {
        throw err;
      }
    }

    // 7. Persist assistant reply
    await this.conversationService.addMessage(
      conversation.id,
      'assistant',
      replyContent,
      tokenUsage.completion
    );

    logger.info(
      {
        sessionId: conversation.sessionId,
        promptTokens: tokenUsage.prompt,
        completionTokens: tokenUsage.completion,
      },
      'Reply generated'
    );

    return {
      reply: replyContent,
      sessionId: conversation.sessionId,
    };
  }
}
