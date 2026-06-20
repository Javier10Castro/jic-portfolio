const PRICING = {
  openai: {
    name: 'OpenAI',
    models: {
      'gpt-4o': { input: 2.50, output: 10.00, per: 1_000_000, context: 128000, description: 'Most capable GPT-4 model' },
      'gpt-4o-mini': { input: 0.15, output: 0.60, per: 1_000_000, context: 128000, description: 'Fast, affordable GPT-4' },
      'gpt-4-turbo': { input: 10.00, output: 30.00, per: 1_000_000, context: 128000, description: 'GPT-4 Turbo' },
      'gpt-3.5-turbo': { input: 0.50, output: 1.50, per: 1_000_000, context: 16385, description: 'Fast GPT-3.5' },
    },
  },
  anthropic: {
    name: 'Anthropic',
    models: {
      'claude-3-opus': { input: 15.00, output: 75.00, per: 1_000_000, context: 200000, description: 'Most capable Claude' },
      'claude-3-sonnet': { input: 3.00, output: 15.00, per: 1_000_000, context: 200000, description: 'Balanced Claude' },
      'claude-3-haiku': { input: 0.25, output: 1.25, per: 1_000_000, context: 200000, description: 'Fast Claude' },
    },
  },
  gemini: {
    name: 'Google Gemini',
    models: {
      'gemini-1.5-pro': { input: 1.25, output: 5.00, per: 1_000_000, context: 1000000, description: 'Google Gemini Pro' },
      'gemini-1.5-flash': { input: 0.075, output: 0.30, per: 1_000_000, context: 1000000, description: 'Fast Gemini' },
    },
  },
  ollama: {
    name: 'Ollama (Local)',
    models: {
      'llama3-70b': { input: 0, output: 0, per: 1_000_000, context: 8192, description: 'Local Llama 3 70B' },
      'llama3-8b': { input: 0, output: 0, per: 1_000_000, context: 8192, description: 'Local Llama 3 8B' },
      'mistral': { input: 0, output: 0, per: 1_000_000, context: 8192, description: 'Local Mistral' },
    },
  },
};

class PricingModels {
  constructor(customModels = {}) {
    this._models = this._deepMerge(PRICING, customModels);
    this._updates = new Map();
  }

  getSupportedProviders() {
    return Object.keys(this._models);
  }

  getModels(provider) {
    if (!provider) {
      const all = {};
      for (const [p, config] of Object.entries(this._models)) {
        all[p] = config.models;
      }
      return all;
    }
    return this._models[provider]?.models || null;
  }

  getProviderInfo(provider) {
    return this._models[provider] ? { name: this._models[provider].name, provider } : null;
  }

  getPricing(provider, model) {
    const providerModels = this._models[provider]?.models;
    if (!providerModels) return null;
    return providerModels[model] || null;
  }

  calculateCost(provider, model, inputTokens, outputTokens) {
    const pricing = this.getPricing(provider, model);
    if (!pricing) return null;
    const inputCost = (inputTokens / pricing.per) * pricing.input;
    const outputCost = (outputTokens / pricing.per) * pricing.output;
    return { inputCost: Math.round(inputCost * 1000000) / 1000000, outputCost: Math.round(outputCost * 1000000) / 1000000, totalCost: Math.round((inputCost + outputCost) * 1000000) / 1000000, currency: 'USD', pricing, provider, model };
  }

  updatePricing(provider, model, pricing) {
    if (!this._models[provider]) this._models[provider] = { name: provider, models: {} };
    if (!this._models[provider].models[model]) this._models[provider].models[model] = {};
    Object.assign(this._models[provider].models[model], pricing);
    this._updates.set(`${provider}:${model}`, Date.now());
  }

  addCustomProvider(providerKey, config) {
    if (this._models[providerKey]) throw new Error(`Provider '${providerKey}' already exists`);
    if (!config.models || !config.name) throw new Error('Custom provider must have name and models');
    this._models[providerKey] = config;
  }

  getLatestUpdates() {
    return Array.from(this._updates.entries()).map(([k, t]) => ({ key: k, updatedAt: t }));
  }

  estimateMonthlyCost(usageRecords) {
    let total = 0;
    const breakdown = {};
    for (const record of usageRecords) {
      const cost = this.calculateCost(record.provider, record.model, record.inputTokens || 0, record.outputTokens || 0);
      if (cost) {
        total += cost.totalCost;
        const key = `${record.provider}:${record.model}`;
        breakdown[key] = (breakdown[key] || 0) + cost.totalCost;
      }
    }
    return { totalCost: Math.round(total * 100) / 100, breakdown };
  }

  _deepMerge(base, override) {
    const result = JSON.parse(JSON.stringify(base));
    for (const [key, val] of Object.entries(override)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = { ...result[key], ...val };
      } else {
        result[key] = val;
      }
    }
    return result;
  }
}

module.exports = { PricingModels, PRICING };
