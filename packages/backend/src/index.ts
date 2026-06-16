import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getEnv } from './config/index.js';
import { prisma, disconnectPrisma } from './db/client.js';
import { createLLMProvider } from './providers/index.js';
import { KnowledgeService } from './services/knowledge.service.js';
import { ConversationService } from './services/conversation.service.js';
import { ChatService } from './services/chat.service.js';
import { createChatRoutes } from './routes/chat.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { logger } from './utils/logger.js';

async function main() {
  // 1. Validate environment
  const env = getEnv();
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV, llmProvider: env.LLM_PROVIDER }, 'Starting server');

  // 2. Test database connection
  await prisma.$connect();
  logger.info('Database connected');

  // 3. Initialize services
  const llmProvider = createLLMProvider(env);
  const knowledgeService = new KnowledgeService();
  const conversationService = new ConversationService();
  const chatService = new ChatService(llmProvider, conversationService, knowledgeService);

  // 4. Create Express app
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: env.NODE_ENV === 'development' ? '*' : ['https://your-deployed-frontend.com'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }));
  app.use(express.json({ limit: '1mb' }));

  // Routes
  app.use('/chat', createChatRoutes(chatService, conversationService));

  // Error handling (must be after routes)
  app.use(notFoundHandler);
  app.use(errorHandler);

  // 5. Start server
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, `Server running on http://localhost:${env.PORT}`);
    logger.info(`Health check: http://localhost:${env.PORT}/chat/health`);
  });

  // 6. Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    server.close();
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
