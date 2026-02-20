const Reponse = require('../Modules/ReponseGen');
const { model } = require('mongoose'); // Note: Unused in this snippet, consider removing if unnecessary
const SQLGen = require('../Modules/SQLGen');
const database = require('../db/dataRetrive');
const PieChartPayloadd = require('../ChartData/PieChart');
/**
 * Orchestrates the full RAG (Retrieval-Augmented Generation) flow:
 * Natural Language -> SQL -> Database Data -> Natural Language Response
 */
async function AnalyticsQueryHandler(Query) {
    try {
        console.log("Received query for analytics pipeline 📈📈📈:", Query);
        // 1. Generate SQL from User Query
        const QueryResponse = await SQLGen(Query);
        
        // Safety Check: If SQLGen returns an error or no SQL, handle it gracefully
        if (!QueryResponse || !QueryResponse.sql) {
            console.error("SQL Generation failed or returned no query.");
            return "I'm sorry, I couldn't translate that request into a database search. Could you be more specific?";
        }

        const sqlQuery = QueryResponse.sql;
        console.log("Generated SQL Query:", sqlQuery);

        // 2. Fetch data from the database
        const [rows, fields, ChartType] = await database(sqlQuery);
        
        console.log("Data retrieved from database:", rows);
        console.log("Fields retrieved from database:", fields);
        console.log("Chart Type:", ChartType);

        switch (ChartType.chartType) {
            case 'KPI':
                return {
                    type: 'KPI',
                    data: rows
                }
            break;
            case 'pie':
                return {
                    type: 'pie',
                    // Passing the values and the title to the PieChartPayloadd function to get the ECharts configuration for a pie chart
                    data: await PieChartPayloadd(rows, QueryResponse.title)
                }
            break;
            }
                
        // 3. Stringify data for the LLM
        // We use a fallback empty array string if data is null/undefined
        // const dataString = JSON.stringify(rows || []);

        // 4. Response  not   needed as this this is the chartonly  option
        // const response = await Reponse(Query, dataString, ChartType);
        // console.log("Generated Response:", response);

        return response;

    } catch (error) {
        // Log the full stack trace for the engineer, return a polite error to the user
        console.error("Error in AnalyticsQueryHandler flow:", error);
        return "Internal System Error: I'm having trouble processing the data right now.";
    }
}

module.exports = AnalyticsQueryHandler;