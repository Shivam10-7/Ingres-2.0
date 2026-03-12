async function buildBarChartOption(rows, title) {
  if (!rows || rows.length === 0) return {};

  // Dynamically identify keys: 
  // We assume the first column is the category (district) 
  // and the second is the numeric value.
  const keys = Object.keys(rows[0]);
  const labelKey = keys[0];
  const valueKey = keys[1];

  const categories = rows.map(row => row[labelKey]);
  const values = rows.map(row => row[valueKey]);
  return {
    title: {
      text: title
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: categories,
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: title,
        type: 'bar',
        barWidth: '60%',
        data: values
      }
    ]
  };
}

module.exports = buildBarChartOption ;