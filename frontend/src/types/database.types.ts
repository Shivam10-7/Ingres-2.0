/**
 * Database Type Definitions
 * Represents INGRES groundwater assessment data schema
 */

/**
 * Core Groundwater Assessment Record
 * Matches the structure from Data2023Final2.csv and Data2024Final2.csv
 */
export interface GroundwaterAssessment {
  // Geographic Information
  state: string;
  district: string;
  assessment_unit_name: string; // Block name - lowest administrative unit
  assessment_unit_type: string; // e.g., "BLOCK"

  // Area & Recharge Metrics
  recharge_worthy_area_ha: number; // Hectares
  total_annual_ground_water_recharge_ham: number; // HAM (Hectare-Acre-Meter)

  // Resource Extraction Metrics
  annual_extractable_ground_water_resource_ham: number; // HAM
  total_ground_water_extraction_ham: number; // HAM

  // Status Indicators
  stage_of_ground_water_extraction_percent: number; // 0-100%
  categorization: "Safe" | "Semi Critical" | "Critical" | "Over Exploited";

  // Temporal
  year: number; // e.g., 2023, 2024
}

/**
 * Filtered query result from dropdown selection
 */
export interface GroundwaterQueryResult extends GroundwaterAssessment {
  // Can be extended with computed fields or normalized values
  categorization_color?: "green" | "yellow" | "orange" | "red";
  extraction_ratio?: number; // (extraction / recharge) * 100
}

/**
 * Dropdown option structure
 */
export interface DropdownOption {
  value: string;
  label: string;
  count?: number; // Number of data points
}

/**
 * Cascade dropdown state
 */
export interface CascadeDropdownState {
  states: DropdownOption[];
  districts: DropdownOption[];
  blocks: DropdownOption[];
  years: number[];
}

/**
 * Categorization mapping for color coding
 */
export const CATEGORIZATION_MAP: Record<
  GroundwaterAssessment["categorization"],
  { color: string; severity: number; description: string }
> = {
  Safe: {
    color: "#10b981",
    severity: 1,
    description: "Groundwater stage < 70%",
  },
  "Semi Critical": {
    color: "#f59e0b",
    severity: 2,
    description: "Groundwater stage 70-90%",
  },
  Critical: {
    color: "#f97316",
    severity: 3,
    description: "Groundwater stage 90-100%",
  },
  "Over Exploited": {
    color: "#ef4444",
    severity: 4,
    description: "Groundwater stage > 100%",
  },
};
