/**
 * Frontend Types - Central Export
 * Re-export all types for convenient importing
 */

// Database types
export type {
  GroundwaterAssessment,
  GroundwaterQueryResult,
  DropdownOption,
  CascadeDropdownState,
} from "./database.types";

export { CATEGORIZATION_MAP } from "./database.types";

// Query types
export type {
  QuickQueryRequest,
  QueryValidation,
  QueryFilterParams,
  SortConfig,
  PaginationConfig,
  QueryMetadata,
  QueryResult,
  QueryState,
  CachedQuery,
  QueryHistoryEntry,
} from "./query.types";

// API types
export type {
  ApiResponse,
  PaginatedApiResponse,
  QuickQueryRequestBody,
  QuickQueryResponse,
  DropdownRequest,
  DropdownResponse,
  CascadeDropdownsResponse,
  ErrorResponse,
  ValidationErrorResponse,
  HealthCheckResponse,
  ApiRequestOptions,
  ApiClientConfig,
  BatchQueryRequest,
  BatchQueryResponse,
  ExportRequest,
  ExportResponse,
} from "./api.types";
