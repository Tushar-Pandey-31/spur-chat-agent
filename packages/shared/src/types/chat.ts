import { z } from 'zod';

// Chat message schema
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().datetime().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Conversation schema
export const conversationSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  messages: z.array(chatMessageSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Conversation = z.infer<typeof conversationSchema>;
