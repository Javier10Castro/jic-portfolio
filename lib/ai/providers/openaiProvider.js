const BaseProvider = require('./baseProvider');

const API_BASE = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4';

class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'openai';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.baseUrl = config.baseUrl || API_BASE;
  }

  async generate(prompt, options = {}) {
    const model = options.model || DEFAULT_MODEL;
    const maxTokens = options.maxTokens || 2048;
    const temperature = options.temperature != null ? options.temperature : 0.7;
    const start = Date.now();

    if (!this.apiKey) {
      return this._simulate(prompt, options);
    }

    const body = {
      model,
      messages: Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);

    const json = await res.json();
    return {
      text: json.choices?.[0]?.message?.content || '',
      model: json.model || model,
      provider: this.name,
      usage: { inputTokens: json.usage?.prompt_tokens || 0, outputTokens: json.usage?.completion_tokens || 0 },
      latency: Date.now() - start,
    };
  }

  async stream(prompt, options = {}) {
    const model = options.model || DEFAULT_MODEL;
    const maxTokens = options.maxTokens || 2048;
    const temperature = options.temperature != null ? options.temperature : 0.7;
    const start = Date.now();
    let fullText = '';

    if (!this.apiKey) {
      const result = this._simulate(prompt, options);
      return { ...result, streamed: true, chunks: [result.text] };
    }

    const body = {
      model,
      messages: Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
      stream: true,
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`OpenAI stream error: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      chunks.push(text);
      fullText += text;
    }

    return {
      text: fullText,
      model,
      provider: this.name,
      usage: { inputTokens: 0, outputTokens: 0 },
      latency: Date.now() - start,
      streamed: true,
      chunks,
    };
  }

  async health() {
    if (!this.apiKey) return { name: this.name, status: 'simulated', timestamp: new Date().toISOString() };
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return { name: this.name, status: res.ok ? 'ok' : 'unavailable', timestamp: new Date().toISOString() };
    } catch {
      return { name: this.name, status: 'unavailable', timestamp: new Date().toISOString() };
    }
  }

  models() {
    return [
      { id: 'gpt-4', provider: 'openai', costPer1kInput: 0.03, costPer1kOutput: 0.06, contextWindow: 8192, quality: 'high', speed: 'medium' },
      { id: 'gpt-4-turbo', provider: 'openai', costPer1kInput: 0.01, costPer1kOutput: 0.03, contextWindow: 128000, quality: 'high', speed: 'medium' },
      { id: 'gpt-3.5-turbo', provider: 'openai', costPer1kInput: 0.001, costPer1kOutput: 0.002, contextWindow: 16384, quality: 'medium', speed: 'fast' },
    ];
  }

  _simulate(prompt, options) {
    const text = Array.isArray(prompt) ? prompt.map(m => m.content).join('\n') : prompt;
    return {
      text: `[openai-simulated] Response to: ${text.slice(0, 100)}...`,
      model: options.model || DEFAULT_MODEL,
      provider: this.name,
      usage: { inputTokens: Math.ceil(text.length / 4), outputTokens: 50 },
      latency: 5,
      simulated: true,
    };
  }
}

module.exports = OpenAIProvider;
