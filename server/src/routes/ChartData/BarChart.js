function buildBarChart(data, title) {
  return {
    // title: { text: title },
    // tooltip: {}, //didnt work well with bar chart, so removed for now
    xAxis: {
      type: "category",
      data: data.rows.map(r => r[0])
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: data.rows.map(r => r[1])
      }
    ]
  };
}

module.exports = buildBarChart;