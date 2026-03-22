import React, { useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts";

export type EChartsOption = echarts.EChartsOption;

interface Props {
  option: EChartsOption;
  className?: string;
  style?: React.CSSProperties;
  theme?: 'light' | 'dark'; // Added for professional UI sync
}

export function EChartsRenderer({ option, className, style, theme = 'light' }: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  // Initialize/Re-initialize chart when theme changes
  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose existing instance before switching themes
    instanceRef.current?.dispose();
    instanceRef.current = echarts.init(chartRef.current, theme);

    const resizeObserver = new ResizeObserver(() => {
      instanceRef.current?.resize();
    });
    
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      instanceRef.current?.dispose();
    };
  }, [theme]);

  // Update options and inject Download Feature
  useEffect(() => {
    if (instanceRef.current) {
      const professionalOption: EChartsOption = {
        ...option,
        // Ensure toolbox exists for downloading
        toolbox: {
          show: true,
          right: 10,
          feature: {
            saveAsImage: { 
              title: "Download",
              type: "png",
              pixelRatio: 2 // Higher quality for reports
            },
            dataView: { readOnly: false, title: "Data View" }, // Useful for analysts
          },
          ...option.toolbox as object
        },
      };

      instanceRef.current.setOption(professionalOption, { notMerge: true });
      // Theme effect recreates the instance; without re-applying options the canvas stays blank
      // until something else updates `option` (e.g. switching chats).
      requestAnimationFrame(() => instanceRef.current?.resize());
    }
  }, [option, theme]);

  return (
    <div 
      ref={chartRef} 
      className={className ?? "w-full h-full"} // Changed default to h-full
      style={{ minHeight: '300px', ...style }} 
    />
  );
}