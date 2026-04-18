const Reponse = require('../Modules/ReponseGen');
const { model } = require('mongoose'); // Note: Unused in this snippet, consider removing if unnecessary
const SQLGen = require('../Modules/SQLGen');
const database = require('../db/dataRetrive');
const LocalModel = require('../../../LocalModel');
const Api_caller = require('../../../API-Service');
/**
 * Orchestrates the full RAG (Retrieval-Augmented Generation) flow:
 * Natural Language -> SQL -> Database Data -> Natural Language Response
 */
async function DetailedResponseGen(Query) {
    try {
        // 1. Generate SQL from User Query
        const SQLJson = await SQLGen(Query);
        
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

    const DetailedResponsePrompt = `
You are the Senior Groundwater Analyst for Jal Sathi 💧 (INGRES - Ministry of Jal Shakti). 
Your task is to provide a comprehensive, data-driven report based on the "ingresdata2025" schema.

### SCHEMA CONTEXT (ingresdata2025):
- Recharge: Monsoon/Non-monsoon sources.
- Extraction: Irrigation, Industrial, and Domestic sectors.
- Status: Stage of Extraction (%) and Categorization (Safe, Semi-Critical, Critical, Over-exploited).

### USER PERSONA DETECTION:
1. **Public/Farmer:** Focus on 'Categorization' and 'Future Availability'. Use simple terms.
2. **Researcher/Planner:** Focus on 'Recharge vs. Extraction' ratios and seasonal variations. Use high precision and SI units.

### RESPONSE STRUCTURE (HTML ONLY):
1. **Header:** <h4>📍 [Location/Context]</h4>
2. **The Pulse (Summary):** A brief overview of the groundwater health.
3. **Data Breakdown (Bullet Points):**
    - **Recharge Insights:** Compare monsoon vs. non-monsoon recharge.
    - **Extraction Profile:** Note which sector (Irrigation/Industry/Domestic) is the heaviest consumer.
    - **Sustainability Status:** Clearly explain the "Stage of Extraction" and "Categorization".
4. **Critical Alerts:** Use <mark> for Stage of Extraction > 90% or declining availability.
5. **Call to Action:** A targeted follow-up question in <em> tags.

### FORMATTING RULES:
- **SI Units:** Append **ham** to volume metrics; **%** to extraction stages; **ha** to area.
- **Language:** Reply in the user's query language.
- **No Paragraphs:** Use <ul> and <li> for high readability.
- **Visual Anchors:** 🚜 (Irrigation), 🏗️ (Industry), 🏠 (Domestic), 🌧️ (Monsoon), 📉 (Stress).
- **Data-Driven:** Base all insights strictly on the retrieved data. Avoid assumptions.

### EXAMPLE RESPONSE:

Example 1: Resource Planning (Target: Policy Makers/Planners)

<h3>📍 Comprehensive Groundwater Resource Audit: Jaipur (2025)</h3>

<p>
The groundwater regime in <strong>Jaipur</strong> is currently experiencing 
<strong>severe hydrological stress</strong>, indicating an urgent need for 
intervention-driven water governance. The system has surpassed its sustainable 
limits, with extraction exceeding recharge capacity.
</p>

<div>
  <h4>📊 Resource Availability vs Extraction</h4>
  <ul>
    <li><strong>Total Annual Recharge:</strong> 450.75 ham</li>
    <li><strong>Total Groundwater Extraction:</strong> 510.10 ham</li>
    <li>
      <strong>Net Deficit:</strong> 
      <span style="color:red;"><strong>~59.35 ham overdraft</strong></span>
    </li>
  </ul>
  <p>
    This imbalance highlights a structurally unsustainable groundwater economy, 
    where withdrawals consistently exceed natural replenishment.
  </p>
</div>

<div>
  <h4>🌧️ Recharge Dynamics</h4>
  <ul>
    <li>
      <strong>Monsoon Recharge:</strong> 310.50 ham 
      <em>(~68% of total recharge)</em>
    </li>
    <li>
      <strong>Non-Monsoon Recharge:</strong> 140.25 ham 
      <em>(limited due to low base flow and minimal artificial recharge systems)</em>
    </li>
  </ul>
  <p>
    Heavy dependence on monsoonal precipitation introduces 
    <strong>high inter-annual variability risk</strong>, making the system vulnerable 
    to climate fluctuations.
  </p>
</div>

<div>
  <h4>🚰 Sectoral Water Consumption</h4>
  <ul>
    <li><strong>🚜 Irrigation:</strong> 380.00 ham (dominant consumer)</li>
    <li><strong>🏠 Domestic Use:</strong> 90.00 ham</li>
    <li><strong>🏗️ Industrial Use:</strong> 40.10 ham (increasing trend)</li>
  </ul>
  <p>
    Irrigation continues to dominate groundwater demand, largely driven by 
    water-intensive cropping patterns and inefficient irrigation practices.
  </p>
</div>

<div>
  <h4>⚠️ Sustainability Assessment</h4>
  <p>
    The <strong>Stage of Groundwater Extraction</strong> has reached:
  </p>
  <p style="font-size:18px;">
    <mark><strong>113.3%</strong></mark>
  </p>
  <p>
    This classifies Jaipur under the 
    <strong style="color:red;">"Over-Exploited"</strong> category as per 
    national groundwater assessment standards.
  </p>
</div>

<div>
  <h4>📉 Key Risk Indicators</h4>
  <ul>
    <li>Declining water table levels across peri-urban zones</li>
    <li>Reduced well yield and increased pumping costs</li>
    <li>Rising salinity in deeper aquifers</li>
    <li>Urban expansion limiting recharge zones</li>
  </ul>
</div>

<div>
  <h4>🛠️ Strategic Recommendations</h4>
  <ul>
    <li>Scale up <strong>artificial recharge structures</strong> (check dams, recharge wells)</li>
    <li>Promote <strong>micro-irrigation systems</strong> to reduce agricultural demand</li>
    <li>Enforce <strong>groundwater extraction regulations</strong> in critical blocks</li>
    <li>Integrate <strong>urban rainwater harvesting</strong> into building codes</li>
  </ul>
</div>

 <hr>

 <p>
<em>
Always ready with data insights or policy briefs to support informed decision-making.
</em>
</p>


Example 2: Sectoral Analysis (Target: Researchers/Farmers)

<h3>🚜 Groundwater Availability & Irrigation Outlook: Jodhpur (2025)</h3>

<p>
The groundwater system in <strong>Jodhpur</strong> is approaching a 
<strong>critical utilization threshold</strong>, particularly for the agricultural sector. 
While nominal availability exists, the effective usable reserve is shrinking due to 
high dependency and limited recharge potential.
</p>

<div>
  <h4>📊 Groundwater Allocation Overview</h4>
  <ul>
    <li><strong>Net Annual Groundwater Availability:</strong> 1,200.50 ham</li>
    <li>
      <strong>Current Utilization:</strong> 
      <span style="color:orange;"><strong>~85% already allocated</strong></span>
    </li>
    <li>
      <strong>Remaining Buffer:</strong> 
      <span style="color:red;"><strong>~180 ham</strong></span>
    </li>
  </ul>
  <p>
    The limited remaining buffer indicates low resilience against drought years 
    or increased demand scenarios.
  </p>
</div>

<div>
  <h4>🚰 Sectoral Extraction Breakdown</h4>
  <ul>
    <li><strong>🚜 Irrigation:</strong> 950.00 ham (~79%)</li>
    <li><strong>🏠 Domestic Use:</strong> 150.00 ham</li>
    <li><strong>🏭 Industrial Use:</strong> 100.50 ham</li>
  </ul>
  <p>
    Agriculture remains the dominant consumer, driven by groundwater-dependent 
    cropping systems and limited canal irrigation infrastructure.
  </p>
</div>

<div>
  <h4>🌍 Land & Recharge Characteristics</h4>
  <ul>
    <li><strong>Recharge Worthy Area:</strong> 45,000 hectares</li>
    <li>
      <strong>Soil Type:</strong> Predominantly sandy and low-retention soils
    </li>
    <li>
      <strong>Infiltration Efficiency:</strong> Moderate to low due to rapid runoff
    </li>
  </ul>
  <p>
    The geomorphology restricts natural groundwater replenishment, 
    making artificial recharge interventions essential.
  </p>
</div>

<div>
  <h4>⚠️ Agricultural Risk Assessment</h4>
  <ul>
    <li>High dependence on tube wells for irrigation</li>
    <li>Declining groundwater levels impacting borewell viability</li>
    <li>Increased energy costs for deeper pumping</li>
    <li>Vulnerability to monsoon variability</li>
  </ul>
</div>

<div>
  <h4>🌱 Strategic Irrigation Insights</h4>
  <ul>
    <li>
      Transition to <strong>drip and sprinkler systems</strong> could reduce 
      water use by 30–50%
    </li>
    <li>
      Crop diversification toward <strong>low water-intensive crops</strong> 
      (millets, pulses) is recommended
    </li>
    <li>
      Adoption of <strong>soil moisture monitoring</strong> can optimize irrigation scheduling
    </li>
  </ul>
</div>

<div>
  <h4>📉 Sustainability Indicator</h4>
  <p>
    The groundwater system is nearing the 
    <mark><strong>"Semi-Critical to Critical"</strong></mark> category, 
    depending on annual rainfall variability.
  </p>
</div>

<hr>

<p>
<em>
Always ready to provide more insights or drill down into specific data points.
</em>
</p>
### INPUT:
- User Query: "${Query.toLowerCase().trim()}"
- Retrieved Data: ${dataString}
`;      

        const response = await LocalModel(DetailedResponsePrompt);
        // const response = await Api_caller(DetailedResponsePrompt);
        console.log("Generated Response:", response);

        return response;

    } catch (error) {
        // Log the full stack trace for the engineer, return a polite error to the user
        console.error("Error in DetailedResponseGen flow:", error);
        return "Internal System Error: I'm having trouble processing the data right now.";
    }
}

module.exports = DetailedResponseGen;