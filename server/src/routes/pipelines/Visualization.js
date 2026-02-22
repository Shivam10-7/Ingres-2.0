const Reponse = require('../Modules/ReponseGen');
const { model } = require('mongoose'); // Note: Unused in this snippet, consider removing if unnecessary
const SQLGen = require('../Modules/SQLGen');
const database = require('../db/dataRetrive');
const PieChartPayloadd = require('../ChartData/PieChart');
const BarChartPayload = require('../ChartData/BarChart'); // Ensure this is correctly imported for use in the tester route
const LineChartPayload = require('../ChartData/LineChart'); // Ensure this is correctly imported for use in the tester route
/**
 * Orchestrates the full RAG (Retrieval-Augmented Generation) flow:
 * Natural Language -> SQL -> Database Data -> Natural Language Response
 */
async function AnalyticsQueryHandler(Query) {
    try {
        console.log("Received query for visualization pipeline 📈📈📈:", Query);
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

       switch (ChartType.type) {
        case 'KPI':
            return {
                type: 'KPI',
                data: rows
            };

        case 'pie':
            // Logic: Await the payload generator and assign the actual result, not the console.log
            const pieData = await PieChartPayloadd(rows, chartTitle);
            console.log("[Visualizer] Pie Chart Payload Generated");
            return {
                type: 'pie',
                data: pieData
            };

        case 'bar':
            const barData = await BarChartPayload(rows, chartTitle);
            console.log("[Visualizer] Bar Chart Payload Generated");
            return {
                type: 'bar',
                data: barData
            };
        case 'line':
            const lineData = await LineChartPayload(rows, chartTitle);
            console.log("[Visualizer] Line Chart Payload Generated");
            return {
                type: 'line',
                data: lineData
            };


        default:
            // Fallback: If no specific chart is requested, return the raw data as a table
            console.log("[Visualizer] Defaulting to Table View");
            return {
                type: 'table',
                data: rows 
            };
    }
                
        // 3. Stringify data for the LL
        // We use a fallback empty array string if data is null/undefined
        // const dataString = JSON.stringify(rows || []);

        // 4. Response  not   needed as this this is the chartonly  option
        // const response = await Reponse(Query, dataString, ChartType);
        // console.log("Generated Response:", response);
        
        
        // return response;

    } catch (error) {
        // Log the full stack trace for the engineer, return a polite error to the user
        console.error("Error in AnalyticsQueryHandler flow:", error);
        return "Internal System Error: I'm having trouble processing the data right now.";
    }
}

module.exports = AnalyticsQueryHandler;