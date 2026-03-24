require('dotenv').config();

const { Ollama } = require('ollama');


async function ModelHandler(SystemPrompt, Userquery) {
  const provider = process.env.MODEL_PROVIDER;

  // // ---- OLLAMA (LOCAL) ----
  // if (provider === 'ollama') {
  //   const ollama = new Ollama();

  //   const response = await ollama.chat({
  //     model: 'qwen2.5-coder:7b',
  //     messages: [
  //       { role: 'system', content: SystemPrompt },
  //       { role: 'user', content: Userquery }
  //     ],
  //     options: {
  //       temperature: 0.1
  //     }
  //   });

  //  console.log("OLLAMA Response:", response.message.content);
  //   return response.message.content;
  // }

  // ---- grok (API) ----
  const Groq = require('groq-sdk');
  if (provider === 'groq') {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SystemPrompt },
      { role: "user", content: Userquery }
    ]
  });
  console.log("FULL RESPONSE:", JSON.stringify(response, null, 2));
  
  console.log("Response:", response.message.content);
  return response.message.content;
}
  else {
    throw new Error("Invalid MODEL_PROVIDER");
  }
}

module.exports = ModelHandler;