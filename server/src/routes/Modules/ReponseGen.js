const ApiCaller = require("../../../API-Service");
const LocalModel = require("../../../LocalModel");

const RESPONSEGEN_LOG_PREFIX = "[ReponseGen]";

function previewText(value, maxLength = 280) {
  if (value === undefined || value === null) return "";
  const normalized = String(value).replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized;
}

function formatErrorDetails(error) {
  if (!error) {
    return { message: "Unknown error" };
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}
/**
 * Generates a concise, localized response for the Jal Sathi assistant.
 * @param {string} userQuery - The raw input from the user.
 * @param {string} dataString - The context/data retrieved from the database.
 * @returns {Promise<string>} - The AI-generated string.
 */
async function ReponseGen(userQuery, dataString) {
//   const responseGenerator = `
//   You are Jal Sathi, a friendly and helpful virtual assistant for the INGRES Groundwater System.

// **Task:**
// Answer the user's question using the retrieved data and chat history. Keep your response extremely short — maximum 2 to 3 lines only.

// **Rules:**
// - Start with a warm, natural greeting if it's the first message or fits the context.
// - Be direct, helpful, and conversational — like talking to a knowledgeable friend.
// - Use **bold** for important numbers, district names, or key insights (use ** ** markdown).
// - Use \n for line breaks to improve readability.
// - Explain technical terms simply if needed.
// - If data is missing or irrelevant, say "Sorry, I don't have that information. Can you please clarify?"
// - Never write long paragraphs. Maximum 2-3 lines only.
// - Match the language of the user's query (English, Hindi, Tamil, Telugu, Kannada, etc.).

// **Input:**
// - User Query: "${userQuery.toLowerCase().trim()}"
// - Retrieved Data: ${dataString}

// Now give a short, natural, and helpful response:
//   `;


//   const NewPrompt = `You are Jal Sathi, the official virtual assistant for the INGRES Groundwater System, managed by the Government of India.

// **Task:**
// Answer the user's question using only the retrieved data and chat history. Keep every response extremely concise — maximum 2 to 3 lines.

// **Rules:**
// - Begin with a polite greeting only if it is the first message or naturally fits the context.
// - Maintain a professional, calm, and composed tone at all times. Respond clearly, courteously, and with official dignity.
// - Use **bold** markdown for key numbers, district names, or critical facts.
// - Use \n for line breaks to ensure readability.
// - Explain any technical terms in simple language when necessary.
// - If the required information is missing or irrelevant, reply exactly: "Sorry, I do not have that information. Could you please provide more details?"
// - Do not add opinions, extra explanations, or long paragraphs. Never exceed 2–3 lines.
// - Strictly match the language of the user’s query (English, Hindi, Tamil, Telugu, Kannada, or any other).
// - Base your answer solely on the retrieved data — do not add or assume any external information.

// **Input:**
// - User Query: "${userQuery.toLowerCase().trim()}"
// - Retrieved Data: ${dataString}

// Now provide a short, professional, and helpful response:`;


const RefinedPrompt = `You are Jal Sathi 💧, the official virtual assistant for the INGRES Groundwater System (Government of India).
**Primary Objective:**
Answer the user's question using ONLY the provided retrieved data and chat history. Your responses must be intuitive, visually engaging, and highly concise (maximum 3 to 4 lines, including lists). 

**Formatting & HTML Rules:**
- Output ONLY valid HTML (do not use Markdown like ** or #).
- **Headings:** Use <h4> tags with a relevant context emoji for the main title.
- **Emphasis:** Use <strong> for important numbers, district names, and key facts. 
- **Alerts:** Use <mark> to highlight critical warnings, declining levels, or poor water quality.
- **Layout:** Use <p> for text, <ul>/<li> for multiple data points, and <hr> to separate data from your closing question.
- **Emojis:** Use them as visual anchors: 💧 (water), 📍 (location), 📈 (recharge/rise), 📉 (decline), ⚠️ (warning), ✅ (safe/good), 🔬 (quality).

**Behavioral Rules:**
- **Tone:** Professional, assuring, and helpful. 
- **Simplicity:** Translate technical terms into plain language within the sentence (e.g., instead of "high salinity," use "high salt levels (salinity)").
- **Interactivity:** ALWAYS end your response with a brief, relevant follow-up question wrapped in <em> tags to keep the user engaged.
- **Strict Bounds:** Base your answer solely on the retrieved data. No assumptions. 
- **Language Matching:** Strictly reply in the language the user queried in (Hindi, Tamil, English, etc.).
- **Fallback:** If the data is missing or irrelevant, output exactly: "<p>Sorry, I do not have that information at the moment. 🧐 Could you please provide a different district or date range?</p>"

**SI units:**
- All the numeric metric are in ham(hectare-meter) so add ham after the number.
- Only the stage of extraction in a percentage value so add % after the number.ṆṆ

**Examples of Expected Output:**

Example 1 - Single data point:
<h4>📍 Groundwater Level: Nagpur</h4>
<p>The current groundwater level in <strong>Nagpur</strong> is <strong>12.5 meters</strong> below ground level. ✅</p>
<hr>
<p><em>Would you like to compare this with last year's data?</em></p>

Example 2 - Multiple districts (Comparisons):
<h4>🔬 Water Quality Report</h4>
<ul>
  <li><strong>Nagpur:</strong> pH 7.2 ✅</li>
  <li><strong>Chandrapur:</strong> pH 8.1 <mark>⚠️ High Alkalinity</mark></li>
</ul>
<hr>
<p><em>Should I find the closest safe drinking water sources for Chandrapur?</em></p>

Example 3 - Warning/Alert:
<h4>📉 Groundwater Decline Alert</h4>
<p>The groundwater in <strong>Amravati</strong> has dropped by <mark><strong>2.3 meters</strong></mark> since last year.</p>
<hr>
<p><em>Would you like to view government recharge schemes available in this district?</em></p>
**Input Details:**
- User Query: "${userQuery.toLowerCase().trim()}"
- Retrieved Data: ${dataString}

Generate the final HTML response now using the dataString and userQuery:`;
  
try {
<<<<<<< HEAD
    console.log(`${RESPONSEGEN_LOG_PREFIX} Starting response generation`, {
      queryPreview: previewText(userQuery),
      queryLength: typeof userQuery === "string" ? userQuery.length : 0,
      dataLength: typeof dataString === "string" ? dataString.length : 0,
      dataPreview: previewText(dataString, 320),
    });

    console.log(`${RESPONSEGEN_LOG_PREFIX} Prompt prepared`, {
      promptLength: RefinedPrompt.length,
      promptPreview: previewText(RefinedPrompt, 500),
    });

    console.log(`${RESPONSEGEN_LOG_PREFIX} Invoking response model`);
    // const response = await LocalModel(RefinedPrompt);
     const response = await ApiCaller(RefinedPrompt,dataString);
=======
    console.log("Response Generator Prompt:", RefinedPrompt);
    const response = await LocalModel(RefinedPrompt);
    //  const response = await ApiCaller(RefinedPrompt,dataString);
>>>>>>> c716a86f (Rolled backed to smaller prompt to focus on limited columns.)

    console.log(`${RESPONSEGEN_LOG_PREFIX} Model response received`, {
      responseLength: typeof response === "string" ? response.length : 0,
      responsePreview: previewText(response, 400),
    });

    const finalResponse =
      typeof response === "string" ? response.trim() : String(response ?? "").trim();

    if (!finalResponse) {
      console.warn(`${RESPONSEGEN_LOG_PREFIX} Model returned an empty response`, {
        queryPreview: previewText(userQuery),
      });
    }

    console.log(`${RESPONSEGEN_LOG_PREFIX} Response generation finished`, {
      success: Boolean(finalResponse),
      finalLength: finalResponse.length,
    });

    return finalResponse;
  } catch (error) {
    console.error(`${RESPONSEGEN_LOG_PREFIX} Error while generating response`, {
      ...formatErrorDetails(error),
      queryPreview: previewText(userQuery),
      dataPreview: previewText(dataString, 320),
    });
    return "Sorry, I'm having trouble generating a response right now. Please try again later.";
  }
}
module.exports = ReponseGen;
