/**
 * Mock AI provider — generates chart responses from real CGWB 2024 CSV data.
 * This file contains all mock-specific logic. No chart rendering knowledge here.
 */

import type { AIProvider, LLMQueryResponse } from "./types";
import type { AIChartResponse } from "@/types/chart";
import {
  getStateAggregates,
  getCategorizationSummary,
  getRecordsByState,
} from "@/services/data/groundwaterRepository";

const SAMPLE_QUERIES = [
  "Top 10 states by groundwater extraction",
  "Groundwater categorization distribution across India",
  "Compare extraction vs recharge for major states",
  "District-wise groundwater status in Rajasthan",
  "States with highest over-exploitation",
];

type QueryHandler = (query: string) => Promise<AIChartResponse>;

/** Route a query to the best handler based on keyword matching */
function matchHandler(
  query: string,
  handlers: Array<{ keywords: string[]; handler: QueryHandler }>
): QueryHandler {
  const lower = query.toLowerCase();
  let bestMatch: QueryHandler = handlers[0].handler;
  let bestScore = 0;

  for (const { keywords, handler } of handlers) {
    const score = keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = handler;
    }
  }

  return bestMatch;
}

// ─── Type definitions for LLM responses ──────────────────────

// ─── Query Handlers ──────────────────────────────────────────────

/**
 * Dynamically handle queries returned from LLM with actual data
 * Analyzes the data structure and creates appropriate visualizations
 */
async function handleDynamicQuery(
  response: LLMQueryResponse
): Promise<AIChartResponse> {
  if (!response.success || !response.data || response.data.length === 0) {
    return {
      charts: [
        {
          chartType: "bar",
          title: "No Data Available",
          xAxis: { label: "Status", data: ["No Results"] },
          yAxis: { label: "Count" },
          series: [{ name: "Records", data: [0] }],
        },
      ],
    };
  }

  const records = response.data;
  const charts: AIChartResponse["charts"] = [];

  // Get all numeric and string columns from the data
  const sampleRecord = records[0];
  const numericFields: string[] = [];
  const stringFields: string[] = [];
  const percentFields: string[] = [];

  for (const [key, value] of Object.entries(sampleRecord)) {
    if (typeof value === "number") {
      if (key.toLowerCase().includes("percent") || key.toLowerCase().includes("stage")) {
        percentFields.push(key);
      } else {
        numericFields.push(key);
      }
    } else if (typeof value === "string") {
      stringFields.push(key);
    }
  }

  // 1. Summary metrics (if data is aggregated or single record)
  if (
    records.length === 1 &&
    (stringFields.includes("state") ||
      stringFields.includes("district") ||
      stringFields.includes("assessment_unit_name"))
  ) {
    const record = records[0];
    const summaryData: { label: string; value: number | string }[] = [];

    // Add key metrics
    if (record.state) summaryData.push({ label: "State", value: record.state });
    if (record.district)
      summaryData.push({ label: "District", value: record.district });
    if (record.assessment_unit_name)
      summaryData.push({ label: "Unit Name", value: record.assessment_unit_name });
    if (record.categorization)
      summaryData.push({ label: "Category", value: record.categorization });

    // Add numeric metrics
    if (record.total_annual_ground_water_recharge_ham !== undefined) {
      summaryData.push({
        label: "Annual Recharge (HAM)",
        value: Math.round(record.total_annual_ground_water_recharge_ham),
      });
    }
    if (record.annual_extractable_ground_water_resource_ham !== undefined) {
      summaryData.push({
        label: "Extractable Resource (HAM)",
        value: Math.round(
          record.annual_extractable_ground_water_resource_ham
        ),
      });
    }
    if (record.total_ground_water_extraction_ham !== undefined) {
      summaryData.push({
        label: "Total Extraction (HAM)",
        value: Math.round(record.total_ground_water_extraction_ham),
      });
    }
    if (record.stage_of_ground_water_extraction_percent !== undefined) {
      summaryData.push({
        label: "Extraction Stage (%)",
        value: Number(record.stage_of_ground_water_extraction_percent).toFixed(
          2
        ),
      });
    }

    // Create table-like display with metrics
    if (summaryData.length > 0) {
      charts.push({
        chartType: "bar",
        title: "Assessment Details",
        xAxis: {
          label: "Metric",
          data: summaryData.map((m) => m.label),
        },
        yAxis: { label: "Value" },
        series: [
          {
            name: "Values",
            data: summaryData.map((m) =>
              typeof m.value === "number" ? m.value : 0
            ),
          },
        ],
      });
    }
  }

  // 2. Multi-record analysis - create comparison charts
  if (records.length > 1) {
    // Group by geographic or categorical field if available
    const groupField = stringFields.find(
      (f) =>
        f.includes("state") ||
        f.includes("district") ||
        f.includes("assessment_unit") ||
        f.includes("categorization")
    );

    if (groupField && numericFields.length > 0) {
      // Create bar chart for numeric values grouped
      const grouped: Record<string, Record<string, number>> = {};

      for (const record of records) {
        const groupKey = String(record[groupField]);
        if (!grouped[groupKey]) grouped[groupKey] = {};

        numericFields.forEach((field) => {
          if (typeof record[field] === "number") {
            grouped[groupKey][field] =
              (grouped[groupKey][field] || 0) + record[field];
          }
        });
      }

      const groupKeys = Object.keys(grouped);
      const fieldsToShow = numericFields.slice(0, 3); // Limit to 3 fields for readability

      if (groupKeys.length > 0 && fieldsToShow.length > 0) {
        charts.push({
          chartType: "bar",
          title: `${titleCase(groupField)} Comparison - Key Metrics`,
          xAxis: {
            label: titleCase(groupField),
            data: groupKeys.map((k) => titleCase(k)),
          },
          yAxis: { label: "Value" },
          series: fieldsToShow.map((field) => ({
            name: titleCase(field),
            data: groupKeys.map(
              (k) =>
                Math.round((grouped[k][field] || 0) * 100) / 100
            ),
          })),
        });
      }
    }

    // 3. Percentage/Stage metrics
    if (percentFields.length > 0) {
      const percentField = percentFields[0];
      charts.push({
        chartType: "bar",
        title: `${titleCase(percentField)} Analysis`,
        xAxis: {
          label: "Assessment Unit",
          data: records
            .slice(0, 10)
            .map(
              (r) =>
                titleCase(
                  r.assessment_unit_name ||
                    r.district ||
                    r.state ||
                    "Unit"
                )
            ),
        },
        yAxis: { label: titleCase(percentField) },
        series: [
          {
            name: titleCase(percentField),
            data: records.slice(0, 10).map((r) => r[percentField] || 0),
          },
        ],
      });
    }

    // 4. Categorization pie chart if available
    if (stringFields.includes("categorization")) {
      const catCount: Record<string, number> = {};
      for (const record of records) {
        const cat = record.categorization || "Unknown";
        catCount[cat] = (catCount[cat] || 0) + 1;
      }

      charts.push({
        chartType: "pie",
        title: "Categorization Distribution",
        xAxis: { label: "Category", data: Object.keys(catCount) },
        yAxis: { label: "" },
        series: [
          {
            name: "Count",
            data: Object.values(catCount),
          },
        ],
      });
    }
  }

  // 5. Add extraction vs recharge chart if both fields exist
  if (
    records.length >= 1 &&
    (numericFields.includes("total_ground_water_extraction_ham") ||
      numericFields.includes("annual_extractable_ground_water_resource_ham")) &&
    numericFields.includes("total_annual_ground_water_recharge_ham")
  ) {
    const displayRecords = records.slice(0, 8);
    const labels = displayRecords.map(
      (r) => titleCase(r.assessment_unit_name || r.district || r.state || "Unit")
    );

    charts.push({
      chartType: "bar",
      title: "Extraction vs Recharge",
      xAxis: { label: "Location", data: labels },
      yAxis: { label: "HAM" },
      series: [
        {
          name: "Recharge",
          data: displayRecords.map(
            (r) => r.total_annual_ground_water_recharge_ham || 0
          ),
        },
        {
          name: "Extraction",
          data: displayRecords.map(
            (r) => r.total_ground_water_extraction_ham || 0
          ),
        },
      ],
    });
  }

  return {
    charts:
      charts.length > 0
        ? charts
        : [
            {
              chartType: "bar",
              title: "Query Results",
              xAxis: { label: "Data", data: ["No visualizable data"] },
              yAxis: { label: "Count" },
              series: [{ name: "Records", data: [records.length] }],
            },
          ],
  };
}

async function handleTopExtraction(): Promise<AIChartResponse> {
  const aggregates = await getStateAggregates();
  const top10 = aggregates.slice(0, 10);

  return {
    charts: [
      {
        chartType: "bar",
        title: "Top 10 States by Groundwater Extraction (HAM)",
        xAxis: {
          label: "State",
          data: top10.map((s) => titleCase(s.state)),
        },
        yAxis: { label: "Total Extraction (HAM)" },
        series: [
          {
            name: "Extraction",
            data: top10.map((s) => Math.round(s.totalExtraction)),
          },
        ],
      },
      {
        chartType: "bar",
        title: "Extraction vs Extractable Resource (Top 10)",
        xAxis: {
          label: "State",
          data: top10.map((s) => titleCase(s.state)),
        },
        yAxis: { label: "HAM" },
        series: [
          {
            name: "Extractable",
            data: top10.map((s) => Math.round(s.totalExtractable)),
          },
          {
            name: "Extraction",
            data: top10.map((s) => Math.round(s.totalExtraction)),
          },
        ],
      },
      {
        chartType: "pie",
        title: "Share of Total Extraction (Top 10)",
        xAxis: {
          label: "State",
          data: top10.map((s) => titleCase(s.state)),
        },
        yAxis: { label: "" },
        series: [
          {
            name: "Extraction Share",
            data: top10.map((s) => Math.round(s.totalExtraction)),
          },
        ],
      },
    ],
  };
}

async function handleCategorizationDistribution(): Promise<AIChartResponse> {
  const summary = await getCategorizationSummary();
  const labels = Object.keys(summary);
  const values = Object.values(summary);

  const aggregates = await getStateAggregates();
  const top15 = aggregates.slice(0, 15);

  // Build category breakdown per state for top states
  const categories = ["Safe", "Semi-Critical", "Critical", "Over-Exploited"];
  const availableCategories = categories.filter((c) =>
    top15.some((s) => (s.categoryBreakdown[c] ?? 0) > 0)
  );

  return {
    charts: [
      {
        chartType: "pie",
        title: "Groundwater Categorization Distribution (All India)",
        xAxis: { label: "Category", data: labels },
        yAxis: { label: "" },
        series: [{ name: "Assessment Units", data: values }],
      },
      {
        chartType: "bar",
        title: "Category-wise Unit Count (Top 15 States)",
        xAxis: {
          label: "State",
          data: top15.map((s) => titleCase(s.state)),
        },
        yAxis: { label: "Number of Units" },
        series: availableCategories.map((cat) => ({
          name: cat,
          data: top15.map((s) => s.categoryBreakdown[cat] ?? 0),
        })),
      },
    ],
  };
}

async function handleExtractionVsRecharge(): Promise<AIChartResponse> {
  const aggregates = await getStateAggregates();
  const top12 = aggregates.slice(0, 12);

  return {
    charts: [
      {
        chartType: "bar",
        title: "Extraction vs Recharge — Top 12 States (HAM)",
        xAxis: {
          label: "State",
          data: top12.map((s) => titleCase(s.state)),
        },
        yAxis: { label: "HAM" },
        series: [
          {
            name: "Total Recharge",
            data: top12.map((s) => Math.round(s.totalRecharge)),
          },
          {
            name: "Extraction",
            data: top12.map((s) => Math.round(s.totalExtraction)),
          },
        ],
      },
      {
        chartType: "line",
        title: "Average Extraction Stage (%) — Top 12 States",
        xAxis: {
          label: "State",
          data: top12.map((s) => titleCase(s.state)),
        },
        yAxis: { label: "Stage of Extraction (%)" },
        series: [
          {
            name: "Avg Stage (%)",
            data: top12.map((s) => s.avgStage),
          },
        ],
      },
      {
        chartType: "scatter",
        title: "Recharge vs Extraction (Top 12 States)",
        xAxis: {
          label: "Recharge (HAM)",
          data: top12.map((s) => String(Math.round(s.totalRecharge))),
        },
        yAxis: { label: "Extraction (HAM)" },
        series: [
          {
            name: "States",
            data: top12.map((s) => Math.round(s.totalExtraction)),
          },
        ],
      },
    ],
  };
}

async function handleStateDrilldown(query: string): Promise<AIChartResponse> {
  // Extract state name from query
  const stateNames = [
    "rajasthan", "gujarat", "maharashtra", "karnataka", "tamil nadu",
    "uttar pradesh", "madhya pradesh", "punjab", "haryana", "andhra pradesh",
    "telangana", "west bengal", "bihar", "odisha", "chhattisgarh",
    "jharkhand", "kerala", "uttarakhand", "himachal pradesh", "goa",
  ];
  const lower = query.toLowerCase();
  const matchedState = stateNames.find((s) => lower.includes(s)) ?? "rajasthan";

  const records = await getRecordsByState(matchedState);
  const displayName = titleCase(matchedState);

  // Sort by extraction descending, take top 15 districts
  const sorted = [...records].sort(
    (a, b) => b.totalExtraction - a.totalExtraction
  );
  const top = sorted.slice(0, 15);

  // Category distribution for this state
  const catMap: Record<string, number> = {};
  for (const r of records) {
    catMap[r.categorization] = (catMap[r.categorization] ?? 0) + 1;
  }

  return {
    charts: [
      {
        chartType: "bar",
        title: `Top 15 Assessment Units by Extraction — ${displayName}`,
        xAxis: {
          label: "Assessment Unit",
          data: top.map((r) => titleCase(r.assessmentUnitName)),
        },
        yAxis: { label: "Extraction (HAM)" },
        series: [
          {
            name: "Extraction",
            data: top.map((r) => Math.round(r.totalExtraction)),
          },
        ],
      },
      {
        chartType: "pie",
        title: `Categorization Distribution — ${displayName}`,
        xAxis: { label: "Category", data: Object.keys(catMap) },
        yAxis: { label: "" },
        series: [
          { name: "Units", data: Object.values(catMap) },
        ],
      },
      {
        chartType: "bar",
        title: `Extraction vs Recharge — Top 15 Units in ${displayName}`,
        xAxis: {
          label: "Assessment Unit",
          data: top.map((r) => titleCase(r.assessmentUnitName)),
        },
        yAxis: { label: "HAM" },
        series: [
          {
            name: "Recharge",
            data: top.map((r) => Math.round(r.totalAnnualRecharge)),
          },
          {
            name: "Extraction",
            data: top.map((r) => Math.round(r.totalExtraction)),
          },
        ],
      },
    ],
  };
}

async function handleOverExploitation(): Promise<AIChartResponse> {
  const aggregates = await getStateAggregates();

  // States sorted by count of over-exploited units
  const withOE = aggregates
    .map((s) => ({
      state: s.state,
      overExploited: s.categoryBreakdown["Over-Exploited"] ?? 0,
      critical: s.categoryBreakdown["Critical"] ?? 0,
      semiCritical: s.categoryBreakdown["Semi-Critical"] ?? 0,
      total: s.unitCount,
      avgStage: s.avgStage,
    }))
    .filter((s) => s.overExploited > 0)
    .sort((a, b) => b.overExploited - a.overExploited)
    .slice(0, 12);

  return {
    charts: [
      {
        chartType: "bar",
        title: "States with Most Over-Exploited Assessment Units",
        xAxis: {
          label: "State",
          data: withOE.map((s) => titleCase(s.state)),
        },
        yAxis: { label: "Number of Units" },
        series: [
          {
            name: "Over-Exploited",
            data: withOE.map((s) => s.overExploited),
          },
          {
            name: "Critical",
            data: withOE.map((s) => s.critical),
          },
          {
            name: "Semi-Critical",
            data: withOE.map((s) => s.semiCritical),
          },
        ],
      },
      {
        chartType: "pie",
        title: "Over-Exploited Units Distribution by State",
        xAxis: {
          label: "State",
          data: withOE.map((s) => titleCase(s.state)),
        },
        yAxis: { label: "" },
        series: [
          {
            name: "Over-Exploited",
            data: withOE.map((s) => s.overExploited),
          },
        ],
      },
      {
        chartType: "line",
        title: "Average Extraction Stage (%) — Over-Exploited States",
        xAxis: {
          label: "State",
          data: withOE.map((s) => titleCase(s.state)),
        },
        yAxis: { label: "Avg Stage (%)" },
        series: [
          {
            name: "Avg Extraction Stage",
            data: withOE.map((s) => s.avgStage),
          },
        ],
      },
    ],
  };
}

// ─── Utility ──────────────────────────────────────────────

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Provider ──────────────────────────────────────────────

const HANDLERS: Array<{ keywords: string[]; handler: QueryHandler }> = [
  {
    keywords: ["top", "highest", "extraction", "most"],
    handler: handleTopExtraction,
  },
  {
    keywords: ["categorization", "distribution", "category", "status", "safe", "critical"],
    handler: handleCategorizationDistribution,
  },
  {
    keywords: ["compare", "vs", "versus", "recharge"],
    handler: handleExtractionVsRecharge,
  },
  {
    keywords: ["district", "block", "unit", "drill", "state-wise", "wise"],
    handler: handleStateDrilldown,
  },
  {
    keywords: ["over-exploited", "overexploited", "depletion", "stress", "exploit"],
    handler: handleOverExploitation,
  },
];

export const mockProvider: AIProvider = {
  async query(input: string | LLMQueryResponse): Promise<AIChartResponse> {
    // Simulate network delay for realistic UX
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    // If input is already a parsed LLM response, handle it directly
    if (typeof input === "object" && "data" in input && "sql_query" in input) {
      return handleDynamicQuery(input as LLMQueryResponse);
    }

    // Otherwise, use keyword-based routing for text queries
    const handler = matchHandler(input as string, HANDLERS);
    return handler(input as string);
  },

  getSampleQueries(): string[] {
    return SAMPLE_QUERIES;
  },
};
