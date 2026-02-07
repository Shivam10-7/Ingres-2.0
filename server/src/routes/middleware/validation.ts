/**
 * Validation Middleware
 * Validates incoming requests
 */

import { Request, Response, NextFunction } from "express";

/**
 * Validation result structure
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate QuickQueryRequest
 */
export function validateQuickQueryRequest(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.state || typeof data.state !== "string" || !data.state.trim()) {
    errors.state = "State is required and must be a string";
  }

  if (!data.district || typeof data.district !== "string" || !data.district.trim()) {
    errors.district = "District is required and must be a string";
  }

  if (!data.block || typeof data.block !== "string" || !data.block.trim()) {
    errors.block = "Block is required and must be a string";
  }

  if (!Array.isArray(data.years) || data.years.length === 0) {
    errors.years = "Years must be an array with at least one year";
  } else {
    const invalidYears = data.years.filter((y: any) => !Number.isInteger(y));
    if (invalidYears.length > 0) {
      errors.years = "All years must be valid integers";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Middleware: Validate quick query request
 */
export function validateQuickQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const validation = validateQuickQueryRequest(req.body);

  if (!validation.valid) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: validation.errors,
    });
    return;
  }

  next();
}

/**
 * Middleware: Validate dropdown queries
 */
export function validateDropdownQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { state, district } = req.query;

  if (typeof state !== "string" && state !== undefined) {
    res.status(400).json({
      success: false,
      error: "Invalid state parameter",
    });
    return;
  }

  if (typeof district !== "string" && district !== undefined) {
    res.status(400).json({
      success: false,
      error: "Invalid district parameter",
    });
    return;
  }

  next();
}

export default {
  validateQuickQueryRequest,
  validateQuickQuery,
  validateDropdownQuery,
};
