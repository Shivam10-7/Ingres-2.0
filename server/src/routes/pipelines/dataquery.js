const Reponse = require('../Modules/ReponseGen');
const SQLGen = require('../Modules/SQLGen');
const database = require('../db/dataRetrive');

function normalizeGroundwaterQuery(query) {
    if (typeof query !== 'string') return query;

    return query
        .replace(/\bground\s+water\s+level\b/gi, 'stage of groundwater extraction')
        .replace(/\bgroundwater\s+level\b/gi, 'stage of groundwater extraction')
        .replace(/\bgroundwater_level\b/gi, 'stage of groundwater extraction')
        .replace(/\bgujrat\b/gi, 'Gujarat');
}
/**
 * Orchestrates the full RAG (Retrieval-Augmented Generation) flow:
 * Natural Language -> SQL -> Database Data -> Natural Language Response
 */
async function dataqueryHandler(Query) {
    try {
        const normalizedQuery = normalizeGroundwaterQuery(Query);

        // 1. Generate SQL from User Query
        const SQLJson = await SQLGen(normalizedQuery);
        
        // Safety Check: If SQLGen returns an error or no SQL, handle it gracefully
        if (!SQLJson || !SQLJson.sql) {
            console.error("SQL Generation failed or returned no query.");
            return "I'm sorry, I couldn't translate that request into a database search. Could you be more specific?";
        }

        const sqlQuery = SQLJson.sql;
        console.log("Generated SQL Query:", sqlQuery);

        // 2. Fetch data from the database
        const [rows, fields] = await database(sqlQuery);
        
        console.log("Data retrieved from database:", rows);
        console.log("Fields retrieved from database:", fields);

        // 3. Stringify data for the LLM
        // We use a fallback empty array string if data is null/undefined
        const dataString = JSON.stringify(rows || []);

        // 4. Generate final human-friendly response
        const response = await Reponse(Query, dataString);
        console.log("Generated Response:", response);

        return response;

    } catch (error) {
        // Log the full stack trace for the engineer, return a polite error to the user
        console.error("Error in dataqueryHandler flow:", error);
        return "Internal System Error: I'm having trouble processing the data right now.";
    }
}

module.exports = dataqueryHandler;
