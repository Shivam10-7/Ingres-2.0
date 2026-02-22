import type { ChartData } from "@/types/chart";

function isNumber(v: any): v is number {
  return typeof v === "number" && !Number.isNaN(v);
}

/**
 * Map an LLM-style response to the app's ChartData[] format.
 * - If a single record is returned, produce a pie chart of numeric fields.
 * - If multiple records are returned, produce a bar chart per numeric field across records.
 */
export function mapLLMResponseToCharts(payload: any): ChartData[] {
  if (!payload || !payload.success || !Array.isArray(payload.data) || payload.data.length === 0) {
    return [];
  }

  const rows: any[] = payload.data;

  // pick x-axis label preference
  const pickLabel = (r: any) => r.year ?? r.assessment_unit_name ?? r.district ?? r.state ?? "item";

  // collect numeric keys from first row
  const first = rows[0];
  const numericKeys = Object.keys(first).filter((k) => isNumber(first[k]));

  if (rows.length === 1) {
    // Single-row: show pie of numeric fields
    const labels = numericKeys.map((k) => k.replace(/_/g, " "));
    const values = numericKeys.map((k) => Number(first[k]));

    return [
      {
        chartType: "pie",
        title: payload.title || `Record breakdown (${pickLabel(first)})`,
        xAxis: { label: "Metric", data: labels },
        yAxis: { label: "Value" },
        series: [{ name: "Value", data: values }],
      },
    ];
  }

  // Multi-row: create bar chart(s) with x-axis as labels and series per numeric key
  const xLabels = rows.map((r) => String(pickLabel(r)));

  const series = numericKeys.map((k) => ({ name: k.replace(/_/g, " "), data: rows.map((r) => Number(r[k])) }));

  return [
    {
      chartType: "bar",
      title: payload.title || "LLM Data",
      xAxis: { label: "Category", data: xLabels },
      yAxis: { label: "Value" },
      series,
    },
  ];
}

export default mapLLMResponseToCharts;
