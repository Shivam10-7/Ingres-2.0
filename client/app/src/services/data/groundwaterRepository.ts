/**
 * Groundwater data repository — loads, parses, and aggregates CSV data.
 * Lazy-loads on first access and caches the result.
 */

import { parseCSV } from "./csvParser";
import type { GroundwaterRecord, StateAggregate } from "@/types/groundwater";

const CSV_PATH = "/data/groundwater-2024.csv";

let cachedRecords: GroundwaterRecord[] | null = null;

function mapRow(row: string[]): GroundwaterRecord {
  return {
    slNo: parseInt(row[0], 10) || 0,
    state: row[1] ?? "",
    district: row[2] ?? "",
    assessmentUnitName: row[3] ?? "",
    assessmentUnitType: row[4] ?? "",
    rechargeWorthyArea: parseFloat(row[5]) || 0,
    totalAnnualRecharge: parseFloat(row[6]) || 0,
    annualExtractable: parseFloat(row[7]) || 0,
    totalExtraction: parseFloat(row[8]) || 0,
    stageOfExtraction: parseFloat(row[9]) || 0,
    categorization: row[10] ?? "Safe",
  };
}

export async function getAllRecords(): Promise<GroundwaterRecord[]> {
  if (cachedRecords) return cachedRecords;

  const response = await fetch(CSV_PATH);
  const text = await response.text();
  const { rows } = parseCSV(text);
  cachedRecords = rows.map(mapRow);
  return cachedRecords;
}

export async function getStateAggregates(): Promise<StateAggregate[]> {
  const records = await getAllRecords();
  const stateMap = new Map<string, StateAggregate>();

  for (const r of records) {
    const existing = stateMap.get(r.state);
    if (existing) {
      existing.totalRecharge += r.totalAnnualRecharge;
      existing.totalExtractable += r.annualExtractable;
      existing.totalExtraction += r.totalExtraction;
      existing.avgStage += r.stageOfExtraction;
      existing.unitCount += 1;
      existing.categoryBreakdown[r.categorization] =
        (existing.categoryBreakdown[r.categorization] ?? 0) + 1;
    } else {
      stateMap.set(r.state, {
        state: r.state,
        totalRecharge: r.totalAnnualRecharge,
        totalExtractable: r.annualExtractable,
        totalExtraction: r.totalExtraction,
        avgStage: r.stageOfExtraction,
        unitCount: 1,
        categoryBreakdown: { [r.categorization]: 1 },
      });
    }
  }

  // Finalize averages
  for (const agg of stateMap.values()) {
    agg.avgStage = Math.round((agg.avgStage / agg.unitCount) * 100) / 100;
    agg.totalRecharge = Math.round(agg.totalRecharge * 100) / 100;
    agg.totalExtractable = Math.round(agg.totalExtractable * 100) / 100;
    agg.totalExtraction = Math.round(agg.totalExtraction * 100) / 100;
  }

  return Array.from(stateMap.values()).sort(
    (a, b) => b.totalExtraction - a.totalExtraction
  );
}

export async function getRecordsByState(
  state: string
): Promise<GroundwaterRecord[]> {
  const records = await getAllRecords();
  const lowerState = state.toLowerCase();
  return records.filter((r) => r.state.toLowerCase().includes(lowerState));
}

export async function getCategorizationSummary(): Promise<
  Record<string, number>
> {
  const records = await getAllRecords();
  const summary: Record<string, number> = {};
  for (const r of records) {
    summary[r.categorization] = (summary[r.categorization] ?? 0) + 1;
  }
  return summary;
}
