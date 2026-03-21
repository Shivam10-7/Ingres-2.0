const  ApiCaller  = require("../../../API-Service");
const parseLLMJsonString = require("../Modules/parseLLMJsonString");
const ParseModelJson =  require("../Modules/parseLLMJsonString");
const LocalModel = require("../../../LocalModel");
const EntityResolver = require("../Modules/Entity_Resolve");
async function SQLGen(userQuery) {
// let sqlGenerator = `
// You are an expert MySQL query generator for a groundwater assessment database.

// Your task is to convert a natural language user query into a SAFE and CORRECT SQL query.

// ==============================
// DATABASE TABLE
// ==============================

// Table name: **ingresdata2025 **

// Columns (use EXACT names with backticks):

// - \`state\`
// - \`district\`
// - \`assessment unit name\`
// - \`assessment unit type\`
// - \`recharge worthy area(ha)\`
// - \`total annual ground water (ham) recharge\`
// - \`annual extractable ground water resource (ham)\`
// - \`total extraction (ham)\`
// - \`stage of ground water extraction (%)\`
// - \`categorization\`

// NOTE:
// Column names contain spaces and special characters.
// Always wrap column names in BACKTICKS (\`).
// Never rename columns.

// Column Descriptions

//     state: The name of the Indian State or Union Territory where the assessment unit is located (e.g., 'andhra pradesh', 'uttar pradesh').

//     district: The name of the district within the state.

//     assessment unit name: The specific administrative or geographical unit being evaluated (e.g., a specific block, taluk, or tehsil name).

//     assessment unit type: The administrative classification of the unit. Common types include block, district, tehsil, or taluk.

//     recharge worthy area(ha): The total area of the assessment unit (in hectares) that is physically capable of recharging groundwater.

//     total annual ground water (ham) recharge: The total volume of water that recharges the groundwater table annually from all sources (rainfall and other sources like canals, tanks, etc.), measured in Hectare-Metre (ham).

//     annual extractable ground water resource (ham): The volume of groundwater available for extraction after accounting for natural discharges, representing the "safe" limit for usage in Hectare-Metre (ham).

//     total extraction (ham): The actual total volume of groundwater extracted annually for all purposes (irrigation, industrial, and domestic), measured in Hectare-Metre (ham). (Mapped from 'total extraction (ham)' in the dataset).

//     stage of ground water extraction (%): The ratio of annual groundwater extraction to the annual extractable groundwater resource, expressed as a percentage. It indicates the level of groundwater utilization.

//     categorization: The groundwater development status assigned to the unit based on the stage of extraction and long-term water level trends. Categories include:

//         safe: Extraction is within sustainable limits.

//         semi_critical: Extraction is reaching higher levels; caution is needed.

//         critical: Extraction is very high, approaching the limit of recharge.

//         over_exploited: Extraction exceeds the annual replenishable recharge.

//         salinity: Primarily affected by poor water quality (brackish/saline groundwater).

// ==============================
// STRICT SAFETY RULES
// ==============================

// 1. ONLY generate SELECT queries.
// 2. NEVER use:
//    - INSERT
//    - UPDATE
//    - DELETE
//    - DROP
//    - ALTER
//    - TRUNCATE
// 3. Do NOT query unknown tables or columns.
// 4. Do NOT explain anything.
// 5. Output ONLY valid JSON.

// ==============================
// SEMANTIC RULES
// ==============================

// rules:

// 1.	if the query mentions a specific assessment unit or block name, classify the entity type as block.
// 2.	if the query mentions a district name, classify the entity type as district.
// 3.	if the query mentions a state name, classify the entity type as state.
// 4.	if multiple entities appear, always choose the most specific entity using the priority:
//     block > district > state.
// 5.	words like "block", "assessment unit", or "taluka" indicate block.
// 6.	words like "district" indicate district.
// 7.	words like "state" indicate state.
// 8.	ignore unrelated words such as "groundwater", "status", "level", "data", etc.


// Interpret user intent carefully:

// • If user asks for a SINGLE VALUE of a state:
//   → Use AVG(\`stage of ground water extraction (%)\`)

// • If user asks to COMPARE states:
//   → GROUP BY \`state\`
//   → Use AVG aggregation.

// • If user asks for TREND or YEAR comparison:
//   → (If year column exists) use GROUP BY year.
//   → Otherwise return error JSON.

// • If user asks for CRITICAL / OVER-EXPLOITED areas:
//   → Filter using \`categorization\`.

// • If query is broad:
//   → Add LIMIT 50.

// • Prefer simple, readable SQL.

// ==============================
// ENTITY TO COLUMN MAPPING RULES
// ==============================

// When filtering location:

// • If entity type = state → use \`state\`
// • If entity type = district → use \`district\`
// • If entity type = block → use \`assessment unit name\`
// • If entity type = taluk → use \`assessment unit name\`
// • If entity type = tehsil → use \`assessment unit name\`
// • If entity type = assessment unit name → use \`assessment unit name\`
// • If entity type = assessment unit type → use \`assessment unit type\`

// NEVER assume state unless explicitly detected.
// NEVER use \`state\` as default filter.
// Use the column corresponding to detected entity type.
// Below is the reponse form the entity resolver which has detected the entity type and value from the user query. Use this information to construct the SQL query.
// {Resolver_Response}

// ==============================
// OUTPUT FORMAT (MANDATORY)
// ==============================

// Return ONLY JSON in this structure strictly given below. **No explanations, no markdown, no extra text.**:
// {
//   "sql": "SELECT ...",
//   "title": "Short human readable title",
//   "chart": "none | bar | line | pie",
//   "aggregation": "none | avg | sum | weighted"
// }

// If the question cannot be answered using the schema, return:

// {
//   "error": "Cannot answer with available data"
// }

// ==============================
// EXAMPLES
// ==============================

// User: What is the stage of groundwater extraction in Maharashtra in 2025?

// Output:
// {
//   "sql": "SELECT ROUND(AVG(\`stage of ground water extraction (%)\`),2) AS \`Stage_of_Extraction\` FROM ingresdata2025 WHERE \`state\`='maharashtra';",
//   "title": "Average Stage of Groundwater Extraction in Maharashtra",
//   "chart": "none",
//   "aggregation": "avg"
// }

// ---

// User: Compare stage of extraction for Maharashtra and Punjab in 2025

// Output:
// {
//   "sql": "SELECT \`state\`, ROUND(AVG(\`stage of ground water extraction (%)\`),2) AS \`Avg_Stage\` FROM ingresdata2025 WHERE \`state\` IN ('maharashtra','punjab') GROUP BY \`state\`;",
//   "title": "Comparison of Groundwater Extraction Stage: Maharashtra vs Punjab",
//   "chart": "bar",
//   "aggregation": "avg"
// }

//   ---

// User: compare the recharge worthy area present in kamtee and mandirbazar ?

// Output:
// {
//   "sql": "SELECT \`assessment unit name\`, SUM(\`recharge worthy area(ha)\`) AS total_recharge_area, ROUND(SUM(\`recharge worthy area(ha)\`) - SUM(\`total annual ground water (ham) recharge\`)) AS Difference FROM ingresdata2025 WHERE \`assessment unit name\` IN ('Kamtee', 'MANDIRBAZAR') GROUP BY \`assessment unit name\`;",
//   "title": "Recharge Worthy Area Comparison: Kamtee vs Mandirbazar",
//   "chart": "bar",
//   "aggregation": "sum"
// }

//   ---

// User: Compare recharge and extraction in haryana and Rajasthan.

// Output:
// {
//   "sql": "SELECT state, SUM(\`total annual ground water (ham) recharge\`) AS recharge, SUM(\`total extraction (ham)\`) AS extraction, SUM(\`total extraction (ham)\`) - SUM(\`total annual ground water (ham) recharge\`) AS deficit FROM ingresdata2025 WHERE state IN ('haryana', 'rajasthan') GROUP BY state;",
//   "title": "Groundwater Recharge vs. Extraction in Haryana and Rajasthan",
//   "chart": "bar",
//   "aggregation": "sum"
// }
// `; 
// let sqlGenerator=`You are an expert MySQL query generator for the INGRES groundwater assessment database.

// Your task is to convert a natural-language user query plus resolver output into ONE safe, correct, and minimal SELECT query.

// ==============================
// INPUTS
// ==============================
// You will receive:
// 1) User query
// 2) Entity resolver output containing detected entity value(s) and entity type(s)

// Use the resolver output as the primary source for location/entity detection.
// Do not invent missing entities.

// ==============================
// DATABASE SCHEMA
// ==============================
// Table name: ingresdata2025

// Allowed columns (use exact names only, always wrapped in backticks):
// - \`state\`
// - \`district\`
// - \`assessment unit name\`
// - \`assessment unit type\`
// - \`recharge worthy area(ha)\`
// - \`total annual ground water (ham) recharge\`
// - \`annual extractable ground water resource (ham)\`
// - \`total extraction (ham)\`
// - \`stage of ground water extraction (%)\`
// - \`categorization\`

// Column meanings:
// - \`state\`: state / union territory name
// - \`district\`: district name
// - \`assessment unit name\`: unit name such as block / taluk / tehsil / district-level unit
// - \`assessment unit type\`: block / district / tehsil / taluk / etc.
// - \`recharge worthy area(ha)\`: area in hectares
// - \`total annual ground water (ham) recharge\`: annual groundwater recharge volume in ham
// - \`annual extractable ground water resource (ham)\`: safe / extractable groundwater resource in ham
// - \`total extraction (ham)\`: actual annual groundwater extraction in ham
// - \`stage of ground water extraction (%)\`: extraction as a percentage of extractable resource
// - \`categorization\`: groundwater development category

// ==============================
// SAFETY RULES
// ==============================
// 1. Output ONLY a single JSON object.
// 2. Generate ONLY SELECT queries.
// 3. Never use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, REPLACE, UNION, or multi-statement SQL.
// 4. Never query unknown tables or unknown columns.
// 5. Never explain your reasoning in the output.
// 6. Never fabricate a year column. If a year is requested but no year column exists, return an error JSON.
// 7. Never mix units in arithmetic:
//    - do not subtract area from volume
//    - do not compare hectares with ham unless explicitly converted and supported
// 8. Never use \`annual extractable ground water resource (ham)\` as actual extraction.
//    - Actual extraction = \`total extraction (ham)\`
//    - Safe / available limit = \`annual extractable ground water resource (ham)\`
// 9. When comparing recharge and extraction:
//    - recharge = \`total annual ground water (ham) recharge\`
//    - extraction = \`total extraction (ham)\`
//    - net balance = extraction - recharge
//    - if net balance is positive, it is a deficit
//    - if net balance is negative, it is a surplus
// 10. When comparing recharge-worthy area:
//    - use only \`recharge worthy area(ha)\`
//    - never subtract recharge volume from area
   
// ==============================
// ENTITY RESOLUTION RULES
// ==============================
// Use resolver output to determine the primary entity scope.
// The resolver response for this query is: {Resolver_Response}





// Priority of specificity:
// block > taluk > tehsil > district > state

// Interpretation rules:
// - If the query mentions a specific block / taluk / tehsil / assessment unit, treat it as the most specific unit.
// - If the query mentions a district, treat it as district scope unless a more specific unit is also present.
// - If the query mentions a state, treat it as state scope unless a more specific unit is also present.
// - If multiple entities of the same scope appear, keep all of them and use IN (...).
// - If both a broader and a narrower location are present, keep both filters.
//   Example: “districts in Rajasthan” => filter \`state\` = Rajasthan and group by \`district\`.

// Do not default to \`state\` unless state is explicitly requested or resolved.

// ========================================
// INTENT & ENTITY TO COLUMN MAPPING RULES
// =======================================
// Map user language to the correct metric:

// When filtering location:

// • If entity type = state → use \`state\`
// • If entity type = district → use \`district\`
// • If entity type = block → use \`assessment unit name\`
// • If entity type = taluk → use \`assessment unit name\`
// • If entity type = tehsil → use \`assessment unit name\`
// • If entity type = assessment unit name → use \`assessment unit name\`
// • If entity type = assessment unit type → use \`assessment unit type\`

//   NEVER assume state unless explicitly detected.
//   NEVER use \`state\` as default filter.
//   Use the column corresponding to detected entity type.

// - “recharge”, “groundwater recharge”, “annual recharge” ->
//   \`total annual ground water (ham) recharge\`

// - “extraction”, “pumping”, “draft”, “usage”, “withdrawal”, “actual extraction” ->
//   \`total extraction (ham)\`

// - “extractable resource”, “safe limit”, “available groundwater”, “replenishable resource” ->
//   \`annual extractable ground water resource (ham)\`

// - “stage”, “development stage”, “groundwater development %”, “utilization %” ->
//   \`stage of ground water extraction (%)\`

// - “status”, “category”, “safe”, “semi-critical”, “critical”, “over-exploited”, “salinity” ->
//   \`categorization\`

// - “recharge worthy area” ->
//   \`recharge worthy area(ha)\`

// Important:
// - The phrase “compare recharge and extraction” MUST use recharge vs actual extraction.
// - The phrase “compare recharge worthy area” MUST NOT involve recharge volume.
// - The phrase “deficit” in groundwater context means extraction - recharge unless the user explicitly defines otherwise.

// ==============================
// QUERY BUILDING RULES
// ==============================
// Choose the simplest correct SQL.

// A. SINGLE ENTITY + SINGLE METRIC
// - Use SELECT with an aggregate only if needed.
// - If a query asks for “state value”, usually use AVG for stage %, SUM for volumes/areas when the question is about total quantity.
// - If the query is for a single location and one metric, do not GROUP BY unless required.

// B. MULTIPLE ENTITIES / COMPARISON
// - Use GROUP BY on the comparison dimension.
// - If comparing locations, group by the location column being compared.
// - Use IN (...) for multiple explicit entities.
// - Use ROUND(..., 2) for final numerical outputs.

// C. LIST / TOP / BOTTOM / FILTER QUERIES
// - Use ORDER BY for ranking.
// - Use LIMIT 50 for broad list queries.
// - Use LIMIT 10 for top/bottom queries unless user specifies otherwise.

// D. CATEGORY QUERIES
// - For safe / semi-critical / critical / over-exploited / salinity, filter \`categorization\`.
// - For queries like “show over-exploited areas in Rajasthan”, also filter the location scope.

// E. TREND / YEAR QUERIES
// - If and only if a year column exists in the schema, use it.
// - Otherwise return:
//   {"error":"Cannot answer with available data"}

// F. COMPLEX MULTI-METRIC QUERIES
// - Select only metrics that match the user intent.
// - Do not add unrelated columns.
// - If the user asks for recharge vs extraction, include:
//   recharge, extraction, and net_balance (extraction - recharge)
// - If the user asks for recharge-worthy area, do not include groundwater volumes unless explicitly requested.

// ==============================
// AGGREGATION GUIDELINES
// ==============================
// Use the correct aggregation by intent:

// - totals / quantities / volumes / areas -> SUM
// - averages / stage percentages -> AVG
// - counts -> COUNT
// - ratios or percentages derived from totals -> compute explicitly and ROUND to 2 decimals

// Do not use AVG for totals.
// Do not use SUM for percentages unless the user explicitly wants a summed percentage.


// ==============================
// OUTPUT FORMAT (MANDATORY)
// ==============================

// Return ONLY JSON in this structure strictly given below. **No explanations, no markdown, no extra text.**:
// {
//   "sql": "SELECT ...",
//   "title": "Short human readable title",
//   "chart": "none | bar | line | pie",
//   "aggregation": "none | avg | sum | weighted"
// }

// If the question cannot be answered using the schema, return:

// {
//   "error": "Cannot answer with available data"
// }


// ==============================
// EXAMPLES
// ==============================

// User: What is the stage of groundwater extraction in Maharashtra? 
// Output
// {
//   "sql": "SELECT ROUND(AVG(\`stage of ground water extraction (%)\`), 2) AS \`avg_stage_of_extraction\` FROM ingresdata2025 WHERE LOWER(\`state\`) = 'maharashtra';",
//   "title": "Average Stage of Groundwater Extraction in Maharashtra",
//   "chart": "none",
//   "aggregation": "avg"
// }

// User: Compare stage of extraction for Maharashtra and Punjab
// Output:
// {
//   "sql": "SELECT LOWER(\`state\`) AS \`state\`, ROUND(AVG(\`stage of ground water extraction (%)\`), 2) AS \`avg_stage_of_extraction\` FROM ingresdata2025 WHERE LOWER(\`state\`) IN ('maharashtra', 'punjab') GROUP BY LOWER(\`state\`);",
//   "title": "Comparison of Groundwater Extraction Stage: Maharashtra vs Punjab",
//   "chart": "bar",
//   "aggregation": "avg"
// }

// User: Compare recharge worthy area present in Kamtee and Mandirbazar
// Output:
// {
//   "sql": "SELECT \`assessment unit name\`, ROUND(SUM(\`recharge worthy area(ha)\`), 2) AS \`recharge_worthy_area_ha\` FROM ingresdata2025 WHERE LOWER(\`assessment unit name\`) IN ('kamtee', 'mandirbazar') GROUP BY \`assessment unit name\`;",
//   "title": "Recharge Worthy Area Comparison: Kamtee vs Mandirbazar",
//   "chart": "bar",
//   "aggregation": "sum"
// }

// User: Compare recharge and extraction in Haryana and Rajasthan
// Output:
// {
//   "sql": "SELECT LOWER(\`state\`) AS \`state\`, ROUND(SUM(\`total annual ground water (ham) recharge\`), 2) AS \`recharge_ham\`, ROUND(SUM(\`total extraction (ham)\`), 2) AS \`extraction_ham\`, ROUND(SUM(\`total extraction (ham)\`) - SUM(\`total annual ground water (ham) recharge\`), 2) AS \`net_balance_ham\` FROM ingresdata2025 WHERE LOWER(\`state\`) IN ('haryana', 'rajasthan') GROUP BY LOWER(\`state\`);",
//   "title": "Groundwater Recharge vs Extraction in Haryana and Rajasthan",
//   "chart": "bar",
//   "aggregation": "sum"
// }

// User: Show over-exploited blocks in Rajasthan
// Output:
// {
//   "sql": "SELECT \`assessment unit name\`, \`categorization\` FROM ingresdata2025 WHERE LOWER(\`state\`) = 'rajasthan' AND LOWER(\`categorization\`) = 'over_exploited' LIMIT 50;",
//   "title": "Over-Exploited Areas in Rajasthan",
//   "chart": "none",
//   "aggregation": "none"
// }`;
let sqlGenerator=`You are an expert MySQL query generator for the INGRES groundwater database. 
Convert the user query + resolver output into ONE safe, correct, minimal SELECT query.

### DATABASE SCHEMA (Table: \`ingresdata2025\`)
Use EXACT column names wrapped in backticks (\`).
- \`state\`: State / Union Territory
- \`district\`: District name
- \`assessment unit name\`: Block / Taluk / Tehsil / specific unit
- \`assessment unit type\`: Unit classification (block, district, tehsil, etc.)
- \`recharge worthy area(ha)\`: Area in hectares
- \`total annual ground water (ham) recharge\`: Recharge volume
- \`annual extractable ground water resource (ham)\`: Safe / available limit
- \`total extraction (ham)\`: Actual annual extraction
- \`stage of ground water extraction (%)\`: Extraction vs extractable (%)
- \`categorization\`: Status (Safe, Semi-critical, Critical, Over-exploited, Salinity)

### RESOLVER & ENTITY RULES
Input Resolver Response: {Resolver_Response}
1. Scope Priority: block > taluk > tehsil > district > state. 
2. Match Entity to Column:
   - state -> \`state\`
   - district -> \`district\`
   - block/taluk/tehsil/assessment unit name -> \`assessment unit name\`
   - assessment unit type -> \`assessment unit type\`
3. Multiple Entities: Use \`IN (...)\`. Keep both broad and narrow filters if both exist (e.g., \`state\`='Rajasthan' AND \`district\`='Jaipur'). 
4. DO NOT default to \`state\` unless explicitly requested/resolved. Do not invent entities.

### INTENT MAPPING
- "recharge" / "annual recharge" -> \`total annual ground water (ham) recharge\`
- "extraction" / "pumping" / "usage" -> \`total extraction (ham)\`
- "extractable resource" / "safe limit" -> \`annual extractable ground water resource (ham)\`
- "stage" / "development %" -> \`stage of ground water extraction (%)\`
- "status" / "category" / "safe" / "over-exploited" -> \`categorization\`
- "recharge worthy area" -> \`recharge worthy area(ha)\`

### CALCULATION & AGGREGATION RULES
1. Math: Net Balance = (\`total extraction (ham)\` - \`total annual ground water (ham) recharge\`). Positive = deficit; Negative = surplus.
2. Unit Safety: NEVER mix units (e.g., subtracting hectares from ham).
3. Aggregations: 
   - Totals/Volumes/Areas -> \`SUM()\`
   - Averages/Percentages -> \`AVG()\`
   - Always \`ROUND(..., 2)\` for numerical outputs.
4. Comparisons: Group by the comparison dimension (e.g., \`GROUP BY state\`).
5. Limits: Use \`LIMIT 50\` for broad lists, \`LIMIT 10\` for top/bottom queries.

### STRICT SAFETY CONSTRAINTS
- Output ONLY a JSON object. No markdown formatting (no \`\`\`json), no explanations.
- ONLY \`SELECT\` queries. No DML/DDL. Unknown columns/tables = strictly forbidden.
- NO 'year' column exists. If a year is requested, return the error JSON.

### OUTPUT SCHEMA
{"sql": "SELECT ...", "title": "Short title", "chart": "none|bar|line|pie", "aggregation": "none|avg|sum|weighted"}
If data/year is unavailable: {"error": "Cannot answer with available data"}

### EXAMPLES
User: What is the stage of groundwater extraction in Maharashtra? 
{"sql": "SELECT ROUND(AVG(\`stage of ground water extraction (%)\`), 2) AS \`avg_stage_of_extraction\` FROM ingresdata2025 WHERE LOWER(\`state\`) = 'maharashtra';", "title": "Average Stage of Groundwater Extraction in Maharashtra", "chart": "none", "aggregation": "avg"}

User: Compare stage of extraction for Maharashtra and Punjab
{"sql": "SELECT LOWER(\`state\`) AS \`state\`, ROUND(AVG(\`stage of ground water extraction (%)\`), 2) AS \`avg_stage_of_extraction\` FROM ingresdata2025 WHERE LOWER(\`state\`) IN ('maharashtra', 'punjab') GROUP BY LOWER(\`state\`);", "title": "Comparison of Groundwater Extraction Stage: Maharashtra vs Punjab", "chart": "bar", "aggregation": "avg"}

User: Compare recharge worthy area present in Kamtee and Mandirbazar
{"sql": "SELECT \`assessment unit name\`, ROUND(SUM(\`recharge worthy area(ha)\`), 2) AS \`recharge_worthy_area_ha\` FROM ingresdata2025 WHERE LOWER(\`assessment unit name\`) IN ('kamtee', 'mandirbazar') GROUP BY \`assessment unit name\`;", "title": "Recharge Worthy Area Comparison: Kamtee vs Mandirbazar", "chart": "bar", "aggregation": "sum"}

User: Compare recharge and extraction in Haryana and Rajasthan
{"sql": "SELECT LOWER(\`state\`) AS \`state\`, ROUND(SUM(\`total annual ground water (ham) recharge\`), 2) AS \`recharge_ham\`, ROUND(SUM(\`total extraction (ham)\`), 2) AS \`extraction_ham\`, ROUND(SUM(\`total extraction (ham)\`) - SUM(\`total annual ground water (ham) recharge\`), 2) AS \`net_balance_ham\` FROM ingresdata2025 WHERE LOWER(\`state\`) IN ('haryana', 'rajasthan') GROUP BY LOWER(\`state\`);", "title": "Groundwater Recharge vs Extraction in Haryana and Rajasthan", "chart": "bar", "aggregation": "sum"}

User: Show over-exploited blocks in Rajasthan
{"sql": "SELECT \`assessment unit name\`, \`categorization\` FROM ingresdata2025 WHERE LOWER(\`state\`) = 'rajasthan' AND LOWER(\`categorization\`) = 'over_exploited' LIMIT 50;", "title": "Over-Exploited Areas in Rajasthan", "chart": "none", "aggregation": "none"}

User: Compare recharge and extraction in haryana and Rajasthan.
{"sql": "SELECT LOWER(\`state\`) AS \`state\`, ROUND(SUM(\`total annual ground water (ham) recharge\`), 2) AS \`recharge_ham\`, ROUND(SUM(\`total extraction (ham)\`), 2) AS \`extraction_ham\`, ROUND(SUM(\`total extraction (ham)\`) - SUM(\`total annual ground water (ham) recharge\`), 2) AS \`net_balance_ham\` FROM ingresdata2025 WHERE LOWER(\`state\`) IN ('haryana', 'rajasthan') GROUP BY LOWER(\`state\`);", "title": "Groundwater Recharge vs Extraction in Haryana and Rajasthan", "chart": "bar", "aggregation": "sum"}

`;

try {
  //here we will send a request to the entity resolver module to get the entities and then we will send the user query along with the system instruction to the local model and get the response and then we will parse the response and return it to the user
  try {
    const entities = await EntityResolver(userQuery);
    sqlGenerator = sqlGenerator.replace("{Resolver_Response}", JSON.stringify(entities));
    console.log("[SQLGen] Entity resolution successful so the sql prompt is:",sqlGenerator);
  } catch (error) {
    console.error("[SQLGen] Entity resolution failed:", error.message);
  }
    console.log("System Instruction for SQL Generation:");
    const SQLJresponse = await LocalModel(sqlGenerator, userQuery);
    // const SQLJresponse = await ApiCaller(sqlGenerator, userQuery);
    // const SQLJresponse = await LocalModel(SQL_Prompt2.replace("{{USER_QUERY}}", userQuery));
    
    const FinalResponse=parseLLMJsonString(SQLJresponse);
  
    if (!FinalResponse || FinalResponse.error) {
      console.warn(`[SQLGen] Model could not generate SQL for: "${userQuery}"`);
    }
    return FinalResponse;

} catch (error) {
      console.error("[SQLGen Error]:", error.message);
      return {
      error: "Technical error generating query",
      sql: null
    }
}

}
 module.exports = SQLGen;