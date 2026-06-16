import { prisma } from '../db/client.js';
import { logger } from '../utils/logger.js';

interface KnowledgeDoc {
  title: string;
  content: string;
}

/**
 * Knowledge Service — RAG-lite pattern.
 */
export class KnowledgeService {
  async getRelevantContext(userMessage: string): Promise<string | undefined> {
    const keywords = this.extractKeywords(userMessage);
    if (keywords.length === 0) return undefined;

    const docs = await prisma.knowledgeDocument.findMany({
      where: {
        isActive: true,
        OR: keywords.map((kw) => ({
          content: { contains: kw, mode: 'insensitive' as const },
        })),
      },
      take: 3,
      orderBy: { updatedAt: 'desc' },
    });

    if (docs.length === 0) {
      logger.debug({ keywords }, 'No matching knowledge docs found');
      return undefined;
    }

    logger.debug({ keywords, docCount: docs.length }, 'Retrieved knowledge context');
    return docs.map((d: KnowledgeDoc) => `[${d.title}]: ${d.content}`).join('\n\n');
  }

  private extractKeywords(message: string): string[] {
    const stopwords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'you', 'your', 'i', 'my', 'me', 'we', 'our', 'it', 'its',
      'what', 'how', 'when', 'where', 'why', 'which', 'who',
      'can', 'to', 'and', 'or', 'but', 'in', 'on', 'at', 'for',
      'of', 'with', 'from', 'by', 'as', 'this', 'that', 'not', 'no',
    ]);

    return message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w))
      .slice(0, 10);
  }
}
