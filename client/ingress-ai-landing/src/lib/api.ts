// legacy backend (Node service) used for auth/chat/etc.
const API_BASE_URL = 'http://localhost:8081';

// python RAG service running via uvicorn
const RAG_API_BASE_URL = 'http://127.0.0.1:8000';

export interface ChatResponse {
  success: boolean;
  // New API shape: response may be a plain string or an object containing both text and optional chart data.
  response?:
    | string
    | {
        response?: string;
        chartdata?: unknown;
        chartData?: unknown;
      };
  markdown_json?: string;
  error?: string;
  message?: string;
}

export interface QuickChatResponse {
  response?: unknown;
  error?: string;
}

/**
 * Sends a chat request with detailed response and visualization options
 * (legacy /chat endpoint, kept for backwards compatibility).
 */
export async function sendChatRequest(
  query: string,
  isDetailedResponseNeeded: boolean,
  isVisualizationNeeded: boolean
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      credentials: 'include', // Include cookies for session management
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        isDetailedResponseNeeded,
        isVisualizationNeeded,
      }),
    });

    if (!response.ok) {
      const errorData: ChatResponse = await response.json();
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        message: errorData.message || 'An error occurred',
      };
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Chat request failed:', error);
    return {
      success: false,
      error: 'Network error',
      message: error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
}

/**
 * Sends a RAG chat request to the Gemini backend (/rag-chat-gemini).
 * payload must include user_query and sql_response (an object).
 */
export async function sendGeminiRagRequest(
  userQuery: string,
  sqlResponse: Record<string, any>
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/rag-chat-gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_query: userQuery,
        sql_response: sqlResponse,
      }),
    });

    if (!response.ok) {
      const errorData: ChatResponse = await response.json();
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        message: errorData.message || 'An error occurred',
      };
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Gemini RAG request failed:', error);
    return {
      success: false,
      error: 'Network error',
      message: error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
}

/**
 * Sends a quick chat request with visualization option only
 */
export async function sendQuickChatRequest(
  query: string,
  isVisualizationNeeded: boolean
): Promise<QuickChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/quickchat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        isVisualizationNeeded,
      }),
    });

    if (!response.ok) {
      const errorData: QuickChatResponse = await response.json();
      return {
        error: `HTTP ${response.status}`,
      };
    }

    const data: QuickChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Quick chat request failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
}

// ============== CHAT HISTORY API ==============

export interface ChatSession {
  _id: string; // The mongodb ObjectId
  chatId: string;
  chatName: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  // New message schema stores an array of objects `{ response, chartData }`.
  content: any;
  timestamp?: string;
}

export interface ChatHistoryResponse {
  _id: string;
  userId: string;
  chatId: string;
  chatName: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export async function createNewChatSession(userId: string, chatName: string = "New Chat"): Promise<ChatSession | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, chatName }),
    });
    if (!res.ok) throw new Error('Failed to create new chat');
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chats/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user chats');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getChatSessionHistory(chatId: string): Promise<ChatHistoryResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chats/messages/${chatId}`);
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function saveChatMessage(chatId: string, role: string, content: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chats/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, role, content }),
    });
    if (!res.ok) throw new Error('Failed to save message');
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const renameChatSession = async (chatId: string, chatName: string) => {
  const res = await fetch(`${API_BASE_URL}/api/chats/rename/${chatId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ chatName })
  });

  return res.json();
};