import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { ChartData } from "@/types/chart";

const SERIES_COLORS = [
  "hsl(187, 80%, 55%)",
  "hsl(45, 90%, 60%)",
  "hsl(155, 70%, 50%)",
  "hsl(350, 75%, 60%)",
  "hsl(270, 60%, 60%)",
  "hsl(20, 85%, 58%)",
];

function buildOption(chart: ChartData): EChartsOption {
  const isPie = chart.chartType === "pie";
  const isScatter = chart.chartType === "scatter";

  const baseOption: EChartsOption = {
    title: {
      text: chart.title,
      left: "center",
      top: 12,
      textStyle: {
        color: "hsl(210, 20%, 92%)",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
      },
    },
    tooltip: {
      trigger: isPie ? "item" : "axis",
      backgroundColor: "hsl(220, 18%, 12%)",
      borderColor: "hsl(220, 14%, 22%)",
      textStyle: {
        color: "hsl(210, 20%, 88%)",
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
      },
    },
    legend: {
      bottom: 8,
      textStyle: {
        color: "hsl(215, 12%, 55%)",
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
      },
      icon: "roundRect",
      itemWidth: 12,
      itemHeight: 8,
    },
    color: SERIES_COLORS,
    grid: isPie
      ? undefined
      : {
          left: "8%",
          right: "5%",
          bottom: "18%",
          top: "18%",
          containLabel: true,
        },
    animationDuration: 800,
    animationEasing: "cubicOut" as const,
  };

  if (isPie) {
    return {
      ...baseOption,
      series: chart.series.map((s, i) => ({
        name: s.name,
        type: "pie" as const,
        radius: ["40%", "70%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: "hsl(220, 18%, 10%)",
          borderWidth: 2,
        },
        label: {
          color: "hsl(210, 20%, 80%)",
          fontSize: 11,
          fontFamily: "Inter, sans-serif",
        },
        data: chart.xAxis?.data?.map((label, j) => ({
          name: label,
          value: s.data[j],
          itemStyle: { color: SERIES_COLORS[j % SERIES_COLORS.length] },
        })) ?? s.data.map((val, j) => ({
          name: `Item ${j + 1}`,
          value: val,
          itemStyle: { color: SERIES_COLORS[j % SERIES_COLORS.length] },
        })),
      })),
    };
  }

  const xAxisConfig: EChartsOption["xAxis"] = isScatter
    ? {
        type: "value",
        name: chart.xAxis?.label ?? "",
        nameTextStyle: {
          color: "hsl(215, 12%, 50%)",
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: "hsl(220, 14%, 22%)" } },
        axisLabel: {
          color: "hsl(215, 12%, 55%)",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10,
        },
        splitLine: { lineStyle: { color: "hsl(220, 14%, 15%)" } },
      }
    : {
        type: "category" as const,
        data: chart.xAxis?.data ?? [],
        name: chart.xAxis?.label ?? "",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: "hsl(215, 12%, 50%)",
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: "hsl(220, 14%, 22%)" } },
        axisLabel: {
          color: "hsl(215, 12%, 55%)",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10,
          rotate: (chart.xAxis?.data?.length ?? 0) > 6 ? 30 : 0,
        },
        axisTick: { show: false },
      };

  const yAxisConfig: EChartsOption["yAxis"] = {
    type: "value" as const,
    name: chart.yAxis?.label ?? "",
    nameTextStyle: {
      color: "hsl(215, 12%, 50%)",
      fontFamily: "Inter, sans-serif",
      fontSize: 11,
    },
    axisLine: { show: false },
    axisLabel: {
      color: "hsl(215, 12%, 55%)",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: 10,
    },
    splitLine: { lineStyle: { color: "hsl(220, 14%, 15%)" } },
  };

  const seriesConfig = chart.series.map((s, i) => {
    const base = {
      name: s.name,
      data: isScatter
        ? s.data.map((val, j) => [chart.xAxis?.data ? Number(chart.xAxis.data[j]) : j, val])
        : s.data,
      smooth: true,
    };

    switch (chart.chartType) {
      case "bar":
        return {
          ...base,
          type: "bar" as const,
          barMaxWidth: 40,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
        };
      case "line":
        return {
          ...base,
          type: "line" as const,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { width: 2.5 },
        };
      case "area":
        return {
          ...base,
          type: "line" as const,
          symbol: "circle",
          symbolSize: 4,
          lineStyle: { width: 2 },
          areaStyle: {
            opacity: 0.15,
          },
        };
      case "scatter":
        return {
          ...base,
          type: "scatter" as const,
          symbolSize: 10,
        };
      default:
        return { ...base, type: "bar" as const };
    }
  });

  return {
    ...baseOption,
    xAxis: xAxisConfig,
    yAxis: yAxisConfig,
    series: seriesConfig,
  };
}

interface ChartRendererProps {
  chart: ChartData;
  height?: number;
}

const ChartRenderer = ({ chart, height = 380 }: ChartRendererProps) => {
  const option = buildOption(chart);

  return (
    <div className="glass-card p-4">
      <ReactECharts
        option={option}
        style={{ height: `${height}px`, width: "100%" }}
        opts={{ renderer: "canvas" }}
        notMerge={true}
      />
    </div>
  );
};

export default ChartRenderer;
