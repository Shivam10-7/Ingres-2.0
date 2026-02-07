/**
 * Quick Query Controller
 * Handles quick-chat query requests
 */

import { Request, Response } from "express";
import { QuickQueryRequest, ApiResponse } from "../types/index.js";
import * as queryExecutor from "../services/queryExecutor.service.js";
import { validateQuickQueryRequest } from "../routes/middleware/validation.js";

/**
 * POST /api/v1/quick-query
 * Execute a quick query with form inputs
 */
export async function submitQuickQuery(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validate request
    const validation = validateQuickQueryRequest(req.body);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
      return;
    }

    const query: QuickQueryRequest = req.body;

    // Execute query
    const result = await queryExecutor.executeQuery(query);

    // Send response
    res.status(200).json({
      success: result.success,
      data: result.data,
      sql_query: result.sql_query,
      execution_time_ms: result.execution_time_ms,
      rows_returned: result.rows_returned,
      cached: result.cached,
    });

    console.log(`Query executed: state=${query.state}, rows=${result.rows_returned}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Quick query error:", error);

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

/**
 * GET /api/v1/quick-query/health
 * Health check endpoint
 */
export async function healthCheck(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const stats = queryExecutor.getCacheStats();

    res.status(200).json({
      success: true,
      status: "healthy",
      cache: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * POST /api/v1/quick-query/cache/clear
 * Clear query cache
 */
export async function clearCache(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { pattern } = req.body;
    queryExecutor.clearCache(pattern);

    res.status(200).json({
      success: true,
      message: pattern
        ? `Cache cleared for pattern: ${pattern}`
        : "All cache cleared",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default {
  submitQuickQuery,
  healthCheck,
  clearCache,
};
