/**
 * Chat state management using Svelte 5 runes.
 * Manages messages, loading state, session, and errors.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function createChatStore() {
  let messages = $state<ChatMessage[]>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let sessionId = $state<string | null>(null);

  // Restore sessionId from localStorage on init
  if (typeof window !== 'undefined') {
    sessionId = localStorage.getItem('spur-session-id');
  }

  return {
    get messages() { return messages; },
    get isLoading() { return isLoading; },
    get error() { return error; },
    get sessionId() { return sessionId; },

    addUserMessage(content: string): ChatMessage {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      messages = [...messages, msg];
      return msg;
    },

    addAssistantMessage(content: string): ChatMessage {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      };
      messages = [...messages, msg];
      return msg;
    },

    setLoading(value: boolean) {
      isLoading = value;
    },

    setError(value: string | null) {
      error = value;
    },

    setSessionId(value: string) {
      sessionId = value;
      if (typeof window !== 'undefined') {
        localStorage.setItem('spur-session-id', value);
      }
    },

    loadFromHistory(historyMessages: { id: string; role: string; content: string; createdAt: string }[]) {
      messages = historyMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.createdAt),
        }));
    },

    clearError() {
      error = null;
    },
  };
}

export const chatStore = createChatStore();
