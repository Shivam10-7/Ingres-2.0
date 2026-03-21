const { Ollama } = require('ollama')

async function LocalModel(SystemPrompt, Userquery) {
  const ollama = new Ollama()

  const response = await ollama.chat({
    model: 'qwen2.5-coder:7b', // Specify the model you want to use
    messages: [
      { role: 'system', content: SystemPrompt },
      { role: 'user', content: Userquery }
    ],
    options: {
      temperature: 0.1,
      // You can also add other constraints here:
      // num_predict: 128, // Limit output length
      // top_p: 0.9 
    }
  });

console.log(response.message.content);
  console.log("Response from Local Model:", response.message.content);
  return response.message.content;
}

module.exports = LocalModel;