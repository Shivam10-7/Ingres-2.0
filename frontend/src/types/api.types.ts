/**
 * API Type Definitions
 * Request/Response structures for all API endpoints
 */

import type{
  GroundwaterAssessment,
  DropdownOption,
  CascadeDropdownState,
} from "./database.types";
import type{ QuickQueryRequest, QueryMetadata } from "./query.types";

/**
 * Generic API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Paginated API Response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
}

/**
 * Quick Query Request Body
 */
export interface QuickQueryRequestBody extends QuickQueryRequest {
  // Can extend with additional options
  include_metadata?: boolean;
  cache_ttl_seconds?: number;
}

/**
 * Quick Query Response
 */
export interface QuickQueryResponse extends ApiResponse<GroundwaterAssessment[]> {
  success: boolean;
  data: GroundwaterAssessment[];
  sql_query: string;
  execution_time_ms: number;
  rows_returned: number;
  cached: boolean;
}

/**
 * Dropdown Data Request
 */
export interface DropdownRequest {
  state?: string;
  district?: string;
}

/**
 * Dropdown Data Response
 */
export interface DropdownResponse extends ApiResponse<DropdownOption[]> {
  success: boolean;
  data: DropdownOption[];
  type: "states" | "districts" | "blocks" | "years";
}

/**
 * Cascade Dropdowns Response (all at once)
 */
export interface CascadeDropdownsResponse
  extends ApiResponse<CascadeDropdownState> {
  success: boolean;
  data: CascadeDropdownState;
}

/**
 * Error Response
 */
export interface ErrorResponse extends ApiResponse<null> {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Validation Error Response
 */
export interface ValidationErrorResponse extends ErrorResponse {
  code: "VALIDATION_ERROR";
  details: Record<string, string[]>; // Field -> array of error messages
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse extends ApiResponse<{
  status: "healthy" | "degraded" | "unhealthy";
  uptime_ms: number;
  database: boolean;
  cache: boolean;
}> {
  success: boolean;
}

/**
 * API Request Options for client
 */
export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: number;
  cache?: boolean;
  cacheTtl?: number;
}

/**
 * API Client Configuration
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  enableCache: boolean;
  cacheTtl: number;
  headers?: Record<string, string>;
}

/**
 * Batch Query Request
 */
export interface BatchQueryRequest {
  queries: QuickQueryRequest[];
  parallel?: boolean;
  stopOnError?: boolean;
}

/**
 * Batch Query Response
 */
export interface BatchQueryResponse extends ApiResponse<QuickQueryResponse[]> {
  success: boolean;
  data: QuickQueryResponse[];
  failed_count: number;
  total_time_ms: number;
}

/**
 * Export Request
 */
export interface ExportRequest {
  query: QuickQueryRequest;
  format: "csv" | "json" | "xlsx";
  include_metadata?: boolean;
}

/**
 * Export Response
 */
export interface ExportResponse extends ApiResponse<{
  download_url: string;
  file_size: number;
  format: string;
}> {
  success: boolean;
}
