function createNgrams(text, n) {
  // 1. Tokenize: Normalize, lower case, and split by whitespace
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
  const ngrams = [];

  // 2. Generate n-grams
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

const query = "What is the water level of Bahitinda District";
console.log(createNgrams(query, 2)); // ["javascript text", "text processing"]
console.log(createNgrams(query, 3)); // ["javascript text processing"]
