const { Ollama } = require('ollama')

async function LocalModel() {
  const ollama = new Ollama()

  const response = await ollama.chat({
    model: 'llama3.2',
    messages: [
      { role: 'user', content: 'Why is the sky blue?' }
    ],
  })

  console.log(response.message.content)
}

module.exports = LocalModel;