const { json } = require("express");

async function buildPieChart(rows, title) {
  if (!rows || rows.length === 0) return { title: { text: 'No data available', left: 'center', top: 'middle' } };

  const keys = Object.keys(rows[0]);
  const labelKey = keys[0];
  const valueKey = keys[1];

  // ANALYST TIP: Always sort your data for bar charts. 
  // It makes it instantly clear which category is the "winner."
  const sortedData = [...rows].sort((a, b) => b[valueKey] - a[valueKey]);

  const categories = sortedData.map(row => row[labelKey]);
  const values = sortedData.map(row => row[valueKey]);
  console.log("[PieChart] Building Pie Chart with title:", rows);

//maps the data in the format required by the pie chart
let PieDataFormatted = (rows) => {
  return rows.map(item => ({
    value: item.Total_Assessment_Units,
    name: item.categorization
  }));
}

  return {
  tooltip: {
    trigger: 'item'
  },
  legend: {
    top: '5%',
    left: 'center'
  },
  series: [
    {
      name: 'Access From',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 40,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: PieDataFormatted(rows)
    }
  ]
};
}

module.exports = buildPieChart;