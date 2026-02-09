function selectPipeline(isDetailedResponseNeeded, isVisualizationNeeded) {
  if (!isDetailedResponseNeeded && !isVisualizationNeeded) {
    console.log("Data query pipeline selected");
    return "DATA_QUERY_PIPELINE";
  }

  if (isDetailedResponseNeeded && !isVisualizationNeeded) {
    console.log("Detailed data query pipeline selected");
    return "DETAILED_DATA_QUERY_PIPELINE";
  }

  if (!isDetailedResponseNeeded && isVisualizationNeeded) {
    console.log("Visualization pipeline selected");
    return "VISUALIZATION_PIPELINE";
  }
    console.log("Analytics pipeline selected");
  return "ANALYTICS_PIPELINE";
}

module.exports = selectPipeline;
