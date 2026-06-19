const OpenAIProvider = require('./openaiProvider');
const AnthropicProvider = require('./anthropicProvider');
const GeminiProvider = require('./geminiProvider');
const OllamaProvider = require('./ollamaProvider');

const PROVIDERS = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  gemini: new GeminiProvider(),
  ollama: new OllamaProvider(),
};

function getProvider(name) {
  return PROVIDERS[name] || null;
}

function listProviders() {
  return Object.keys(PROVIDERS).map(name => ({
    name,
    healthy: PROVIDERS[name]._healthy,
    models: PROVIDERS[name].models().map(m => m.id),
  }));
}

async function healthCheck() {
  const results = {};
  for (const [name, provider] of Object.entries(PROVIDERS)) {
    results[name] = await provider.health();
  }
  return results;
}

module.exports = { PROVIDERS, getProvider, listProviders, healthCheck };
