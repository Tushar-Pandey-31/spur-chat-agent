import rateLimit from 'express-rate-limit';
import { getEnv } from '../config/index.js';

const env = getEnv();

export const chatRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many messages. Please slow down and try again shortly.',
    },
  },
  keyGenerator: (req) => {
    // Rate limit per session if available, otherwise per IP
    return (req.body?.sessionId as string) ?? req.ip ?? 'unknown';
  },
});
