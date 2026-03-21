/**
 * Builds a professional ECharts Radar configuration.
 * @param {Array} rows - The data array (e.g., [{ category: 'Sales', budget: 5000, actual: 4000 }, ...])
 * @param {string} title - The title of the chart.
 * @returns {Object} ECharts configuration object.
 */
async function buildRadarChart(rows, title) {
  // 1. Guard Clause
  if (!rows || rows.length === 0) {
    return {
      title: { text: `No data for: ${title}`, left: 'center', top: 'middle' }
    };
  }

  // 2. Dynamic Key Detection
  // We assume:
  // keys[0] = The Name of the axis (e.g., "Sales")
  // keys[1] = The first metric (e.g., "Allocated Budget")
  // keys[2] = The second metric (e.g., "Actual Spending")
  const keys = Object.keys(rows[0]);
  const axisLabelKey = keys[0]; 
  const metricOneKey = keys[1];
  const metricTwoKey = keys[2];

  // 3. Mapping Indicators (The outer axes)
  // We calculate the max dynamically so the chart scales properly
  const indicators = rows.map(row => {
    const maxValue = Math.max(row[metricOneKey], row[metricTwoKey]);
    return {
      name: row[axisLabelKey],
      // Adding 10% buffer to the max for better visuals
      max: Math.ceil(maxValue * 1.1) 
    };
  });

  // 4. Mapping Data Series
  const metricOneData = rows.map(row => row[metricOneKey]);
  const metricTwoData = rows.map(row => row[metricTwoKey]);

  return {
    title: {
      text: title || 'Performance Comparison'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: [metricOneKey, metricTwoKey],
      bottom: 0
    },
    radar: {
      indicator: indicators,
      shape: 'polygon' 
    },
    series: [
      {
        name: `${metricOneKey} vs ${metricTwoKey}`,
        type: 'radar',
        areaStyle: { opacity: 0.1 }, // Adds a professional subtle fill
        data: [
          {
            value: metricOneData,
            name: metricOneKey
          },
          {
            value: metricTwoData,
            name: metricTwoKey
          }
        ]
      }
    ]
  };
}

module.exports = buildRadarChart;