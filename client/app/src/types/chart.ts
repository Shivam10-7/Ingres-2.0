export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ChartAxis {
  label: string;
  data?: string[];
}

export interface ChartData {
  chartType: "bar" | "line" | "pie" | "scatter" | "area";
  title: string;
  xAxis?: ChartAxis;
  yAxis?: ChartAxis;
  series: ChartSeries[];
}

export interface AIChartResponse {
  charts: ChartData[];
}
