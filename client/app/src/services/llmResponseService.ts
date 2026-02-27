/**
 * LLM Response Service
 * Reads LLM data from JSON file and generates charts
 * No mock data, no complex logic - just read and generate
 */

import type { AIChartResponse, ChartData } from "@/types/chart";

interface LLMDataResponse {
  success: boolean;
  data: Record<string, any>[];
  sql_query: string;
  execution_time_ms: number;
  rows_returned: number;
  cached: boolean;
}

/**
 * Read LLM response from JSON file and generate charts
 */
export async function readLLMResponseAndGenerateCharts(): Promise<AIChartResponse> {
  try {
    // Fetch the JSON file
    const response = await fetch("/src/data/llm-response.json");
    
    if (!response.ok) {
      throw new Error(`Failed to fetch LLM response: ${response.statusText}`);
    }

    const llmData: LLMDataResponse = await response.json();
    
    // Validate the response
    if (!llmData.success || !llmData.data || llmData.data.length === 0) {
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

    // Generate charts from LLM data
    return generateChartsFromData(llmData);
  } catch (error) {
    console.error("Error reading LLM response:", error);
    return {
      charts: [
        {
          chartType: "bar",
          title: "Error Reading Data",
          xAxis: { label: "Status", data: ["Error"] },
          yAxis: { label: "Count" },
          series: [{ name: "Records", data: [0] }],
        },
      ],
    };
  }
}

/**
 * Generate charts from LLM data
 * Analyzes data structure and creates appropriate visualizations
 */
function generateChartsFromData(llmData: LLMDataResponse): AIChartResponse {
  const records = llmData.data;
  const charts: ChartData[] = [];

  if (records.length === 0) {
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

  // Analyze first record to detect field types
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

  // ─── Chart 1: Summary metrics (for single or aggregated records) ───
  if (records.length === 1) {
    const record = records[0];
    const summaryData: Array<{ label: string; value: number }> = [];

    // Collect numeric metrics
    numericFields.forEach((field) => {
      if (typeof record[field] === "number") {
        summaryData.push({
          label: formatLabel(field),
          value: Math.round(record[field] * 100) / 100,
        });
      }
    });

    if (summaryData.length > 0) {
      charts.push({
        chartType: "bar",
        title: `Assessment Details - ${record.state || "Location"} ${record.district ? `(${record.district})` : ""}`,
        xAxis: {
          label: "Metrics",
          data: summaryData.map((m) => m.label),
        },
        yAxis: { label: "Value" },
        series: [
          {
            name: "Values",
            data: summaryData.map((m) => m.value),
          },
        ],
      });
    }
  }

  // ─── Chart 2: Multi-record comparison ───
  if (records.length > 1) {
    const groupField = stringFields.find(
      (f) =>
        f.includes("state") ||
        f.includes("district") ||
        f.includes("assessment_unit") ||
        f.includes("categorization")
    );

    if (groupField && numericFields.length > 0) {
      const grouped: Record<string, Record<string, number>> = {};

      records.forEach((record) => {
        const groupKey = String(record[groupField] || "Unknown");
        if (!grouped[groupKey]) grouped[groupKey] = {};

        numericFields.slice(0, 3).forEach((field) => {
          if (typeof record[field] === "number") {
            grouped[groupKey][field] = (grouped[groupKey][field] || 0) + record[field];
          }
        });
      });

      const groupKeys = Object.keys(grouped);
      const fieldsToShow = numericFields.slice(0, 3);

      if (groupKeys.length > 0 && fieldsToShow.length > 0) {
        charts.push({
          chartType: "bar",
          title: `Metrics Comparison by ${formatLabel(groupField)}`,
          xAxis: {
            label: formatLabel(groupField),
            data: groupKeys.map((k) => formatLabel(k)),
          },
          yAxis: { label: "Value" },
          series: fieldsToShow.map((field) => ({
            name: formatLabel(field),
            data: groupKeys.map((k) => Math.round((grouped[k][field] || 0) * 100) / 100),
          })),
        });
      }
    }
  }

  // ─── Chart 3: Percentage/Stage analysis ───
  if (percentFields.length > 0) {
    const percentField = percentFields[0];
    const displayRecords = records.slice(0, 10);

    charts.push({
      chartType: "bar",
      title: `${formatLabel(percentField)} Analysis`,
      xAxis: {
        label: "Assessment Unit",
        data: displayRecords.map((r) =>
          formatLabel(
            r.assessment_unit_name ||
              r.district ||
              r.state ||
              "Unit"
          )
        ),
      },
      yAxis: { label: formatLabel(percentField) },
      series: [
        {
          name: formatLabel(percentField),
          data: displayRecords.map((r) => r[percentField] || 0),
        },
      ],
    });
  }

  // ─── Chart 4: Categorization distribution ───
  if (stringFields.includes("categorization")) {
    const catCount: Record<string, number> = {};
    records.forEach((record) => {
      const cat = record.categorization || "Unknown";
      catCount[cat] = (catCount[cat] || 0) + 1;
    });

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

  // ─── Chart 5: Extraction vs Recharge ───
  if (
    numericFields.includes("total_ground_water_extraction_ham") &&
    numericFields.includes("total_annual_ground_water_recharge_ham")
  ) {
    const displayRecords = records.slice(0, 8);

    charts.push({
      chartType: "bar",
      title: "Extraction vs Recharge (HAM)",
      xAxis: {
        label: "Location",
        data: displayRecords.map(
          (r) =>
            formatLabel(r.assessment_unit_name || r.district || r.state || "Unit")
        ),
      },
      yAxis: { label: "HAM" },
      series: [
        {
          name: "Recharge",
          data: displayRecords.map((r) => r.total_annual_ground_water_recharge_ham || 0),
        },
        {
          name: "Extraction",
          data: displayRecords.map((r) => r.total_ground_water_extraction_ham || 0),
        },
      ],
    });
  }

  return {
    charts: charts.length > 0 ? charts : [
      {
        chartType: "bar",
        title: "Data Summary",
        xAxis: { label: "Records", data: ["Count"] },
        yAxis: { label: "Total" },
        series: [{ name: "Total Records", data: [records.length] }],
      },
    ],
  };
}

/**
 * Format field name for display
 * Converts snake_case or camelCase to Title Case
 */
function formatLabel(text: string): string {
  return text
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
