function buildLineChart(data, title) {
  return {
    title: { text: title },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.rows.map(r => r[0])
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "line",
        smooth: true,
        data: data.rows.map(r => r[1])
      }
    ]
  };
}

module.exports = buildLineChart;