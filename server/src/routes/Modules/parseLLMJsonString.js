function parseLLMJsonString(input) {
  try {
    if (!input) return null;

    // Remove code fences and surrounding markdown.
    let cleaned = input.replace(/```json/gi, "").replace(/```/g, "").trim();

    // If the model returned extraneous text before JSON, strip to first object/array.
    const firstBrace = cleaned.search(/[\[{]/);
    if (firstBrace > 0) {
      cleaned = cleaned.slice(firstBrace);
    }

    // Extract the first JSON object or array if extra text follows.
    const jsonMatch = cleaned.match(/^([\s\S]*?\{[\s\S]*\}|[\s\S]*?\[[\s\S]*\])/);
    if (jsonMatch) {
      cleaned = jsonMatch[1];
    }

    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (error) {
    console.error("Invalid JSON from LLM:", error.message);
    return null;
  }
}

module.exports = parseLLMJsonString;