/**
 * Query Service
 * Handles query submission and result management
 */

import type{
  QuickQueryRequest,
  QuickQueryResponse,
  QueryResult,
  QueryMetadata,
  GroundwaterAssessment,
} from "../types/index.ts";
import { apiClient } from "./api.service";

/**
 * Submit quick query to backend
 */
export async function submitQuickQuery(
  query: QuickQueryRequest
): Promise<QueryResult> {
  try {
    const startTime = Date.now();

    const response = await apiClient.post<QuickQueryResponse>(
      "/quick-query",
      query,
      { cache: true }
    );

    if (!response.success) {
      throw new Error(response.error || "Query failed");
    }

    const executionTime = response.execution_time_ms || Date.now() - startTime;

    return {
      success: true,
      data: response.data || [],
      metadata: {
        executed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        sql_query: response.sql_query,
        rows_returned: response.rows_returned || response.data?.length || 0,
        cached: response.cached || false,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Query submission failed: ${errorMessage}`);
  }
}

/**
 * Format query metadata for display
 */
export function formatQueryMetadata(metadata: QueryMetadata): string {
  return `Execution time: ${metadata.execution_time_ms}ms | Rows: ${metadata.rows_returned} | ${
    metadata.cached ? "Cached" : "Fresh"
  }`;
}

/**
 * Export results as CSV
 */
export function exportResultsAsCSV(
  results: GroundwaterAssessment[],
  filename: string = "ingres_query_results.csv"
): void {
  if (!results || results.length === 0) {
    console.warn("No results to export");
    return;
  }

  const headers = Object.keys(results[0]);
  const csvContent = [
    headers.join(","),
    ...results.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof GroundwaterAssessment];
          // Escape quotes and wrap in quotes if contains comma
          return String(value).includes(",")
            ? `"${String(value).replace(/"/g, '""')}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export results as JSON
 */
export function exportResultsAsJSON(
  results: GroundwaterAssessment[],
  metadata?: QueryMetadata,
  filename: string = "ingres_query_results.json"
): void {
  const exportData = {
    metadata,
    results,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculate statistics from results
 */
export function calculateResultsStatistics(
  results: GroundwaterAssessment[]
): {
  totalRows: number;
  avgExtractionStage: number;
  categorization: Record<string, number>;
  safCount: number;
  criticalCount: number;
  overExploitedCount: number;
} {
  const stats = {
    totalRows: results.length,
    avgExtractionStage: 0,
    categorization: {
      Safe: 0,
      "Semi Critical": 0,
      Critical: 0,
      "Over Exploited": 0,
    },
    safCount: 0,
    criticalCount: 0,
    overExploitedCount: 0,
  };

  if (results.length === 0) {
    return stats;
  }

  let totalStage = 0;

  results.forEach((row) => {
    totalStage += row.stage_of_ground_water_extraction_percent || 0;

    const cat = row.categorization;
    stats.categorization[cat]++;

    if (cat === "Safe") stats.safCount++;
    if (cat === "Critical") stats.criticalCount++;
    if (cat === "Over Exploited") stats.overExploitedCount++;
  });

  stats.avgExtractionStage = Math.round(totalStage / results.length);

  return stats;
}

export default {
  submitQuickQuery,
  formatQueryMetadata,
  exportResultsAsCSV,
  exportResultsAsJSON,
  calculateResultsStatistics,
};
