import { Router } from 'express';
import type { ChatService } from '../services/chat.service.js';
import type { ConversationService } from '../services/conversation.service.js';
import { validate } from '../middleware/validator.js';
import { chatRateLimiter } from '../middleware/rate-limiter.js';
import { sendMessageRequestSchema } from '@spur/shared';
import { checkPromptInjection } from '../guardrails/injection-detector.js';
import { logger } from '../utils/logger.js';

export function createChatRoutes(
  chatService: ChatService,
  conversationService: ConversationService
): Router {
  const router = Router();

  /**
   * POST /chat/message
   * Send a message and get an AI reply.
   */
  router.post(
    '/message',
    chatRateLimiter,
    validate(sendMessageRequestSchema),
    async (req, res, next) => {
      try {
        const { message, sessionId } = req.body;

        // Guardrail: check for prompt injection
        const injectionCheck = checkPromptInjection(message);
        if (injectionCheck.flagged) {
          logger.warn({ message: message.slice(0, 100), patterns: injectionCheck.patterns }, 'Prompt injection detected');
          return res.status(400).json({
            error: {
              code: 'PROMPT_INJECTION_DETECTED',
              message: 'Your message contains content that cannot be processed. Please rephrase your question.',
            },
          });
        }

        const result = await chatService.handleMessage({ message, sessionId });
        return res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * GET /chat/history/:sessionId
   * Retrieve conversation history.
   */
  router.get('/history/:sessionId', async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const history = await conversationService.getHistory(sessionId);
      return res.json(history);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /health
   * Health check endpoint.
   */
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}
