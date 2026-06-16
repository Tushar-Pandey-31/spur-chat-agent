import { z } from 'zod';

// POST /chat/message request
export const sendMessageRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message too long').trim(),
  sessionId: z.string().uuid().optional(),
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

// POST /chat/message response
export const sendMessageResponseSchema = z.object({
  reply: z.string(),
  sessionId: z.string(),
});

export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;

// GET /chat/history response
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  createdAt: z.string().datetime(),
});

export type MessageDto = z.infer<typeof messageSchema>;

export const historyResponseSchema = z.object({
  sessionId: z.string(),
  messages: z.array(messageSchema),
});

export type HistoryResponse = z.infer<typeof historyResponseSchema>;

// Error response
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
