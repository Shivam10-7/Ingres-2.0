import { API_BASE_URL, RAG_API_BASE_URL } from "@/lib/config";

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('authToken');
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

export interface GwraLocationsResponse {
  states?: string[];
  state?: string;
  city?: string;
  cities?: string[];
  assessmentUnits?: string[];
  error?: string;
}

export interface GwraMapSummary {
  name: string;
  state?: string;
  recharge: number;
  extractable: number;
  extraction: number;
  unitCount: number;
  worstCategory: string;
  categoryRank: number;
  stage: number;
  status: string;
}

export interface GwraMapDataResponse {
  source?: string;
  generatedAt?: string;
  states?: Record<string, GwraMapSummary>;
  districts?: Record<string, GwraMapSummary>;
  error?: string;
}

const normalizeChatQueryForBackend = (query: string) => {
  if (typeof query !== 'string') return query;

  return query
    .replace(/\bground\s+water\s+level\b/gi, 'stage of groundwater extraction')
    .replace(/\bgroundwater\s+level\b/gi, 'stage of groundwater extraction')
    .replace(/\bgroundwater_level\b/gi, 'stage of groundwater extraction')
    .replace(/\bgujrat\b/gi, 'Gujarat');
};

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
    const backendQuery = normalizeChatQueryForBackend(query);

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      credentials: 'include', // Include cookies for session management
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        query: backendQuery,
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
        ...getAuthHeaders(),
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
        ...getAuthHeaders(),
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

export async function getGwraLocations(
  state?: string,
  city?: string
): Promise<GwraLocationsResponse> {
  try {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (city) params.set('city', city);

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/gwra/locations${suffix}`);

    if (!response.ok) {
      return {
        error: `HTTP ${response.status}`,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('GWRA location request failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to load GWRA location data',
    };
  }
}

export async function getGwraMapData(): Promise<GwraMapDataResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gwra/map-data`);

    if (!response.ok) {
      return {
        error: `HTTP ${response.status}`,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('GWRA map data request failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to load GWRA map data',
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
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
    const res = await fetch(`${API_BASE_URL}/api/chats/${userId}`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to fetch user chats');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getChatSessionHistory(chatId: string): Promise<ChatHistoryResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chats/messages/${chatId}`, {
      headers: { ...getAuthHeaders() },
    });
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
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ chatName })
  });

  return res.json();
};
