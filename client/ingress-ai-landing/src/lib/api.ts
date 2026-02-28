const API_BASE_URL = 'http://localhost:8081';

export interface ChatResponse {
  success: boolean;
  response?: unknown;
  error?: string;
  message?: string;
}

export interface QuickChatResponse {
  response?: unknown;
  error?: string;
}

/**
 * Sends a chat request with detailed response and visualization options
 */
export async function sendChatRequest(
  query: string,
  isDetailedResponseNeeded: boolean,
  isVisualizationNeeded: boolean
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
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