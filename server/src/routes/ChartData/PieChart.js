function buildPieChart(data, title) {
  return {
    title: { text: title, left: "center" },
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: "60%",
        data: data.rows.map(r => ({
          name: r[0],
          value: r[1]
        }))
      }
    ]
  };
}

module.exports = buildPieChart;