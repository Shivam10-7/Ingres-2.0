async function buildLineChart(rows, title) {
  if (!rows || rows.length === 0) {
    return {
      title: { text: "No data available", left: "center", top: "middle" }
    };
  }

  // 1. Identify Keys
  const keys = Object.keys(rows[0]);
  const labelKey = keys[0]; // Usually 'date' or 'timestamp'
  const valueKey = keys[1]; // The metric

  // 2. LOGIC FIX: Sort by Label (Time), not Value
  // Sorting by value in a line chart destroys the "trend" insight.
  const sortedData = [...rows].sort((a, b) => new Date(a[labelKey]) - new Date(b[labelKey]));

  const labels = sortedData.map(r => r[labelKey]);
  const values = sortedData.map(r => r[valueKey]);

  return {
    title: { 
      text: title, 
      subtext: `Total records: ${rows.length}`,
      left: "left" 
    },
    grid: { bottom: "15%", containLabel: true }, // Extra space for labels
    tooltip: { 
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderWidth: 1,
      formatter: (params) => {
        const p = params[0];
        return `<b>${p.name}</b><br/>${valueKey}: <b>${p.value.toLocaleString()}</b>`;
      }
    },
    // Allows users to focus on specific time ranges
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      { type: "slider", bottom: 10 }
    ],
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: false, // Line starts at the Y-axis
      axisLine: { lineStyle: { color: "#ccc" } }
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed" } } // Easier to track values
    },
    series: [
      {
        name: valueKey,
        type: "line",
        smooth: true,
        showSymbol: false, // Cleaner look; symbol shows on hover
        data: values,
        itemStyle: { color: "#5470c6" },
        // Visual Insight: Fill area for a modern "Mountain Chart" look
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(84, 112, 198, 0.4)" },
              { offset: 1, color: "rgba(84, 112, 198, 0.1)" }
            ]
          }
        },
        // Analytical Insight: Highlight Max and Min points automatically
        markPoint: {
          data: [
            { type: "max", name: "Peak" },
            { type: "min", name: "Low" }
          ]
        },
        // Analytical Insight: Show the average trend line
        markLine: {
          silent: true,
          data: [{ type: "average", name: "Avg" }]
        }
      }
    ]
  };
}

module.exports = buildLineChart;