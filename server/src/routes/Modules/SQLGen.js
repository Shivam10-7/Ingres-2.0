const ApiCaller = require('../../../API-Service');
const parseLLMJsonString = require('../Modules/parseLLMJsonString');
const LocalModel = require('../../../LocalModel');
const EntityResolver = require('../Modules/Entity_Resolve');
const Approve = require('../db/Approved.json');
const sqlIntelligence = require('../db/COLUMN_INTELLIGENCE.json');

/**
 * Generates a SQL query JSON response based on the user question.
 * It resolves entities, builds a prompt for the language model, and parses the JSON output.
 */
async function SQLGen(userQuery) {
  try {
    // Resolve entities from the user query.
    const detected = await EntityResolver(userQuery);
    const normalizedEntities = (detected.entities || []).map(ent => {
      const { type, ...rest } = ent;
      const valueKey = Object.keys(rest)[0];
      const value = ent[valueKey];
      return { type, value };
    });
    const entityJSON = JSON.stringify(normalizedEntities);

    // Build the prompt for the model (PostgreSQL version).
    const prompt = `You are an enterprise‑grade PostgreSQL SQL generator for the INGRES groundwater analytics system.
Your task is to convert:
1) the USER QUESTION\n2) the RESOLVER JSON\n3) the COLUMN INTELLIGENCE JSON\n4) the APPROVED SCHEMA JSON\ninto exactly ONE safe, correct, minimal SELECT query. Return ONLY a JSON object as described in the project documentation.
\nUSER_QUESTION: ${userQuery}\nRESOLVER_JSON: ${entityJSON}\nCOLUMN_INTELLIGENCE_JSON: ${JSON.stringify(sqlIntelligence)}\nAPPROVED_SCHEMA_JSON: ${JSON.stringify(Approve)}`;

    // Call the API service to get the model response.
    const rawResponse = await ApiCaller(prompt, userQuery);
    let finalResponse = {};
    try {
      finalResponse = parseLLMJsonString(rawResponse);
    } catch (e) {
      console.error('[SQLGen] Failed to parse JSON:', e.message);
    }
    if (!finalResponse || finalResponse.error) {
      console.warn(`[SQLGen] Model could not generate SQL for: "${userQuery}"`);
    }
    return finalResponse;
  } catch (error) {
    console.error('[SQLGen Error]:', error.message);
    return { error: 'Technical error generating query', sql: null };
  }
}

module.exports = SQLGen;
