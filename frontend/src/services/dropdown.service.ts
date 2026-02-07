/**
 * Dropdown Service
 * Manages dropdown data fetching and caching
 */

import type{
  DropdownOption,
  CascadeDropdownState,
  DropdownResponse,
  CascadeDropdownsResponse,
} from "../types/index.ts";
import { apiClient } from "./api.service";

/**
 * Dropdown data cache
 */
let dropdownCache: CascadeDropdownState | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for states

/**
 * Fetch all states
 */
export async function fetchStates(): Promise<DropdownOption[]> {
  try {
    const response = await apiClient.get<DropdownResponse>(
      "/dropdowns/states",
      { cache: true }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch states");
    }

    return response.data || [];
  } catch (error) {
    console.error("Error fetching states:", error);
    throw error;
  }
}

/**
 * Fetch districts by state
 */
export async function fetchDistricts(
  state: string
): Promise<DropdownOption[]> {
  if (!state) {
    return [];
  }

  try {
    const response = await apiClient.get<DropdownResponse>(
      `/dropdowns/districts?state=${encodeURIComponent(state)}`,
      { cache: true }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch districts");
    }

    return response.data || [];
  } catch (error) {
    console.error(`Error fetching districts for ${state}:`, error);
    throw error;
  }
}

/**
 * Fetch blocks by state and district
 */
export async function fetchBlocks(
  state: string,
  district: string
): Promise<DropdownOption[]> {
  if (!state || !district) {
    return [];
  }

  try {
    const response = await apiClient.get<DropdownResponse>(
      `/dropdowns/blocks?state=${encodeURIComponent(state)}&district=${encodeURIComponent(
        district
      )}`,
      { cache: true }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch blocks");
    }

    return response.data || [];
  } catch (error) {
    console.error(
      `Error fetching blocks for ${state}/${district}:`,
      error
    );
    throw error;
  }
}

/**
 * REVERSE LOOKUP FUNCTIONS
 * Fetch parent data when child is known
 */

/**
 * Fetch states for a specific district
 */
export async function fetchStatesForDistrict(
  district: string
): Promise<DropdownOption[]> {
  if (!district) {
    return [];
  }

  try {
    const response = await apiClient.get<DropdownResponse>(
      `/dropdowns/states-for-district?district=${encodeURIComponent(
        district
      )}`,
      { cache: true }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch states for district");
    }

    return response.data || [];
  } catch (error) {
    console.error(`Error fetching states for ${district}:`, error);
    throw error;
  }
}

/**
 * Fetch districts for a specific block
 */
export async function fetchDistrictsForBlock(
  block: string
): Promise<DropdownOption[]> {
  if (!block) {
    return [];
  }

  try {
    const response = await apiClient.get<DropdownResponse>(
      `/dropdowns/districts-for-block?block=${encodeURIComponent(block)}`,
      { cache: true }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch districts for block");
    }

    return response.data || [];
  } catch (error) {
    console.error(`Error fetching districts for ${block}:`, error);
    throw error;
  }
}

/**
 * Fetch states for a specific block
 */
export async function fetchStatesForBlock(
  block: string
): Promise<DropdownOption[]> {
  if (!block) {
    return [];
  }

  try {
    const response = await apiClient.get<DropdownResponse>(
      `/dropdowns/states-for-block?block=${encodeURIComponent(block)}`,
      { cache: true }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch states for block");
    }

    return response.data || [];
  } catch (error) {
    console.error(`Error fetching states for ${block}:`, error);
    throw error;
  }
}

/**
 * Fetch available years
 */
export async function fetchYears(): Promise<number[]> {
  try {
    const response = await apiClient.get<DropdownResponse>(
      "/dropdowns/years",
      { cache: true }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch years");
    }

    // Convert DropdownOption to numbers
    return response.data?.map((opt) => parseInt(opt.value, 10)) || [];
  } catch (error) {
    console.error("Error fetching years:", error);
    throw error;
  }
}

/**
 * Fetch all dropdowns at once
 */
export async function fetchAllDropdowns(): Promise<CascadeDropdownState> {
  // Check cache
  if (
    dropdownCache &&
    Date.now() - cacheTimestamp < CACHE_TTL
  ) {
    console.debug("Using cached dropdowns");
    return dropdownCache;
  }

  try {
    const response = await apiClient.get<CascadeDropdownsResponse>(
      "/dropdowns/all",
      { cache: true }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch dropdowns");
    }

    if (response.data) {
      dropdownCache = response.data;
      cacheTimestamp = Date.now();
    }

    return response.data || {
      states: [],
      districts: [],
      blocks: [],
      years: [],
    };
  } catch (error) {
    console.error("Error fetching all dropdowns:", error);
    throw error;
  }
}

/**
 * Clear dropdown cache
 */
export function clearDropdownCache(): void {
  dropdownCache = null;
  cacheTimestamp = 0;
  apiClient.clearCache("dropdowns");
}

/**
 * Validate dropdown selection
 */
export function validateDropdownSelection(
  state: string,
  district: string,
  block: string,
  years: number[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // At least state or empty (for "all") must be selected
  // Empty values mean "get all" for that filter

  if (!years || years.length === 0) {
    errors.years = "At least one year must be selected";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export default {
  fetchStates,
  fetchDistricts,
  fetchBlocks,
  fetchYears,
  fetchStatesForDistrict,
  fetchDistrictsForBlock,
  fetchStatesForBlock,
  fetchAllDropdowns,
  clearDropdownCache,
  validateDropdownSelection,
};
