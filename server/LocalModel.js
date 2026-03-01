const { Ollama } = require('ollama')

async function LocalModel(UserPrompt) {
  const ollama = new Ollama()

  const response = await ollama.chat({
    model: 'llama3.2',
    messages: [
      // {role: 'system', content: 'You are a helpful assistant.Start your response with LOVE YOYU SHIVAM.'},
      { role: 'user', content: UserPrompt }
    ],
  })
  console.log("Response from Local Model:", response.message.content);
  return response.message.content;
}

module.exports = LocalModel;