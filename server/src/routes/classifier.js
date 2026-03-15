async function selectPipeline(isDetailedResponseNeeded, isVisualizationNeeded , query) {
  if (!isDetailedResponseNeeded && !isVisualizationNeeded) {
    console.log("Data query pipeline selected");
    const dataqueyryPipeline = require('./pipelines/dataquery');
    let response = await dataqueyryPipeline(query);
   return {
    response: response,
    chartData: null
   }
   
    // return "DATA_QUERY_PIPELINE";//here the function would be called that would call the data query pipeline and then return the response to the user
  }

  if (isDetailedResponseNeeded && !isVisualizationNeeded) {
    console.log("Detailed data query pipeline selected");
    return "DETAILED_DATA_QUERY_PIPELINE";//here the function would be called that would call the detailed data query pipeline and then return the response to the user
  }

  if (!isDetailedResponseNeeded && isVisualizationNeeded) {
   const VisualiizationPipeline = require('./pipelines/Visualization');
   return await VisualiizationPipeline(query);
  }
    console.log("Analytics pipeline selected");
  return "ANALYTICS_PIPELINE";//here the function would be called that would call the analytics pipeline and then return the response to the user
}

module.exports = selectPipeline;
