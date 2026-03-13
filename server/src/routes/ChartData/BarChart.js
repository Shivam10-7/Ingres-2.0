/**
 * Refactored Bar Chart Generator
 * @param {Array} rows - The raw data objects
 * @param {String} title - Chart title
 * @param {Object} config - Optional overrides (horizontal mode, color, etc.)
 */
async function buildBarChartOption(rows, title, config = {}) {
  if (!rows || rows.length === 0) return { title: { text: 'No data available', left: 'center', top: 'middle' } };

  const keys = Object.keys(rows[0]);
  const labelKey = keys[0];
  const valueKey = keys[1];

  // ANALYST TIP: Always sort your data for bar charts. 
  // It makes it instantly clear which category is the "winner."
  const sortedData = [...rows].sort((a, b) => b[valueKey] - a[valueKey]);

  const categories = sortedData.map(row => row[labelKey]);
  const values = sortedData.map(row => row[valueKey]);

  return {
    backgroundColor: 'transparent',
    title: {
      text: title,
      left: 'left',
      textStyle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderWidth: 0,
      shadowBlur: 10,
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      textStyle: { color: '#666' },
      axisPointer: { type: 'shadow' }
    },
    grid: {
      top: '15%',
      left: '2%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        interval: 0, // Ensure all labels show
        rotate: categories.length > 8 ? 30 : 0, // Auto-rotate if crowded
        color: '#999'
      },
      axisLine: { lineStyle: { color: '#eee' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: { type: 'dashed', color: '#f0f0f0' }
      },
      axisLine: { show: false }
    },
    series: [
      {
        name: title,
        type: 'bar',
        barWidth: '55%',
        itemStyle: {
          // Professional gradient: Blue to light blue
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' }, 
              { offset: 1, color: '#60a5fa' }
            ]
          },
          borderRadius: [4, 4, 0, 0] // Rounded tops
        },
        emphasis: {
          itemStyle: { color: '#2563eb' }
        },
        data: values,
        // Show values directly on bars if there aren't too many
        label: {
          show: values.length < 12,
          position: 'top',
          color: '#777',
          fontSize: 11
        }
      }
    ]
  };
}

module.exports = buildBarChartOption;