function parseLLMJsonString(input) {
  try {
    if (!input) return null;

    // Remove ```json ... ``` or ``` ... ```
    const cleaned = input
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return parsed;
  } catch (error) {
    console.error("Invalid JSON from LLM:", error.message);
    return null;
  }
}

module.exports = parseLLMJsonString;