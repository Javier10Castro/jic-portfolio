const BaseProvider = require('./baseProvider');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-1.5-pro';

class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'gemini';
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
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

    const contents = this._buildContents(prompt);
    const body = {
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    };

    const res = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);

    const json = await res.json();
    return {
      text: json.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model,
      provider: this.name,
      usage: { inputTokens: 0, outputTokens: 0 },
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

    const contents = this._buildContents(prompt);
    const body = {
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    };

    const res = await fetch(`${this.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Gemini stream error: ${res.status}`);

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
      const res = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
      return { name: this.name, status: res.ok ? 'ok' : 'unavailable', timestamp: new Date().toISOString() };
    } catch {
      return { name: this.name, status: 'unavailable', timestamp: new Date().toISOString() };
    }
  }

  models() {
    return [
      { id: 'gemini-1.5-pro', provider: 'gemini', costPer1kInput: 0.0035, costPer1kOutput: 0.0105, contextWindow: 1048576, quality: 'high', speed: 'fast' },
      { id: 'gemini-1.5-flash', provider: 'gemini', costPer1kInput: 0.00035, costPer1kOutput: 0.00105, contextWindow: 1048576, quality: 'medium', speed: 'very-fast' },
      { id: 'gemini-2.0-flash', provider: 'gemini', costPer1kInput: 0.0001, costPer1kOutput: 0.0004, contextWindow: 1048576, quality: 'high', speed: 'very-fast' },
    ];
  }

  _buildContents(prompt) {
    if (typeof prompt === 'string') return [{ parts: [{ text: prompt }] }];
    if (Array.isArray(prompt)) return prompt.map(m => ({ parts: [{ text: m.content || m.text || '' }], role: m.role === 'assistant' ? 'model' : 'user' }));
    return [{ parts: [{ text: JSON.stringify(prompt) }] }];
  }

  _simulate(prompt, options) {
    const text = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
    return {
      text: `[gemini-simulated] Response to: ${text.slice(0, 100)}...`,
      model: options.model || DEFAULT_MODEL,
      provider: this.name,
      usage: { inputTokens: Math.ceil(text.length / 4), outputTokens: 40 },
      latency: 3,
      simulated: true,
    };
  }
}

module.exports = GeminiProvider;
