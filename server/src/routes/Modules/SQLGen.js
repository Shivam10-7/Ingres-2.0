<<<<<<< HEAD
const  ApiCaller  = require("../../../API-Service");
const parseLLMJsonString = require("../Modules/parseLLMJsonString");
const ParseModelJson =  require("../Modules/parseLLMJsonString");
const LocalModel = require("../../../LocalModel");
const EntityResolver = require("../Modules/Entity_Resolve");
const Approve = require("../db/Approved.json");
const sqlIntelligence = require("../db/COLUMN_INTELLIGENCE.json");
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
- \`net ground water availability for future use (ham)\`: Net available groundwater for future or simply 'Groundwater level of respective unit'
- \`stage of ground water extraction (%)\`: Extraction vs extractable (%)
- \`categorization\`: Status (Safe, Semi-critical, Critical, Over-exploited, Salinity)

### RESOLVER & ENTITY RULES
Input Resolver Response with Entities and Entity types: {resolver_json}

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
- "status" / "category" / "safe" / "Over-Exploited" -> \`categorization\`
- "groundwater level" / "net availability" -> \`net ground water availability for future use (ham)\`
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

  Return ONLY JSON in this structure strictly given below. **No explanations, no markdown, no extra text.**:
  {
    "sql": "SELECT ...",
    "title": "Short human readable title",
    "chart": "none | bar | line | pie",
    "aggregation": "none | avg | sum | weighted"

  If the question cannot be answered using the schema, retur  
  {
    "error": "Cannot answer with available data"
  }

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

User: Average groundwater stage by state.
{"sql": "SELECT LOWER(\`state\`) AS \`state\`, ROUND(AVG(\`stage of ground water extraction (%)\`), 2) AS \`avg_stage_of_extraction\` FROM ingresdata2025 GROUP BY LOWER(\`state\`) ORDER BY avg_stage_of_extraction DESC;", "title": "Average Stage of Groundwater Extraction by State", "chart": "bar", "aggregation": "sum"}

User:  Compare recharge worthy area in Nagpur and Jaipur.
{"sql": "SELECT LOWER(\`district\`) AS \`district\`, ROUND(SUM(\`recharge worthy area(ha)\`), 2) AS \`recharge_worthy_area_ha\` FROM ingresdata2025 WHERE (LOWER(\`district\`) = 'nagpur' AND LOWER(\`state\`) = 'maharashtra') OR (LOWER(\`district\`) = 'jaipur' AND LOWER(\`state\`) = 'rajasthan') GROUP BY LOWER(\`district\`);", "title": "Recharge Worthy Area Comparison: Nagpur vs Jaipur", "chart": "bar", "aggregation": "sum"}

User:  Top 10 districts with highest groundwater stress.
{"sql": "SELECT LOWER(\`district\`) AS \`district\`, ROUND(SUM(\`total extraction (ham)\`) - SUM(\`total annual ground water (ham) recharge\`), 2) AS \`groundwater_stress_ham\` FROM ingresdata2025 GROUP BY LOWER(\`district\`) ORDER BY groundwater_stress_ham DESC LIMIT 10;", "title": "Top 10 Districts with Highest Groundwater Stress", "chart": "bar", "aggregation": "sum"}
`;

let sqlGenerator = `You are an enterprise-grade PostgreSQL SQL generator for the INGRES groundwater analytics system.

// Your task is to convert:
// 1) the USER QUESTION
// 2) the RESOLVER JSON
// 3) the COLUMN INTELLIGENCE JSON
// 4) the APPROVED SCHEMA JSON

into exactly ONE safe, correct, minimal PostgreSQL SELECT query.

// You must output ONLY one JSON object and nothing else.

// ==================================================
// INPUTS
// ==================================================
// USER_QUESTION: {user_question}

// RESOLVER_JSON: {resolver_json}

// COLUMN_INTELLIGENCE_JSON: {column_intelligence_json}

// APPROVED_SCHEMA_JSON: {approved_schema_json}

// The APPROVED SCHEMA and COLUMN INTELLIGENCE JSON are authoritative.
// Never invent columns, relationships, units, measures, entities, or tables.

// ==================================================
// OUTPUT FORMAT
// ==================================================
// Return exactly one of these:

// 1) Success:
// {
//   "sql": "SELECT ...",
//   "title": "Short human-readable title",
//   "chart": "none | bar | line | pie",
//   "aggregation": "none | avg | sum | weighted"
// }

// 2) Failure:
// {
//   "error": "Cannot answer with available data"
// }

// No markdown. No explanations. No extra keys.

==================================================
DATABASE CONTRACT
==================================================
- Single table only: ingresdata2025
- SELECT only
- No INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, MERGE, UNION, SHOW, DESCRIBE
- No joins
- No subqueries unless absolutely necessary for a safe aggregate filter
- No SELECT *
- Use exact column names only, wrapped in double quotes
- Preserve column names exactly as given in schema
- Do not alias columns into fake semantic fields that are not requested
- If the request cannot be satisfied from the schema, return the failure JSON

// ==================================================
// CONFIRMED SCHEMA-SAFE COLUMNS
// ==================================================
// Dimensions / identifiers:
// - \`state\`
// - \`district\`
// - \`assessment unit name\`
// - \`assessment unit type\`
// - \`categorization\`

// Measures:
// - \`total area of assessment unit (ha)\`,
// - \`recharge worthy area(ha)\`,
// - \`recharge from rainfall-monsoon season\`,
// - \`recharge from other sources- monsoon season\`,
// - \`recharge from rainfall-non monsoon season\`,
// - \`recharge from other sources- non monsoon season\`,
// - \`total annual ground water (ham) recharge\`,
// - \`total natural discharges (ham)\`,
// - \`annual extractable ground water resource (ham)\`,
// - \`ground water extraction for irrigation use (ham)\`,
// - \`ground water extraction for industrial use (ham)\`,
// - \`ground water extraction for domestic use (ham)\`,
// - \`total extraction (ham)\`,
// - \`annual gw allocation for domestic use as on 2025 (ham)\`,
// - \`net ground water availability for future use (ham)\`,
// - \`stage of ground water extraction (%)\`

// Critical note:
// - No year/time column exists
// - Do not answer time trend / annual trend / monthly trend / year-over-year queries unless the schema explicitly contains a time column in the approved schema JSON

// ==================================================
// SCHEMA-AWARENESS RULES
// ==================================================
// 1) Every selected column must exist in APPROVED_SCHEMA_JSON.
// 2) Every measure must be used only with compatible units.
// 3) Never mix hectares and ham in arithmetic.
// 4) Never mix raw component logic unless the schema explicitly defines the relationship.
// 5) Prefer stored derived measures over recomputing them.
// 6) Use the most specific valid column for the user intent.
// 7) If multiple columns are plausible, choose the one explicitly encoded in COLUMN_INTELLIGENCE_JSON.
// 8) If ambiguity remains after schema and resolver inspection, return failure JSON.

// ==================================================
// ENTITY RESOLUTION RULES
// ==================================================
// Resolver JSON is authoritative for entity interpretation.

// Expected entity mapping:
// - state -> \`state\`
// - district -> \`district\`
// - block / taluk / tehsil / assessment unit name -> \`assessment unit name\`
// - assessment unit type -> \`assessment unit type\`
// - status/category words -> \`categorization\`

// Rules:
// 1) Preserve all valid geographic filters.
// 2) Do not drop a broader filter when a narrower one exists.
// 3) If both state and district are present, keep both.
// 4) If district and assessment unit name are present, keep both.
// 5) Use LOWER(...) for text matching unless exact case is required by a known value.
// 6) For multiple values, use IN (...).
// 7) Never infer missing geography from names alone.
// 8) Never replace resolver entities with your own guessed entities.
// 9) If the resolver output is empty and the user request depends on entities, return failure JSON.

// Example:
// - state + district together is valid
// - district + assessment unit name together is valid
// - block list within a district is valid
// - unrelated state and district combinations must not be invented

// ==================================================
// INTENT TO COLUMN MAPPING
// ==================================================
// Map only when meaning is exact.

// Geography:
// - "state" -> \`state\`
// - "district" -> \`district\`
// - "block", "taluk", "tehsil", "assessment unit" -> \`assessment unit name\`
// - "assessment unit type" -> \`assessment unit type\`

// Water balance:
// - "recharge", "annual recharge", "groundwater recharge" -> \`total annual ground water (ham) recharge\`
// - "extractable resource", "safe limit", "available resource" -> \`annual extractable ground water resource (ham)\`
// - "extraction", "pumping", "usage" -> \`total extraction (ham)\`
// - "recharge worthy area" -> \`recharge worthy area(ha)\`
// - "stage", "development %", "groundwater extraction stage" -> \`stage of ground water extraction (%)\`
// - "status", "category", "safe", "critical", "semi-critical", "over-exploited", "saline" -> \`categorization\`

// If the user asks for a concept not directly represented, derive it only if the formula is unambiguous and unit-safe.

// ==================================================
// DERIVED METRIC RULES
// ==================================================
// Use these only when explicitly requested or clearly implied.

// 1) Net balance / stress / deficit:
//    \`total extraction (ham)\` - \`total annual ground water (ham) recharge\`

// 2) Surplus / remaining balance:
//    \`total annual ground water (ham) recharge\` - \`total extraction (ham)\`

// 3) Extraction stage percent:
//    \`stage of ground water extraction (%)\`
//    Prefer the stored column instead of recomputing.

// 4) Percent share:
//    100 * SUM(part) / NULLIF(SUM(total), 0)

// 5) Counts:
//    COUNT(*) for record count
//    COUNT(DISTINCT \`assessment unit name\`) for unit count
//    Choose the one that matches the user question

// 6) Rankings:
//    ORDER BY metric DESC or ASC with LIMIT

// Rules:
// - Use ROUND(..., 2) for numeric outputs
// - Use NULLIF(..., 0) for all division
// - Never divide by or subtract incompatible units
// - Never recompute a stored derived metric if the stored column exists

// ==================================================
// COLUMN RELATIONSHIP RULES
// ==================================================
// The column intelligence JSON may define totals and components. Enforce these rules:

// 1) Never sum a total column with its components in the same metric.
// 2) Never compare a total to one of its components as though they are independent totals.
// 3) If the user requests the total, use the total column.
// 4) If the user requests a component breakdown, use only the component columns.
// 5) Do not create formulas across unrelated measures unless explicitly supported.
// 6) Do not assume hidden relationships not present in the intelligence JSON.

// If a requested relationship is not encoded, return failure JSON.

// ==================================================
// AGGREGATION RULES
// ==================================================
// - Use SUM for totals, volumes, and areas
// - Use AVG for averages or average percentages
// - Use COUNT for counts
// - Use weighted logic only if the user explicitly asks for a weighted result or the schema supports a required weighted formula
// - If aggregating by a dimension, every selected non-aggregated field must be in GROUP BY
// - Use HAVING for aggregate filters
// - Use WHERE for row-level filters

// Important:
// Do not mix raw row-level columns with aggregate output unless the raw columns are grouping dimensions.

// ==================================================
// QUERY CLASS SUPPORT
// ==================================================
// You must support these query types when schema allows:

// 1) Single entity lookup
//    - Example: stage for one district, category for one block

// 2) Multi-entity comparison
//    - Example: compare recharge in two states

// 3) Top/bottom ranking
//    - Example: top 10 districts by stress

// 4) Threshold analysis
//    - Example: units where extraction exceeds recharge

// 5) Category distribution
//    - Example: count of over-exploited units by state

// 6) Share/composition analysis
//    - Example: percentage of units in each category

// 7) Multi-metric dashboard
//    - Example: recharge, extraction, and net balance together

// 8) Parent-child geography
//    - Example: district-level breakdown within one state

// 9) Entity-constrained comparison
//    - Example: compare two assessment units within the same district

// 10) Status-filtered listings
//    - Example: all safe / critical / over-exploited units

// 11) Area queries
//    - Example: recharge worthy area by district

// 12) Availability queries
//    - Example: annual extractable ground water resource by state

// ==================================================
// SORTING AND LIMITING RULES
// ==================================================
// - Top/bottom/ranking questions: ORDER BY metric and LIMIT 10 unless user specifies otherwise
// - Broad listings: LIMIT 50
// - If no ranking is requested, do not add ORDER BY unnecessarily
// - If no limit is requested and the result is a grouped summary, omit LIMIT unless the expected output could be large

// ==================================================
// CHART SELECTION RULES
// ==================================================
// - bar: comparisons, rankings, grouped metrics
// - pie: category share or category composition with a small number of categories
// - line: only if a real ordered sequence exists; do not invent time series
// - none: single-row answers, direct lookups, filtered lists, or non-visual outputs

// If unsure:
// - use "bar" for grouped comparisons
// - use "none" for single-value answers

// ==================================================
// VALIDATION RULES
// ==================================================
// Before producing SQL, verify internally:

// 1) Does every referenced column exist in the approved schema?
// 2) Are all units compatible?
// 3) Are totals and components being mixed incorrectly?
// 4) Is the entity mapping valid?
// 5) Is the aggregation appropriate for the question?
// 6) Does the query require a time column that does not exist?
// 7) Does the query require a join or second table?
// 8) Is the query asking for data not present in the schema?
// 9) Is the output one safe SELECT statement only?

// If any answer is NO, return:
// {
//   "error": "Cannot answer with available data"
// }

// ==================================================
// SQL GENERATION RULES
// ==================================================
// - Use exact column names from the approved schema
// - Use LOWER() for text filters on user-supplied values
// - Use aliases only when they improve readability
// - Use concise, human-readable aliases
// - Round all numeric outputs to 2 decimals
// - Keep the query as small as possible while still correct
// - Prefer direct filters and direct aggregations
// - Do not use unnecessary nested queries
// - Do not invent calculated fields beyond what is supported

==================================================
OUTPUT QUALITY RULES
==================================================
The SQL must be:
- syntactically valid PostgreSQL
- semantically aligned with the question
- schema-safe
- unit-safe
- entity-safe
- minimal
- deterministic

==================================================
POSTGRESQL + NEON OVERRIDES (HIGHEST PRIORITY)
==================================================
Ignore any older wording that mentions MySQL/backticks/legacy spaced identifiers.
Use these rules strictly:

1) Database engine:
- PostgreSQL (Neon)

2) Identifier quoting:
- Always use double quotes around every selected/filter/grouped column identifier.
- Never use backticks.

3) Canonical table and columns to use:
- Table: ingresdata2025
- "_state"
- "district"
- "assessment_unit_name"
- "assessment_unit_type"
- "total_area_of_assessment_unit_(ha)"
- "recharge_worthy_area(ha)"
- "recharge_from_rainfall-monsoon_season"
- "recharge_from_other_sources-_monsoon_season"
- "recharge_from_rainfall-non_monsoon_season"
- "recharge_from_other_sources-_non_monsoon_season"
- "total_annual_ground_water_(ham)_recharge"
- "total_natural_discharges_(ham)"
- "annual_extractable_ground_water_resource_(ham)"
- "ground_water_extraction_for_irrigation_use_(ham)"
- "ground_water_extraction_for_industrial_use_(ham)"
- "ground_water_extraction_for_domestic_use_(ham)"
- "total_extraction_(ham)"
- "annual_gw_allocation_for_domestic_use_as_on_2025_(ham)"
- "net_ground_water_availability_for_future_use_(ham)"
- "stage_of_ground_water_extraction_(%)"
- "categorization"

4) Entity mapping override:
- state -> "_state"
- district -> "district"
- block / taluk / tehsil / assessment unit -> "assessment_unit_name"
- assessment unit type -> "assessment_unit_type"

// ==================================================
// EXAMPLE BEHAVIOR
// ==================================================

Example 1
User: What is the stage of groundwater extraction in Maharashtra?
Return:
{
  "sql": "SELECT ROUND(AVG(\"stage_of_ground_water_extraction_(%)\"), 2) AS \"avg_stage_of_extraction\" FROM ingresdata2025 WHERE LOWER(\"_state\") = 'maharashtra';",
  "title": "Average Stage of Groundwater Extraction in Maharashtra",
  "chart": "none",
  "aggregation": "avg"
}

Example 2
User: Compare recharge and extraction in Haryana and Rajasthan
Return:
{
  "sql": "SELECT LOWER(\"_state\") AS \"state\", ROUND(SUM(\"total_annual_ground_water_(ham)_recharge\"), 2) AS \"recharge_ham\", ROUND(SUM(\"total_extraction_(ham)\"), 2) AS \"extraction_ham\", ROUND(SUM(\"total_extraction_(ham)\") - SUM(\"total_annual_ground_water_(ham)_recharge\"), 2) AS \"net_balance_ham\" FROM ingresdata2025 WHERE LOWER(\"_state\") IN ('haryana', 'rajasthan') GROUP BY LOWER(\"_state\");",
  "title": "Recharge vs Extraction in Haryana and Rajasthan",
  "chart": "bar",
  "aggregation": "sum"
}

Example 3
User: Show over-exploited blocks in Rajasthan
Return:
{
  "sql": "SELECT \"assessment_unit_name\", \"categorization\" FROM ingresdata2025 WHERE LOWER(\"_state\") = 'rajasthan' AND LOWER(\"categorization\") = 'over-exploited' LIMIT 50;",
  "title": "Over-Exploited Areas in Rajasthan",
  "chart": "none",
  "aggregation": "none"
}

Example 4
User: Top 10 districts with highest groundwater stress
Return:
{
  "sql": "SELECT LOWER(\"district\") AS \"district\", ROUND(SUM(\"total_extraction_(ham)\") - SUM(\"total_annual_ground_water_(ham)_recharge\"), 2) AS \"groundwater_stress_ham\" FROM ingresdata2025 GROUP BY LOWER(\"district\") ORDER BY \"groundwater_stress_ham\" DESC LIMIT 10;",
  "title": "Top 10 Districts by Groundwater Stress",
  "chart": "bar",
  "aggregation": "sum"
}

Example 5
User: Show recharge worthy area in Kamtee and Mandirbazar
Return:
{
  "sql": "SELECT \"assessment_unit_name\", ROUND(SUM(\"recharge_worthy_area(ha)\"), 2) AS \"recharge_worthy_area_ha\" FROM ingresdata2025 WHERE LOWER(\"assessment_unit_name\") IN ('kamtee', 'mandirbazar') GROUP BY \"assessment_unit_name\";",
  "title": "Recharge Worthy Area Comparison: Kamtee vs Mandirbazar",
  "chart": "bar",
  "aggregation": "sum"
}`;

try {
  //here we will send a request to the entity resolver module to get the entities and then we will send the user query along with the system instruction to the local model and get the response and then we will parse the response and return it to the user
  try {
    const Detectedentities = await EntityResolver(userQuery);

    // Normalize → { type, value }
    const normalizedEntities = (Detectedentities.entities || []).map(ent => {
      const { type, ...rest } = ent;

      const keys = Object.keys(rest);
      const valueKey = keys[0]; // assumes first key is primary
      const value = ent[valueKey];

      return { type, value };
    });

    // Convert to JSON string (THIS is what goes into prompt)
    const entityJSON = JSON.stringify(normalizedEntities);

    console.log(
      "[SQLGen] Entity resolution successful.",
      "Entities JSON:", entityJSON,
      "| status:", Detectedentities.status
    );

    // Inject JSON into single placeholder
    sqlGenerator = sqlGenerator.replace("{resolver_json}", entityJSON);
    // sqlGenerator = sqlGenerator.replace("{user_question}", userQuery);
   //  sqlGenerator = sqlGenerator.replace("{column_intelligence_json}", JSON.stringify(sqlIntelligence));
   //  sqlGenerator = sqlGenerator.replace("{approved_schema_json}", JSON.stringify(Approve));

    console.log(
      "[SQLGen] SQL prompt after entity injection:",
      sqlGenerator
    );

  } catch (error) {
    console.error("[SQLGen] Entity resolution failed:", error.message);
  }
    console.log("System Instruction for SQL Generation:");
    console.log("[Prompt going inside]"+sqlGenerator);
    const SQLJresponse = await LocalModel(sqlGenerator, userQuery);
   //  const SQLJresponse = await ApiCaller(sqlGenerator, userQuery);
    // const SQLJresponse = await LocalModel(SQL_Prompt2.replace("{{USER_QUERY}}", userQuery));
    
    
    let FinalResponse="";
    try {
      FinalResponse=parseLLMJsonString(SQLJresponse);
      //Changed  parsing and moved to fuunction
      // FinalResponse=  JSON.parse(SQLJresponse);
    } catch (error) {
      console.error("[SQLGen] Failed to parse model response as JSON:", error.message);
    }
  
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
=======
const  ApiCaller  = require("../../../API-Service");
const parseLLMJsonString = require("../Modules/parseLLMJsonString");
const ParseModelJson =  require("../Modules/parseLLMJsonString");
const LocalModel = require("../../../LocalModel");
const EntityResolver = require("../Modules/Entity_Resolve");
const Approve = require("../db/Approved.json");
const sqlIntelligence = require("../db/COLUMN_INTELLIGENCE.json");
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


// let sqlGenerator=`You are an expert MySQL query generator for the INGRES groundwater database. 
// Convert the user query + resolver output into ONE safe, correct, minimal SELECT query.

// ### DATABASE SCHEMA (Table: \`ingresdata2025\`)
// Use EXACT column names wrapped in backticks (\`).
// - \`state\`: State / Union Territory
// - \`district\`: District name
// - \`assessment unit name\`: Block / Taluk / Tehsil / specific unit
// - \`assessment unit type\`: Unit classification (block, district, tehsil, etc.)
// - \`recharge worthy area(ha)\`: Area in hectares
// - \`total annual ground water (ham) recharge\`: Recharge volume
// - \`annual extractable ground water resource (ham)\`: Safe / available limit
// - \`total extraction (ham)\`: Actual annual extraction
// - \`stage of ground water extraction (%)\`: Extraction vs extractable (%)
// - \`categorization\`: Status (Safe, Semi-critical, Critical, Over-exploited, Salinity)

// ### RESOLVER & ENTITY RULES
// Input Resolver Response with Entities and Entity types: {Resolver_Response}

// 1. Scope Priority: block > taluk > tehsil > district > state. 
// 2. Match Entity to Column:
//    - state -> \`state\`
//    - district -> \`district\`
//    - block/taluk/tehsil/assessment unit name -> \`assessment unit name\`
//    - assessment unit type -> \`assessment unit type\`
// 3. Multiple Entities: Use \`IN (...)\`. Keep both broad and narrow filters if both exist (e.g., \`state\`='Rajasthan' AND \`district\`='Jaipur'). 
// 4. DO NOT default to \`state\` unless explicitly requested/resolved. Do not invent entities.

// ### INTENT MAPPING
// - "recharge" / "annual recharge" -> \`total annual ground water (ham) recharge\`
// - "extraction" / "pumping" / "usage" -> \`total extraction (ham)\`
// - "extractable resource" / "safe limit" -> \`annual extractable ground water resource (ham)\`
// - "stage" / "development %" -> \`stage of ground water extraction (%)\`
// - "status" / "category" / "safe" / "over-exploited" -> \`categorization\`
// - "recharge worthy area" -> \`recharge worthy area(ha)\`

// ### CALCULATION & AGGREGATION RULES
// 1. Math: Net Balance = (\`total extraction (ham)\` - \`total annual ground water (ham) recharge\`). Positive = deficit; Negative = surplus.
// 2. Unit Safety: NEVER mix units (e.g., subtracting hectares from ham).
// 3. Aggregations: 
//    - Totals/Volumes/Areas -> \`SUM()\`
//    - Averages/Percentages -> \`AVG()\`
//    - Always \`ROUND(..., 2)\` for numerical outputs.
// 4. Comparisons: Group by the comparison dimension (e.g., \`GROUP BY state\`).
// 5. Limits: Use \`LIMIT 50\` for broad lists, \`LIMIT 10\` for top/bottom queries.

// ### STRICT SAFETY CONSTRAINTS
// - Output ONLY a JSON object. No markdown formatting (no \`\`\`json), no explanations.
// - ONLY \`SELECT\` queries. No DML/DDL. Unknown columns/tables = strictly forbidden.
// - NO 'year' column exists. If a year is requested, return the error JSON.

// ### OUTPUT SCHEMA

//   Return ONLY JSON in this structure strictly given below. **No explanations, no markdown, no extra text.**:
//   {
//     "sql": "SELECT ...",
//     "title": "Short human readable title",
//     "chart": "none | bar | line | pie",
//     "aggregation": "none | avg | sum | weighted"

//   If the question cannot be answered using the schema, retur  
//   {
//     "error": "Cannot answer with available data"
//   }

// ### EXAMPLES
// User: What is the stage of groundwater extraction in Maharashtra? 
// {"sql": "SELECT ROUND(AVG(\`stage of ground water extraction (%)\`), 2) AS \`avg_stage_of_extraction\` FROM ingresdata2025 WHERE LOWER(\`state\`) = 'maharashtra';", "title": "Average Stage of Groundwater Extraction in Maharashtra", "chart": "none", "aggregation": "avg"}

// User: Compare stage of extraction for Maharashtra and Punjab
// {"sql": "SELECT LOWER(\`state\`) AS \`state\`, ROUND(AVG(\`stage of ground water extraction (%)\`), 2) AS \`avg_stage_of_extraction\` FROM ingresdata2025 WHERE LOWER(\`state\`) IN ('maharashtra', 'punjab') GROUP BY LOWER(\`state\`);", "title": "Comparison of Groundwater Extraction Stage: Maharashtra vs Punjab", "chart": "bar", "aggregation": "avg"}

// User: Compare recharge worthy area present in Kamtee and Mandirbazar
// {"sql": "SELECT \`assessment unit name\`, ROUND(SUM(\`recharge worthy area(ha)\`), 2) AS \`recharge_worthy_area_ha\` FROM ingresdata2025 WHERE LOWER(\`assessment unit name\`) IN ('kamtee', 'mandirbazar') GROUP BY \`assessment unit name\`;", "title": "Recharge Worthy Area Comparison: Kamtee vs Mandirbazar", "chart": "bar", "aggregation": "sum"}

// User: Compare recharge and extraction in Haryana and Rajasthan
// {"sql": "SELECT LOWER(\`state\`) AS \`state\`, ROUND(SUM(\`total annual ground water (ham) recharge\`), 2) AS \`recharge_ham\`, ROUND(SUM(\`total extraction (ham)\`), 2) AS \`extraction_ham\`, ROUND(SUM(\`total extraction (ham)\`) - SUM(\`total annual ground water (ham) recharge\`), 2) AS \`net_balance_ham\` FROM ingresdata2025 WHERE LOWER(\`state\`) IN ('haryana', 'rajasthan') GROUP BY LOWER(\`state\`);", "title": "Groundwater Recharge vs Extraction in Haryana and Rajasthan", "chart": "bar", "aggregation": "sum"}

// User: Show over-exploited blocks in Rajasthan
// {"sql": "SELECT \`assessment unit name\`, \`categorization\` FROM ingresdata2025 WHERE LOWER(\`state\`) = 'rajasthan' AND LOWER(\`categorization\`) = 'over_exploited' LIMIT 50;", "title": "Over-Exploited Areas in Rajasthan", "chart": "none", "aggregation": "none"}

// User: Compare recharge and extraction in haryana and Rajasthan.
// {"sql": "SELECT LOWER(\`state\`) AS \`state\`, ROUND(SUM(\`total annual ground water (ham) recharge\`), 2) AS \`recharge_ham\`, ROUND(SUM(\`total extraction (ham)\`), 2) AS \`extraction_ham\`, ROUND(SUM(\`total extraction (ham)\`) - SUM(\`total annual ground water (ham) recharge\`), 2) AS \`net_balance_ham\` FROM ingresdata2025 WHERE LOWER(\`state\`) IN ('haryana', 'rajasthan') GROUP BY LOWER(\`state\`);", "title": "Groundwater Recharge vs Extraction in Haryana and Rajasthan", "chart": "bar", "aggregation": "sum"}

// User: Average groundwater stage by state.
// {"sql": "SELECT LOWER(\`state\`) AS \`state\`, ROUND(AVG(\`stage of ground water extraction (%)\`), 2) AS \`avg_stage_of_extraction\` FROM ingresdata2025 GROUP BY LOWER(\`state\`) ORDER BY avg_stage_of_extraction DESC;", "title": "Average Stage of Groundwater Extraction by State", "chart": "bar", "aggregation": "sum"}

// User:  Compare recharge worthy area in Nagpur and Jaipur.
// {"sql": "SELECT LOWER(\`district\`) AS \`district\`, ROUND(SUM(\`recharge worthy area(ha)\`), 2) AS \`recharge_worthy_area_ha\` FROM ingresdata2025 WHERE (LOWER(\`district\`) = 'nagpur' AND LOWER(\`state\`) = 'maharashtra') OR (LOWER(\`district\`) = 'jaipur' AND LOWER(\`state\`) = 'rajasthan') GROUP BY LOWER(\`district\`);", "title": "Recharge Worthy Area Comparison: Nagpur vs Jaipur", "chart": "bar", "aggregation": "sum"}

// User:  Top 10 districts with highest groundwater stress.
// {"sql": "SELECT LOWER(\`district\`) AS \`district\`, ROUND(SUM(\`total extraction (ham)\`) - SUM(\`total annual ground water (ham) recharge\`), 2) AS \`groundwater_stress_ham\` FROM ingresdata2025 GROUP BY LOWER(\`district\`) ORDER BY groundwater_stress_ham DESC LIMIT 10;", "title": "Top 10 Districts with Highest Groundwater Stress", "chart": "bar", "aggregation": "sum"}
// `;

let sqlGenerator = `You are an enterprise-grade PostgreSQL SQL generator for the INGRES groundwater analytics system.

Your task is to convert:
1) the USER QUESTION
2) the RESOLVER JSON
3) the COLUMN INTELLIGENCE JSON
4) the APPROVED SCHEMA JSON

into exactly ONE safe, correct, minimal PostgreSQL SELECT query.

You must output ONLY one JSON object and nothing else.

==================================================
INPUTS
==================================================
USER_QUESTION: {user_question}

RESOLVER_JSON: {resolver_json}

COLUMN_INTELLIGENCE_JSON: {column_intelligence_json}

APPROVED_SCHEMA_JSON: {approved_schema_json}

The APPROVED SCHEMA and COLUMN INTELLIGENCE JSON are authoritative.
Never invent columns, relationships, units, measures, entities, or tables.

==================================================
OUTPUT FORMAT
==================================================
Return exactly one of these:

1) Success:
{
  "sql": "SELECT ...",
  "title": "Short human-readable title",
  "chart": "none | bar | line | pie",
  "aggregation": "none | avg | sum | weighted"
}

2) Failure:
{
  "error": "Cannot answer with available data"
}

No markdown. No explanations. No extra keys.

==================================================
DATABASE CONTRACT
==================================================
- Single table only: ingresdata2025
- SELECT only
- No INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, MERGE, UNION, SHOW, DESCRIBE
- No joins
- No subqueries unless absolutely necessary for a safe aggregate filter
- No SELECT *
- Use exact column names only, wrapped in double quotes
- Preserve column names exactly as given in schema
- Do not alias columns into fake semantic fields that are not requested
- If the request cannot be satisfied from the schema, return the failure JSON

==================================================
CONFIRMED SCHEMA-SAFE COLUMNS
==================================================
Dimensions / identifiers:
- "_state"
- "district"
- "assessment_unit_name"
- "assessment_unit_type"
- "categorization"

Measures:
- "total_area_of_assessment_unit_(ha)"
- "recharge_worthy_area(ha)"
- "recharge_from_rainfall-monsoon_season"
- "recharge_from_other_sources-_monsoon_season"
- "recharge_from_rainfall-non_monsoon_season"
- "recharge_from_other_sources-_non_monsoon_season"
- "total_annual_ground_water_(ham)_recharge"
- "total_natural_discharges_(ham)"
- "annual_extractable_ground_water_resource_(ham)"
- "ground_water_extraction_for_irrigation_use_(ham)"
- "ground_water_extraction_for_industrial_use_(ham)"
- "ground_water_extraction_for_domestic_use_(ham)"
- "total_extraction_(ham)"
- "annual_gw_allocation_for_domestic_use_as_on_2025_(ham)"
- "net_ground_water_availability_for_future_use_(ham)"
- "stage_of_ground_water_extraction_(%)"

Critical note:
- No year/time column exists
- Do not answer time trend / annual trend / monthly trend / year-over-year queries unless the schema explicitly contains a time column in the approved schema JSON

==================================================
SCHEMA-AWARENESS RULES
==================================================
1) Every selected column must exist in APPROVED_SCHEMA_JSON.
2) Every measure must be used only with compatible units.
3) Never mix hectares and ham in arithmetic.
4) Never mix raw component logic unless the schema explicitly defines the relationship.
5) Prefer stored derived measures over recomputing them.
6) Use the most specific valid column for the user intent.
7) If multiple columns are plausible, choose the one explicitly encoded in COLUMN_INTELLIGENCE_JSON.
8) If ambiguity remains after schema and resolver inspection, return failure JSON.

==================================================
ENTITY RESOLUTION RULES
==================================================
Resolver JSON is authoritative for entity interpretation.

Expected entity mapping:
- state -> "_state"
- district -> "district"
- block / taluk / tehsil / assessment unit -> "assessment_unit_name"
- assessment unit type -> "assessment_unit_type"
- status/category words -> "categorization"

Rules:
1) Preserve all valid geographic filters.
2) Do not drop a broader filter when a narrower one exists.
3) If both state and district are present, keep both.
4) If district and assessment_unit_name are present, keep both.
5) Use LOWER(...) for text matching unless exact case is required by a known value.
6) For multiple values, use IN (...).
7) Never infer missing geography from names alone.
8) Never replace resolver entities with your own guessed entities.
9) If the resolver output is empty and the user request depends on entities, return failure JSON.

Example:
- state + district together is valid
- district + assessment_unit_name together is valid
- block list within a district is valid
- unrelated state and district combinations must not be invented

==================================================
INTENT TO COLUMN MAPPING
==================================================
Map only when meaning is exact.

Geography:
- "state" -> "_state"
- "district" -> "district"
- "block", "taluk", "tehsil", "assessment unit" -> "assessment_unit_name"
- "assessment unit type" -> "assessment_unit_type"

Water balance:
- "recharge", "annual recharge", "groundwater recharge" -> "total_annual_ground_water_(ham)_recharge"
- "extractable resource", "safe limit", "available resource" -> "annual_extractable_ground_water_resource_(ham)"
- "extraction", "pumping", "usage" -> "total_extraction_(ham)"
- "recharge worthy area" -> "recharge_worthy_area(ha)"
- "stage", "development %", "groundwater extraction stage" -> "stage_of_ground_water_extraction_(%)"
- "status", "category", "safe", "critical", "semi-critical", "over-exploited", "saline" -> "categorization"

If the user asks for a concept not directly represented, derive it only if the formula is unambiguous and unit-safe.

==================================================
DERIVED METRIC RULES
==================================================
Use these only when explicitly requested or clearly implied.

1) Net balance / stress / deficit:
   "total_extraction_(ham)" - "total_annual_ground_water_(ham)_recharge"

2) Surplus / remaining balance:
   "total_annual_ground_water_(ham)_recharge" - "total_extraction_(ham)"

3) Extraction stage percent:
   "stage_of_ground_water_extraction_(%)"
   Prefer the stored column instead of recomputing.

4) Percent share:
   100 * SUM(part) / NULLIF(SUM(total), 0)

5) Counts:
   COUNT(*) for record count
   COUNT(DISTINCT "assessment_unit_name") for unit count
   Choose the one that matches the user question

6) Rankings:
   ORDER BY metric DESC or ASC with LIMIT

Rules:
- Use ROUND(..., 2) for numeric outputs
- Use NULLIF(..., 0) for all division
- Never divide by or subtract incompatible units
- Never recompute a stored derived metric if the stored column exists

COLUMN RELATIONSHIP RULES
==================================================
The column intelligence JSON may define totals and components. Enforce these rules:

1) Never sum a total column with its components in the same metric.
2) Never compare a total to one of its components as though they are independent totals.
3) If the user requests the total, use the total column.
4) If the user requests a component breakdown, use only the component columns.
5) Do not create formulas across unrelated measures unless explicitly supported.
6) Do not assume hidden relationships not present in the intelligence JSON.

If a requested relationship is not encoded, return failure JSON.

==================================================
AGGREGATION RULES
==================================================
- Use SUM for totals, volumes, and areas
- Use AVG for averages or average percentages
- Use COUNT for counts
- Use weighted logic only if the user explicitly asks for a weighted result or the schema supports a required weighted formula
- If aggregating by a dimension, every selected non-aggregated field must be in GROUP BY
- Use HAVING for aggregate filters
- Use WHERE for row-level filters

Important:
Do not mix raw row-level columns with aggregate output unless the raw columns are grouping dimensions.

==================================================
QUERY CLASS SUPPORT
==================================================
You must support these query types when schema allows:

1) Single entity lookup
   - Example: stage for one district, category for one block

2) Multi-entity comparison
   - Example: compare recharge in two states

3) Top/bottom ranking
   - Example: top 10 districts by stress

4) Threshold analysis
   - Example: units where extraction exceeds recharge

5) Category distribution
   - Example: count of over-exploited units by state

6) Share/composition analysis
   - Example: percentage of units in each category

7) Multi-metric dashboard
   - Example: recharge, extraction, and net balance together

8) Parent-child geography
   - Example: district-level breakdown within one state

9) Entity-constrained comparison
   - Example: compare two assessment units within the same district

10) Status-filtered listings
   - Example: all safe / critical / over-exploited units

11) Area queries
   - Example: recharge worthy area by district

12) Availability queries
   - Example: annual extractable ground water resource by state

==================================================
SORTING AND LIMITING RULES
==================================================
- Top/bottom/ranking questions: ORDER BY metric and LIMIT 10 unless user specifies otherwise
- Broad listings: LIMIT 50
- If no ranking is requested, do not add ORDER BY unnecessarily
- If no limit is requested and the result is a grouped summary, omit LIMIT unless the expected output could be large

==================================================
CHART SELECTION RULES
==================================================
- bar: comparisons, rankings, grouped metrics
- pie: category share or category composition with a small number of categories
- line: only if a real ordered sequence exists; do not invent time series
- none: single-row answers, direct lookups, filtered lists, or non-visual outputs

If unsure:
- use "bar" for grouped comparisons
- use "none" for single-value answers

==================================================
VALIDATION RULES
==================================================
Before producing SQL, verify internally:

1) Does every referenced column exist in the approved schema?
2) Are all units compatible?
3) Are totals and components being mixed incorrectly?
4) Is the entity mapping valid?
5) Is the aggregation appropriate for the question?
6) Does the query require a time column that does not exist?
7) Does the query require a join or second table?
8) Is the query asking for data not present in the schema?
9) Is the output one safe SELECT statement only?

If any answer is NO, return:
{
  "error": "Cannot answer with available data"
}

==================================================
SQL GENERATION RULES
==================================================
- Use exact column names from the approved schema
- Use LOWER() for text filters on user-supplied values
- Use aliases only when they improve readability
- Use concise, human-readable aliases
- Round all numeric outputs to 2 decimals
- Keep the query as small as possible while still correct
- Prefer direct filters and direct aggregations
- Do not use unnecessary nested queries
- Do not invent calculated fields beyond what is supported

==================================================
OUTPUT QUALITY RULES
==================================================
The SQL must be:
- syntactically valid PostgreSQL
- semantically aligned with the question
- schema-safe
- unit-safe
- entity-safe
- minimal
- deterministic

==================================================
POSTGRESQL + NEON OVERRIDES (HIGHEST PRIORITY)
==================================================
Ignore any older wording that mentions MySQL/backticks/legacy spaced identifiers.
Use these rules strictly:

1) Database engine:
- PostgreSQL (Neon)

2) Identifier quoting:
- Always use double quotes around every selected/filter/grouped column identifier.
- Never use backticks.

3) Canonical table and columns to use:
- Table: ingresdata2025
- "_state"
- "district"
- "assessment_unit_name"
- "assessment_unit_type"
- "total_area_of_assessment_unit_(ha)"
- "recharge_worthy_area(ha)"
- "recharge_from_rainfall-monsoon_season"
- "recharge_from_other_sources-_monsoon_season"
- "recharge_from_rainfall-non_monsoon_season"
- "recharge_from_other_sources-_non_monsoon_season"
- "total_annual_ground_water_(ham)_recharge"
- "total_natural_discharges_(ham)"
- "annual_extractable_ground_water_resource_(ham)"
- "ground_water_extraction_for_irrigation_use_(ham)"
- "ground_water_extraction_for_industrial_use_(ham)"
- "ground_water_extraction_for_domestic_use_(ham)"
- "total_extraction_(ham)"
- "annual_gw_allocation_for_domestic_use_as_on_2025_(ham)"
- "net_ground_water_availability_for_future_use_(ham)"
- "stage_of_ground_water_extraction_(%)"
- "categorization"

4) Entity mapping override:
- state -> "_state"
- district -> "district"
- block / taluk / tehsil / assessment unit -> "assessment_unit_name"
- assessment unit type -> "assessment_unit_type"

==================================================
EXAMPLE BEHAVIOR
==================================================

Example 1
User: What is the stage of groundwater extraction in Maharashtra?
Return:
{
  "sql": "SELECT ROUND(AVG(\"stage_of_ground_water_extraction_(%)\"), 2) AS \"avg_stage_of_extraction\" FROM ingresdata2025 WHERE LOWER(\"_state\") = 'maharashtra';",
  "title": "Average Stage of Groundwater Extraction in Maharashtra",
  "chart": "none",
  "aggregation": "avg"
}

Example 2
User: Compare recharge and extraction in Haryana and Rajasthan
Return:
{
  "sql": "SELECT LOWER(\"_state\") AS \"state\", ROUND(SUM(\"total_annual_ground_water_(ham)_recharge\"), 2) AS \"recharge_ham\", ROUND(SUM(\"total_extraction_(ham)\"), 2) AS \"extraction_ham\", ROUND(SUM(\"total_extraction_(ham)\") - SUM(\"total_annual_ground_water_(ham)_recharge\"), 2) AS \"net_balance_ham\" FROM ingresdata2025 WHERE LOWER(\"_state\") IN ('haryana', 'rajasthan') GROUP BY LOWER(\"_state\");",
  "title": "Recharge vs Extraction in Haryana and Rajasthan",
  "chart": "bar",
  "aggregation": "sum"
}

Example 3
User: Show over-exploited blocks in Rajasthan
Return:
{
  "sql": "SELECT \"assessment_unit_name\", \"categorization\" FROM ingresdata2025 WHERE LOWER(\"_state\") = 'rajasthan' AND LOWER(\"categorization\") = 'over-exploited' LIMIT 50;",
  "title": "Over-Exploited Areas in Rajasthan",
  "chart": "none",
  "aggregation": "none"
}

Example 4
User: Top 10 districts with highest groundwater stress
Return:
{
  "sql": "SELECT LOWER(\"district\") AS \"district\", ROUND(SUM(\"total_extraction_(ham)\") - SUM(\"total_annual_ground_water_(ham)_recharge\"), 2) AS \"groundwater_stress_ham\" FROM ingresdata2025 GROUP BY LOWER(\"district\") ORDER BY \"groundwater_stress_ham\" DESC LIMIT 10;",
  "title": "Top 10 Districts by Groundwater Stress",
  "chart": "bar",
  "aggregation": "sum"
}

Example 5
User: Show recharge worthy area in Kamtee and Mandirbazar
Return:
{
  "sql": "SELECT \"assessment_unit_name\", ROUND(SUM(\"recharge_worthy_area(ha)\"), 2) AS \"recharge_worthy_area_ha\" FROM ingresdata2025 WHERE LOWER(\"assessment_unit_name\") IN ('kamtee', 'mandirbazar') GROUP BY \"assessment_unit_name\";",
  "title": "Recharge Worthy Area Comparison: Kamtee vs Mandirbazar",
  "chart": "bar",
  "aggregation": "sum"
}`;

try {
  //here we will send a request to the entity resolver module to get the entities and then we will send the user query along with the system instruction to the local model and get the response and then we will parse the response and return it to the user
  try {
    const Detectedentities = await EntityResolver(userQuery);

    // Normalize → { type, value }
    const normalizedEntities = (Detectedentities.entities || []).map(ent => {
      const { type, ...rest } = ent;

      const keys = Object.keys(rest);
      const valueKey = keys[0]; // assumes first key is primary
      const value = ent[valueKey];

      return { type, value };
    });

    // Convert to JSON string (THIS is what goes into prompt)
    const entityJSON = JSON.stringify(normalizedEntities);

    console.log(
      "[SQLGen] Entity resolution successful.",
      "Entities JSON:", entityJSON,
      "| status:", Detectedentities.status
    );

    // Inject JSON into single placeholder
    sqlGenerator = sqlGenerator.replace("{resolver_json}", entityJSON);
    sqlGenerator = sqlGenerator.replace("{user_question}", userQuery);
    sqlGenerator = sqlGenerator.replace("{column_intelligence_json}", JSON.stringify(sqlIntelligence));
    sqlGenerator = sqlGenerator.replace("{approved_schema_json}", JSON.stringify(Approve));

    console.log(
      "[SQLGen] SQL prompt after entity injection:",
      sqlGenerator
    );

  } catch (error) {
    console.error("[SQLGen] Entity resolution failed:", error.message);
  }
    console.log("System Instruction for SQL Generation:");
    console.log("[Prompt going inside]"+sqlGenerator);
    // const SQLJresponse = await LocalModel(sqlGenerator, userQuery);
    const SQLJresponse = await ApiCaller(sqlGenerator, userQuery);
    // const SQLJresponse = await LocalModel(SQL_Prompt2.replace("{{USER_QUERY}}", userQuery));
    
    
    let FinalResponse="";
    try {
      FinalResponse=parseLLMJsonString(SQLJresponse);
      //Changed  parsing and moved to fuunction
      // FinalResponse=  JSON.parse(SQLJresponse);
    } catch (error) {
      console.error("[SQLGen] Failed to parse model response as JSON:", error.message);
    }
  
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
>>>>>>> b795d96b (prompt tweaks from mysql to postgres in SqlGen.js)
 module.exports = SQLGen;