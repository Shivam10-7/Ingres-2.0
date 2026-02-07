/**
 * Query Executor Service
 * Handles query execution, caching, and formatting
 */
console.log('[query-executor] loading module');

import {
  GroundwaterAssessment,
  QuickQueryRequest,
  QuickQueryResponse,
  ExecutionInfo,
  CacheEntry,
} from "../types/index.js";
import * as csvLoader from "./csv-loader.service.js";

interface QueryCache {
  [key: string]: CacheEntry<GroundwaterAssessment[]>;
}

const queryCache: QueryCache = {};
const QUERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from query params
 */
function generateCacheKey(
  state: string,
  district: string,
  block: string,
  years: number[]
): string {
  const yearsStr = years.sort().join(",");
  return `${state}|${district}|${block}|${yearsStr}`;
}

/**
 * Check if cache entry is valid
 */
function isCacheValid(entry: CacheEntry<any>): boolean {
  return Date.now() - entry.timestamp < entry.ttl_ms;
}

/**
 * Execute query
 */
export async function executeQuery(
  request: QuickQueryRequest
): Promise<QuickQueryResponse> {
  const cacheKey = generateCacheKey(
    request.state,
    request.district,
    request.block,
    request.years
  );

  // Check cache
  const cached = queryCache[cacheKey];
  if (cached && isCacheValid(cached)) {
    console.log(`Cache HIT for key: ${cacheKey}`);
    cached.hit_count++;
    return {
      success: true,
      data: cached.data,
      sql_query: generateSQL(request),
      execution_time_ms: 0,
      rows_returned: cached.data.length,
      cached: true,
    };
  }

  // Execute query
  const executionInfo: ExecutionInfo = {
    start_time: Date.now(),
  };

  try {
    const results = csvLoader.queryData(
      request.state,
      request.district,
      request.block,
      request.years
    );

    executionInfo.end_time = Date.now();
    executionInfo.duration_ms = executionInfo.end_time - executionInfo.start_time;
    executionInfo.rows_affected = results.length;

    // Cache the results
    queryCache[cacheKey] = {
      key: cacheKey,
      data: results,
      timestamp: Date.now(),
      ttl_ms: QUERY_CACHE_TTL,
      hit_count: 0,
    };

    console.log(
      `Cache MISS for key: ${cacheKey}, executed in ${executionInfo.duration_ms}ms`
    );

    return {
      success: true,
      data: results,
      sql_query: generateSQL(request),
      execution_time_ms: executionInfo.duration_ms!,
      rows_returned: results.length,
      cached: false,
    };
  } catch (error) {
    executionInfo.error = error instanceof Error ? error.message : String(error);
    console.error("Query execution error:", executionInfo.error);
    throw error;
  }
}

/**
 * Generate SQL query string (for transparency)
 */
export function generateSQL(request: QuickQueryRequest): string {
  const yearsPlaceholder = request.years.map((y) => `'${y}'`).join(", ");

  return `
SELECT * FROM groundwater_assessments
WHERE state = '${request.state}'
  AND district = '${request.district}'
  AND assessment_unit_name = '${request.block}'
  AND year IN (${yearsPlaceholder})
ORDER BY year DESC, categorization;
  `.trim();
}

/**
 * Clear cache
 */
export function clearCache(pattern?: string): void {
  if (pattern) {
    for (const key in queryCache) {
      if (key.includes(pattern)) {
        delete queryCache[key];
      }
    }
    console.log(`Cache cleared for pattern: ${pattern}`);
  } else {
    Object.keys(queryCache).forEach((key) => delete queryCache[key]);
    console.log("All query cache cleared");
  }
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  let totalHits = 0;
  let totalEntries = 0;

  for (const key in queryCache) {
    if (isCacheValid(queryCache[key])) {
      totalEntries++;
      totalHits += queryCache[key].hit_count;
    } else {
      delete queryCache[key];
    }
  }

  return {
    cached_entries: totalEntries,
    total_hits: totalHits,
    cache_ttl_ms: QUERY_CACHE_TTL,
    cache_size_approximate: Object.keys(queryCache).length,
  };
}

/**
 * Prefill cache with common queries (optional)
 */
export async function prewarmCache(queries: QuickQueryRequest[]): Promise<void> {
  console.log(`Prewarming cache with ${queries.length} queries...`);

  for (const query of queries) {
    try {
      await executeQuery(query);
    } catch (error) {
      console.error("Error prewarming cache:", error);
    }
  }

  console.log("Cache prewarming complete");
}

export default {
  executeQuery,
  generateSQL,
  clearCache,
  getCacheStats,
  prewarmCache,
};
