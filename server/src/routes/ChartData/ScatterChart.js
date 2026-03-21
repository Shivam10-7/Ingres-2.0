/**
 * Builds a professional ECharts Scatter configuration.
 * @param {Array} rows - The data array from the database.
 * @param {string} title - The title of the chart.
 * @returns {Object} ECharts configuration object.
 */
async function buildScatterChart(rows, title) {
  // 1. Guard Clause
  if (!rows || rows.length === 0) {
    return {
      title: { text: `No data for: ${title}`, left: 'center', top: 'middle' }
    };
  }

  // 2. Dynamic Key Detection
  // We assume the first two numeric columns are our X and Y coordinates
  const keys = Object.keys(rows[0]);
  const xKey = keys[0]; // e.g., 'advertising_spend'
  const yKey = keys[1]; // e.g., 'sales_revenue'

  // 3. Data Transformation
  // Scatter series 'data' expects an array of arrays: [[x1, y1], [x2, y2]]
  const scatterData = rows.map(item => [
    item[xKey], 
    item[yKey]
  ]);

  // 4. Return Professional Payload
  return {
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'item', axisPointer: { type: 'cross' } },
    xAxis: { name: xKey, splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: { name: yKey, splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        symbolSize: 12,
        data: scatterData,
        type: 'scatter',
        itemStyle: {
          color: '#5470c6'
        }
      }
    ]
  };
}