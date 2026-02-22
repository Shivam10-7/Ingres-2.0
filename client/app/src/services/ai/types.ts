/**
 * AI Provider interface — the single contract between UI and data source.
 * Any provider (mock or real) must implement this.
 */

import type { AIChartResponse } from "@/types/chart";

export interface LLMQueryResponse {
  success: boolean;
  data: Record<string, any>[];
  sql_query: string;
  execution_time_ms: number;
  rows_returned: number;
  cached: boolean;
}

export interface AIProvider {
  /** Process a natural language query or LLM response and return chart data */
  query(input: string | LLMQueryResponse): Promise<AIChartResponse>;

  /** Return sample queries for the UI */
  getSampleQueries(): string[];
}

