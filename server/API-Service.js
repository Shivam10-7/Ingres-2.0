const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function ApiCaller(SystemInstruction, Userquery) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${SystemInstruction}\n\n${Userquery}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1
    }
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

  console.log("Response from Gemini API:", text);
  return text;
}

module.exports = ApiCaller;