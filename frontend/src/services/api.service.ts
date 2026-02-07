/**
 * API Client Service
 * Handles all HTTP communication with backend
 */

/**
 * API Client Service
 * Handles all HTTP communication with backend
 */
import type {
  ApiResponse,
  ApiClientConfig,
  ApiRequestOptions,
  QuickQueryRequestBody,
  QuickQueryResponse,
  DropdownResponse,
} from "../types/index.ts";

const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  timeout: 5000,
  retries: 2,
  enableCache: true,
  cacheTtl: 300000, // 5 minutes
};

class ApiClient {
  private config: ApiClientConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate cache key from URL and params
   */
  private getCacheKey(url: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : "";
    return `${url}:${paramStr}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.config.cacheTtl;
  }

  /**
   * Generic fetch wrapper
   */
  private async fetch<T>(
    url: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    const cacheKey = this.getCacheKey(url, options?.body);

    // Check cache for GET requests
    if (
      options?.method !== "POST" &&
      options?.method !== "PUT" &&
      options?.method !== "DELETE" &&
      options?.cache !== false &&
      this.config.enableCache
    ) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.debug(`Cache hit: ${url}`);
        return cached.data as T;
      }
    }

    const fullUrl = `${this.config.baseUrl}${url}`;
    const fetchOptions: RequestInit = {
      method: options?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...this.config.headers,
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    };

    let lastError: Error | null = null;
    let attempt = 0;
    const maxAttempts = (options?.retry ?? this.config.retries) + 1;

    while (attempt < maxAttempts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options?.timeout || this.config.timeout
        );

        const response = await fetch(fullUrl, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Cache successful responses
        if (
          options?.cache !== false &&
          this.config.enableCache &&
          fetchOptions.method === "GET"
        ) {
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
        }

        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        if (attempt < maxAttempts) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Fetch failed");
  }

  /**
   * GET request
   */
  async get<T>(url: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.fetch<T>(url, { ...options, method: "GET" });
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    body?: any,
    options?: Omit<ApiRequestOptions, "method" | "body">
  ) {
    return this.fetch<T>(url, { ...options, method: "POST", body });
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string) {
    if (pattern) {
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export default ApiClient;
