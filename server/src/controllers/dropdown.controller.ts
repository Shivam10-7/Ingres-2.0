/**
 * Dropdown Controller
 * Handles dropdown data requests
 */

import { Request, Response } from "express";
import { ApiResponse, DropdownResponse } from "../types/index.js";
import * as csvLoader from "../services/csv-loader.service.js";

/**
 * GET /api/v1/dropdowns/states
 * Get all available states
 */
export async function getStates(req: Request, res: Response): Promise<void> {
  try {
    const states = csvLoader.getStates();

    res.status(200).json({
      success: true,
      data: states,
      type: "states",
    } as DropdownResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/v1/dropdowns/districts?state={state}
 * Get districts by state
 */
export async function getDistricts(req: Request, res: Response): Promise<void> {
  try {
    const state = req.query.state as string;

    if (!state) {
      res.status(400).json({
        success: false,
        error: "State parameter is required",
      });
      return;
    }

    const districts = csvLoader.getDistricts(state);

    if (districts.length === 0) {
      res.status(404).json({
        success: false,
        error: `No districts found for state: ${state}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: districts,
      type: "districts",
    } as DropdownResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/v1/dropdowns/blocks?state={state}&district={district}
 * Get blocks by state and district
 */
export async function getBlocks(req: Request, res: Response): Promise<void> {
  try {
    const state = req.query.state as string;
    const district = req.query.district as string;

    if (!state || !district) {
      res.status(400).json({
        success: false,
        error: "State and district parameters are required",
      });
      return;
    }

    const blocks = csvLoader.getBlocks(state, district);

    if (blocks.length === 0) {
      res.status(404).json({
        success: false,
        error: `No blocks found for state: ${state}, district: ${district}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: blocks,
      type: "blocks",
    } as DropdownResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/v1/dropdowns/years
 * Get all available years
 */
export async function getYears(req: Request, res: Response): Promise<void> {
  try {
    const years = csvLoader.getYears();

    // Convert to dropdown options
    const yarsOptions = years.map((year) => ({
      value: String(year),
      label: String(year),
    }));

    res.status(200).json({
      success: true,
      data: yarsOptions,
      type: "years",
    } as DropdownResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/v1/dropdowns/states-for-district?district={district}
 * Get states that contain a specific district
 */
export async function getStatesForDistrict(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const district = req.query.district as string;

    if (!district) {
      res.status(400).json({
        success: false,
        error: "District parameter is required",
      });
      return;
    }

    const states = csvLoader.getStatesForDistrict(district);

    res.status(200).json({
      success: true,
      data: states,
      type: "states",
    } as DropdownResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/v1/dropdowns/districts-for-block?block={block}
 * Get districts that contain a specific block
 */
export async function getDistrictsForBlock(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const block = req.query.block as string;

    if (!block) {
      res.status(400).json({
        success: false,
        error: "Block parameter is required",
      });
      return;
    }

    const districts = csvLoader.getDistrictsForBlock(block);

    res.status(200).json({
      success: true,
      data: districts,
      type: "districts",
    } as DropdownResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/v1/dropdowns/states-for-block?block={block}
 * Get states that contain a specific block
 */
export async function getStatesForBlock(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const block = req.query.block as string;

    if (!block) {
      res.status(400).json({
        success: false,
        error: "Block parameter is required",
      });
      return;
    }

    const states = csvLoader.getStatesForBlock(block);

    res.status(200).json({
      success: true,
      data: states,
      type: "states",
    } as DropdownResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/v1/dropdowns/all
 * Get all dropdowns at once
 */
export async function getAllDropdowns(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const states = csvLoader.getStates();
    const years = csvLoader.getYears();

    const yearsOptions = years.map((year) => ({
      value: String(year),
      label: String(year),
    }));

    res.status(200).json({
      success: true,
      data: {
        states,
        districts: [],
        blocks: [],
        years,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default {
  getStates,
  getDistricts,
  getBlocks,
  getYears,
  getAllDropdowns,
  getStatesForDistrict,
  getDistrictsForBlock,
  getStatesForBlock,
};
