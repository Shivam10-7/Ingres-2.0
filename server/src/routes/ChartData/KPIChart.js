/**
 * Refactored Bar Chart Generator
 * @param {Array} rows - The raw data objects
 * @param {String} title - Chart title
 * @param {Object} config - Optional overrides
 */
async function buildKPIChartOption(rows, title, config = {}) {
  if (!rows || rows.length === 0) {
    return { title: { text: 'No data available', left: 'center', top: 'middle' } };
  }

  const keys = Object.keys(rows[0]);
  const labelKey = keys[0];
  const valueKey = keys[1];

  // Sorting logic remains solid - helps visual hierarchy
  const sortedData = [...rows].sort((a, b) => b[valueKey] - a[valueKey]);

  const categories = sortedData.map(row => row[labelKey]);
  const values = sortedData.map(row => row[valueKey]);

  return {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    // Mapping the sorted labels to the X-Axis
    xAxis: [
      {
        type: 'category',
        data: categories,
        axisTick: { alignWithLabel: true }
      }
    ],
    // Defining the Y-Axis as the value scale
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: title || 'Value',
        type: 'bar',
        barWidth: '60%',
        // Mapping the sorted numbers to the Series Data
        data: values,
        itemStyle: {
          color: config.color || '#5470c6'
        }
      }
    ]
  };
}

module.exports = buildKPIChartOption;