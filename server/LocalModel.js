const { Ollama } = require('ollama')

async function LocalModel(SystePrompt, Userquery) {
  const ollama = new Ollama()

  const response = await ollama.chat({
    model: 'llama3.2',
    temperature: 0.3,
    messages: [
      {role: 'system', content: SystePrompt},
      { role: 'user', content: Userquery }
    ],
  })
  console.log("Response from Local Model:", response.message.content);
  return response.message.content;
}

module.exports = LocalModel;