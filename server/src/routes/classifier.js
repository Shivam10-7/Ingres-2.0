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
    const detailedDataQueryPipeline = require('./pipelines/DetailedResponse');
    let response = await detailedDataQueryPipeline(query);
    return {
    response: response,
    chartData: null
   }//here the function would be called that would call the detailed data query pipeline and then return the response to the user
  }

  if (!isDetailedResponseNeeded && isVisualizationNeeded) {
   const VisualiizationPipeline = require('./pipelines/Visualization');
   let Visualresponse = await VisualiizationPipeline(query);
   return {
    response: "Here is the visualization you requested",
    chartData: Visualresponse
   }
  }
    console.log("Analytics pipeline selected");
  return "ANALYTICS_PIPELINE";//here the function would be called that would call the analytics pipeline and then return the response to the user
}

module.exports = selectPipeline;
