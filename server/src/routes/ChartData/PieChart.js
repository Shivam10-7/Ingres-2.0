async function buildPieChart(data, title) {
  console.log("[PieChart] Building Pie Chart with title:", data);
  return {
    title: { text: title, left: "center" },
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: "60%",
        data: data.map(r => ({
          name: r[0],
          value: r[1]
        }))
      }
    ]
  };
}

module.exports = buildPieChart;