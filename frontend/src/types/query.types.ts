/**
 * Query Type Definitions
 * Handles query requests, filters, and related operations
 */

import { GroundwaterAssessment } from "./database.types";

/**
 * Quick Chat Query Request
 * Form-based structured query with dropdown selections
 */
export interface QuickQueryRequest {
  state: string;
  district: string;
  block: string; // assessment_unit_name
  years: number[]; // e.g., [2023, 2024]
}

/**
 * Query Validation State
 */
export interface QueryValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Query Parameters for filtering
 */
export interface QueryFilterParams {
  state?: string;
  district?: string;
  block?: string;
  year?: number;
  years?: number[];
  categorization?: string;
  min_stage?: number; // Min extraction stage %
  max_stage?: number; // Max extraction stage %
}

/**
 * Sort configuration for results
 */
export interface SortConfig {
  field: keyof GroundwaterAssessment;
  direction: "asc" | "desc";
}

/**
 * Pagination config for large result sets
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
}

/**
 * Query execution metadata
 */
export interface QueryMetadata {
  executed_at: string; // ISO timestamp
  execution_time_ms: number;
  sql_query: string;
  rows_returned: number;
  cached: boolean;
  cache_key?: string;
}

/**
 * Complete query result with metadata
 */
export interface QueryResult {
  success: boolean;
  data: GroundwaterAssessment[];
  metadata: QueryMetadata;
  message?: string;
}

/**
 * Query state for component management
 */
export interface QueryState {
  loading: boolean;
  error: string | null;
  results: GroundwaterAssessment[];
  metadata: QueryMetadata | null;
  lastQuery: QuickQueryRequest | null;
}

/**
 * Cached query entry
 */
export interface CachedQuery {
  key: string; // hash of query params
  data: GroundwaterAssessment[];
  timestamp: number;
  ttl_ms: number; // Time to live in milliseconds
}

/**
 * Query history entry for audit
 */
export interface QueryHistoryEntry {
  id: string;
  query: QuickQueryRequest;
  timestamp: string;
  execution_time_ms: number;
  rows_returned: number;
  user_id?: string;
}
