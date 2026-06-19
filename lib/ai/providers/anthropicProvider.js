const BaseProvider = require('./baseProvider');

const API_BASE = 'https://api.anthropic.com/v1';
const DEFAULT_MODEL = 'claude-3-opus-20240229';

class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'anthropic';
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
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
      max_tokens: maxTokens,
      temperature,
      messages: Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }],
    };

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${res.statusText}`);

    const json = await res.json();
    return {
      text: json.content?.[0]?.text || '',
      model: json.model || model,
      provider: this.name,
      usage: { inputTokens: json.usage?.input_tokens || 0, outputTokens: json.usage?.output_tokens || 0 },
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
      max_tokens: maxTokens,
      temperature,
      messages: Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }],
      stream: true,
    };

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Anthropic stream error: ${res.status}`);

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
        headers: { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' },
      });
      return { name: this.name, status: res.ok ? 'ok' : 'unavailable', timestamp: new Date().toISOString() };
    } catch {
      return { name: this.name, status: 'unavailable', timestamp: new Date().toISOString() };
    }
  }

  models() {
    return [
      { id: 'claude-3-opus-20240229', provider: 'anthropic', costPer1kInput: 0.015, costPer1kOutput: 0.075, contextWindow: 200000, quality: 'very-high', speed: 'slow' },
      { id: 'claude-3-sonnet-20240229', provider: 'anthropic', costPer1kInput: 0.003, costPer1kOutput: 0.015, contextWindow: 200000, quality: 'high', speed: 'medium' },
      { id: 'claude-3-haiku-20240307', provider: 'anthropic', costPer1kInput: 0.00025, costPer1kOutput: 0.00125, contextWindow: 200000, quality: 'medium', speed: 'fast' },
    ];
  }

  _simulate(prompt, options) {
    const text = Array.isArray(prompt) ? prompt.map(m => m.content).join('\n') : prompt;
    return {
      text: `[anthropic-simulated] Response to: ${text.slice(0, 100)}...`,
      model: options.model || DEFAULT_MODEL,
      provider: this.name,
      usage: { inputTokens: Math.ceil(text.length / 4), outputTokens: 60 },
      latency: 8,
      simulated: true,
    };
  }
}

module.exports = AnthropicProvider;
