/**
 * Backend Type Definitions
 * Server-side models and interfaces
 */

/**
 * Database Record - GroundwaterAssessment
 * Represents INGRES database schema
 */
export interface GroundwaterAssessment {
  state: string;
  district: string;
  assessment_unit_name: string; // Block name
  assessment_unit_type: string; // e.g., "BLOCK"
  recharge_worthy_area_ha: number;
  total_annual_ground_water_recharge_ham: number;
  annual_extractable_ground_water_resource_ham: number;
  total_ground_water_extraction_ham: number;
  stage_of_ground_water_extraction_percent: number;
  categorization: "Safe" | "Semi Critical" | "Critical" | "Over Exploited";
  year: number;
}

/**
 * Dropdown option
 */
export interface DropdownOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * Query request from frontend
 */
export interface QuickQueryRequest {
  state: string;
  district: string;
  block: string;
  years: number[];
}

/**
 * Query response to frontend
 */
export interface QuickQueryResponse {
  success: boolean;
  data: GroundwaterAssessment[];
  sql_query: string;
  execution_time_ms: number;
  rows_returned: number;
  cached?: boolean;
}

/**
 * Generic API response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Response shape for dropdown endpoints
 */
export interface DropdownResponse {
  success: boolean;
  data: any;
  type?: "states" | "districts" | "blocks" | "years" | string;
  error?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Query execution info
 */
export interface ExecutionInfo {
  start_time: number;
  end_time?: number;
  duration_ms?: number;
  rows_affected?: number;
  error?: string;
}

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl_ms: number;
  hit_count: number;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connection_pool_size: number;
  connection_timeout_ms: number;
}

/**
 * CSV Data Row (as parsed from CSV)
 */
export interface CSVDataRow {
  [key: string]: string | number;
}

/**
 * Normalized CSV Data (typed)
 */
export interface NormalizedCSVData extends GroundwaterAssessment {
  // Inherits all GroundwaterAssessment fields
}

/**
 * Query Statistics
 */
export interface QueryStats {
  total_queries: number;
  cache_hits: number;
  cache_misses: number;
  avg_response_time_ms: number;
  slowest_query_ms: number;
  fastest_query_ms: number;
}

/**
 * Server Health Status
 */
export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  uptime_ms: number;
  services: {
    database: boolean;
    cache: boolean;
    api: boolean;
  };
  message?: string;
}
