import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

export type EChartsOption = echarts.EChartsOption;

export function EChartsRenderer({ option }: { option: EChartsOption }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current);
    chart.setOption(option ?? {});

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [option]);

  return <div ref={ref} className="w-full h-64" />;
}
