/**
 * CSV Data Loader Service
 * Loads and manages INGRES groundwater data from CSV files
 */

console.log('[csv-loader] loading module');
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { fileURLToPath } from "url";

import {
  GroundwaterAssessment,
  NormalizedCSVData,
  DropdownOption,
} from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DataCache {
  data: GroundwaterAssessment[];
  lastUpdated: number;
  states: Set<string>;
  districts: Map<string, Set<string>>;
  blocks: Map<string, Set<string>>;
  years: Set<number>;
}

let dataCache: DataCache | null = null;
const CACHE_VALIDITY = 24 * 60 * 60 * 1000; // 24 hours

function parseCSVFile(filePath: string): any[] {
  try {
    let fileContent = fs.readFileSync(filePath, "utf-8");
    // Remove UTF-8 BOM if present
    if (fileContent.charCodeAt(0) === 0xfeff) {
      fileContent = fileContent.slice(1);
    }
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Convert CSV row to GroundwaterAssessment
 */
function normalizeCSVRow(row: any, year: number): GroundwaterAssessment {
  return {
    state: (row["State"] || "").trim(),
    district: (row["District"] || "").trim(),
    assessment_unit_name: (row["Assessment Unit  Name"] || "").trim(),
    assessment_unit_type: (row["Assessment Unit Type"] || "BLOCK").trim(),
    recharge_worthy_area_ha: parseFloat(row["Recharge Worthy Area(Ha)"] || 0),
    total_annual_ground_water_recharge_ham: parseFloat(
      row["Total Annual  Ground Water (Ham) Recharge"] || 0
    ),
    annual_extractable_ground_water_resource_ham: parseFloat(
      row["Annual Extractable Ground Water Resource  (Ham)"] || 0
    ),
    total_ground_water_extraction_ham: parseFloat(
      row["Total   Ground Water Extraction  (Ham)"] || 0
    ),
    stage_of_ground_water_extraction_percent: parseFloat(
      row["Stage of Ground Water  Extraction (%)"] || 0
    ),
    categorization: normalizeCategory(
      row["Categorization"] || ""
    ),
    year,
  };
}

/**
 * Normalize categorization values
 */
function normalizeCategory(
  category: string
): "Safe" | "Semi Critical" | "Critical" | "Over Exploited" {
  const normalized = category.toLowerCase().trim();

  if (normalized.includes("safe")) return "Safe";
  if (normalized.includes("semi")) return "Semi Critical";
  if (normalized.includes("critical") && !normalized.includes("semi"))
    return "Critical";
  if (normalized.includes("over")) return "Over Exploited";

  return "Safe"; // Default
}

export function loadAllData(): GroundwaterAssessment[] {
  // Check cache
  if (dataCache && Date.now() - dataCache.lastUpdated < CACHE_VALIDITY) {
    console.log("Using cached groundwater data");
    return dataCache.data;
  }

  const allData: GroundwaterAssessment[] = [];
  const years = [2023, 2024];
  const baseDataPath = path.join(__dirname, "../../../shared/gdata");

  for (const year of years) {
    const filePath = path.join(
      baseDataPath,
      `Data${year}Final2.csv`
    );

    if (!fs.existsSync(filePath)) {
      console.warn(`Data file not found: ${filePath}`);
      continue;
    }

    console.log(`Loading data from ${filePath}...`);
    const csvRows = parseCSVFile(filePath);
    console.log(`  Parsed ${csvRows.length} rows from CSV`);

    for (const row of csvRows) {
      try {
        const normalized = normalizeCSVRow(row, year);
        allData.push(normalized);
      } catch (error) {
        console.error(`Error normalizing row for ${year}:`, error, "Row:", row);
        // Continue with next row
      }
    }
    console.log(`  Added ${csvRows.length} records from ${year}`);
  }

  // Build index structures
  const states = new Set<string>();
  const districts = new Map<string, Set<string>>();
  const blocks = new Map<string, Set<string>>();
  const yearsSet = new Set<number>();

  console.log(`Building indices from ${allData.length} records...`);
  for (const record of allData) {
    states.add(record.state);
    yearsSet.add(record.year);

    const stateKey = record.state;
    if (!districts.has(stateKey)) {
      districts.set(stateKey, new Set());
    }
    districts.get(stateKey)!.add(record.district);

    const districtKey = `${stateKey}|${record.district}`;
    if (!blocks.has(districtKey)) {
      blocks.set(districtKey, new Set());
    }
    blocks.get(districtKey)!.add(record.assessment_unit_name);
  }

  // Cache the data
  dataCache = {
    data: allData,
    lastUpdated: Date.now(),
    states,
    districts,
    blocks,
    years: yearsSet,
  };

  console.log(`Built indices: ${states.size} states, ${yearsSet.size} years`);
  console.log(`Sample states: ${Array.from(states).slice(0, 3).join(", ")}`);
  console.log(`Loaded ${allData.length} groundwater assessment records`);
  return allData;
}

/**
 * Get all states
 */
export function getStates(): DropdownOption[] {
  if (!dataCache) {
    loadAllData();
  }

  const states = Array.from(dataCache!.states).sort();
  return states.map((state) => ({
    value: state,
    label: state,
  }));
}

/**
 * Get districts by state
 */
export function getDistricts(state: string): DropdownOption[] {
  if (!dataCache) {
    loadAllData();
  }

  const stateDistricts = dataCache!.districts.get(state) || new Set();
  const districts = Array.from(stateDistricts).sort();

  return districts.map((district) => ({
    value: district,
    label: district,
  }));
}

/**
 * Get blocks by state and district
 */
export function getBlocks(state: string, district: string): DropdownOption[] {
  if (!dataCache) {
    loadAllData();
  }

  const key = `${state}|${district}`;
  const stateBlocks = dataCache!.blocks.get(key) || new Set();
  const blocks = Array.from(stateBlocks).sort();

  return blocks.map((block) => ({
    value: block,
    label: block,
  }));
}

/**
 * Get all available years
 */
export function getYears(): number[] {
  if (!dataCache) {
    loadAllData();
  }

  return Array.from(dataCache!.years).sort();
}
/**
 * REVERSE LOOKUP FUNCTIONS
 * Find parent levels when user selects child level first
 */

/**
 * Get states that contain a specific district
 */
export function getStatesForDistrict(district: string): DropdownOption[] {
  if (!dataCache) {
    loadAllData();
  }

  const states: string[] = [];
  dataCache!.districts.forEach((districtSet, state) => {
    if (districtSet.has(district)) {
      states.push(state);
    }
  });

  return states.sort().map((state) => ({
    value: state,
    label: state,
  }));
}

/**
 * Get districts that contain a specific block
 */
export function getDistrictsForBlock(block: string): DropdownOption[] {
  if (!dataCache) {
    loadAllData();
  }

  const districts: string[] = [];
  dataCache!.blocks.forEach((blockSet, key) => {
    if (blockSet.has(block)) {
      const [state, district] = key.split("|");
      districts.push(district);
    }
  });

  return [...new Set(districts)].sort().map((district) => ({
    value: district,
    label: district,
  }));
}

/**
 * Get states that contain a specific block
 */
export function getStatesForBlock(block: string): DropdownOption[] {
  if (!dataCache) {
    loadAllData();
  }

  const states: string[] = [];
  dataCache!.blocks.forEach((blockSet, key) => {
    if (blockSet.has(block)) {
      const [state] = key.split("|");
      states.push(state);
    }
  });

  return [...new Set(states)].sort().map((state) => ({
    value: state,
    label: state,
  }));
}

/**
 * Overload: Get districts for block when state is known
 */
export function getDistrictsForBlockInState(
  block: string,
  state: string
): DropdownOption[] {
  if (!dataCache) {
    loadAllData();
  }

  const districts: string[] = [];
  dataCache!.blocks.forEach((blockSet, key) => {
    if (blockSet.has(block)) {
      const [blockState, district] = key.split("|");
      if (blockState === state) {
        districts.push(district);
      }
    }
  });

  return districts.map((district) => ({
    value: district,
    label: district,
  }));
}
/**
 * Query data by filters
 */
export function queryData(
  state: string,
  district: string,
  block: string,
  years: number[]
): GroundwaterAssessment[] {
  if (!dataCache) {
    loadAllData();
  }

  const results = dataCache!.data.filter(
    (record) =>
      (state === "" || record.state === state) &&
      (district === "" || record.district === district) &&
      (block === "" || record.assessment_unit_name === block) &&
      (years.length === 0 || years.includes(record.year))
  );

  return results;
}

/**
 * Clear cache
 */
export function clearCache(): void {
  dataCache = null;
  console.log("Data cache cleared");
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  if (!dataCache) {
    return { cached: false };
  }

  return {
    cached: true,
    records: dataCache.data.length,
    states: dataCache.states.size,
    lastUpdated: new Date(dataCache.lastUpdated).toISOString(),
  };
}

export default {
  loadAllData,
  getStates,
  getDistricts,
  getBlocks,
  getYears,
  getStatesForDistrict,
  getDistrictsForBlock,
  getStatesForBlock,
  getDistrictsForBlockInState,
  queryData,
  clearCache,
  getCacheStats,
};
