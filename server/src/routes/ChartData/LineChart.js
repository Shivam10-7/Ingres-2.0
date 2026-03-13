async function buildLineChart(rows, title) {
  console.log("Building Line Chart with data:", rows);

  if (!rows || rows.length === 0) {
    return {
      title: {
        text: "No data available",
        left: "center",
        top: "middle"
      }
    };
  }

  const keys = Object.keys(rows[0]);
  const labelKey = keys[0];
  const valueKey = keys[1];

  // Sort descending (optional for line charts, but kept from your logic)
  const sortedData = [...rows].sort((a, b) => b[valueKey] - a[valueKey]);

  const labels = sortedData.map(r => r[labelKey]);
  const values = sortedData.map(r => r[valueKey]);

  return {
    title: { text: title },

    tooltip: { trigger: "axis" },

    xAxis: {
      type: "category",
      data: labels
    },

    yAxis: {
      type: "value"
    },

    series: [
      {
        type: "line",
        smooth: true,
        data: values
      }
    ]
  };
}

module.exports = buildLineChart;