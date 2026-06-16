const API_BASE = '/chat';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ChatReply {
  reply: string;
  sessionId: string;
}

export interface HistoryResponse {
  sessionId: string;
  messages: Message[];
}

/**
 * Send a message to the chat API.
 */
export async function sendMessage(message: string, sessionId?: string): Promise<ChatReply> {
  const res = await fetch(`${API_BASE}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: 'Network error' } }));
    throw new Error(error.error?.message ?? `Request failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Load conversation history by sessionId.
 */
export async function loadHistory(sessionId: string): Promise<HistoryResponse> {
  const res = await fetch(`${API_BASE}/history/${sessionId}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: 'Network error' } }));
    throw new Error(error.error?.message ?? `Request failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Health check.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
