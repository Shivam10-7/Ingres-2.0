/** Domain types for groundwater assessment data (CGWB 2024 schema) */

export interface GroundwaterRecord {
  slNo: number;
  state: string;
  district: string;
  assessmentUnitName: string;
  assessmentUnitType: string;
  rechargeWorthyArea: number;
  totalAnnualRecharge: number;
  annualExtractable: number;
  totalExtraction: number;
  stageOfExtraction: number;
  categorization: string;
}

export type Categorization =
  | "Safe"
  | "Semi-Critical"
  | "Critical"
  | "Over-Exploited"
  | "Saline";

export interface StateAggregate {
  state: string;
  totalRecharge: number;
  totalExtractable: number;
  totalExtraction: number;
  avgStage: number;
  unitCount: number;
  categoryBreakdown: Record<string, number>;
}
