/**
 * Builds a professional ECharts Pie/Donut configuration.
 * @param {Array} rows - The data array from the database.
 * @param {string} title - The title of the chart.
 * @returns {Object} ECharts configuration object.
 */
async function buildPieChart(rows, title) {
  // 1. Guard Clause & Empty State
  if (!rows || rows.length === 0) {
    return {
      title: { text: `No data for: ${title}`, left: 'center', top: 'middle', textStyle: { color: '#999', fontSize: 14 } }
    };
  }

  // 2. Dynamic Key Detection (Analyst Tip: Don't hardcode keys!)
  // Assumes first column is Label, second is Value
  const keys = Object.keys(rows[0]);
  const labelKey = keys[0];
  const valueKey = keys[1];

  // 3. Data Transformation & Sorting
  // Analysts always sort descending so the largest slices start at 12 o'clock.
  const sortedData = [...rows]
    .sort((a, b) => b[valueKey] - a[valueKey])
    .map(item => ({
      name: item[labelKey],
      value: item[valueKey]
    }));

  // 4. Return Professional Payload
  return {
    title: {
      text: title,
      left: 'left',
      textStyle: { fontSize: 18, fontWeight: '600', color: '#333' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: <b>{c}</b> ({d}%)', // Shows name, value, and percentage
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      textStyle: { color: '#000' },
      borderWidth: 1,
      borderColor: '#eee'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'middle',
      icon: 'circle',
      itemGap: 15
    },
    // Professional color palette (Clean & Accessible)
    color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'],
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['45%', '70%'], // Donut style is easier on the eyes than a full pie
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false, // Keep it clean; use tooltip or legend for details
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold',
            formatter: '{b}\n{d}%' // Shows Category and % in the center on hover
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: sortedData
      }
    ]
  };
}

module.exports = buildPieChart;