import { randomUUID } from 'crypto';
import { prisma } from '../db/client.js';
import type { ChatMessage } from '../providers/llm-provider.interface.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const MAX_CONTEXT_MESSAGES = 20;

interface MessageRow {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface MessageSelect {
  role: string;
  content: string;
}

/**
 * Conversation Service — manages conversation lifecycle and message persistence.
 */
export class ConversationService {
  async getOrCreate(sessionId?: string): Promise<{ id: string; sessionId: string }> {
    if (sessionId) {
      const existing = await prisma.conversation.findUnique({
        where: { sessionId },
      });
      if (existing) {
        return { id: existing.id, sessionId: existing.sessionId };
      }
    }

    const newSessionId = sessionId ?? randomUUID();
    const conversation = await prisma.conversation.create({
      data: { sessionId: newSessionId },
    });

    logger.info({ sessionId: conversation.sessionId }, 'New conversation created');
    return { id: conversation.id, sessionId: conversation.sessionId };
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    tokenCount?: number
  ): Promise<void> {
    await prisma.message.create({
      data: { conversationId, role, content, tokenCount },
    });
  }

  async getRecentMessages(conversationId: string, limit: number = MAX_CONTEXT_MESSAGES): Promise<ChatMessage[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { role: true, content: true },
    });

    return messages.reverse().map((m: MessageSelect) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
  }

  async getHistory(sessionId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError(`Conversation not found: ${sessionId}`);
    }

    return {
      sessionId: conversation.sessionId,
      messages: conversation.messages.map((m: MessageRow) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }
}
