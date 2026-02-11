const {GoogleGenAI} = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function ApiCaller(SystemInstruction) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: SystemInstruction,
    // contents: system_instruction.replace("{{USER_QUERY}}", "What is the stage of groundwater extraction in Punjab?"),
    // config:{
    //     system_instruction: system_instruction
    // }
  });
  console.log("Response from Gemini API:", response.text);
  return response.text;
}

module.exports =  ApiCaller ;
