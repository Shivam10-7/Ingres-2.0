function buildBarChartOption(rows, title) {
  const categories = rows.map(row => row.label);
  const values = rows.map(row => row.value);

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