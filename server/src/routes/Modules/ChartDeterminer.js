/**
 * Determines the best EChart type based on data dimensions.
 * @param {number} rowCount - Number of data records.
 * @param {number} fieldCount - Number of columns/attributes per record.
 * @returns {Object} - An object containing the chart type and a partial ECharts config.
 */
function getEChartRecommendation( fieldCount, rowCount) {
    let type = '';
    let config = {};

    // 1. The "Big Number" Case
    if (rowCount === 1 && fieldCount === 1) {
        return { type: 'KPI', recommendation: 'Gauge or Simple Graphic Text' };
    }

    // 2. Simple Key-Value Pairs (2 Fields)
    if (fieldCount === 2) {
        if (rowCount <= 10) {
            type = 'pie';
            config = { series: [{ type: 'pie', radius: '50%' }] };
        } else if (rowCount <= 30) {
            type = 'bar';
            config = { xAxis: { type: 'category' }, yAxis: { type: 'value' } };
        } else {
            type = 'line';
            config = { xAxis: { type: 'category' }, yAxis: { type: 'value' }, smooth: true };
        }
    } 
    
    // 3. Multi-dimensional Data (3 Fields)
    else if (fieldCount === 3) {
        type = 'bar'; // Grouped or Stacked
        config = { legend: {}, xAxis: { type: 'category' }, yAxis: { type: 'value' } };
    } 
    
    // 4. Correlation or Dense Data (4+ Fields)
    else if (fieldCount >= 4) {
        if (rowCount > 50) {
            type = 'scatter';
            config = { xAxis: {}, yAxis: {}, visualMap: { min: 0, max: 100 } };
        } else {
            type = 'radar';
            config = { radar: { indicator: [] }, series: [{ type: 'radar' }] };
        }
    }

    return {
        chartType: type,
        echartsBaseOption: config,
        isLargeDataset: rowCount > 500 // Hint to enable 'sampling' or 'dataZoom'
    };
}

module.exports = getEChartRecommendation;