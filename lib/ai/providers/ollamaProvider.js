const BaseProvider = require('./baseProvider');

const DEFAULT_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3';

class OllamaProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'ollama';
    this.baseUrl = config.ollamaUrl || process.env.OLLAMA_URL || DEFAULT_URL;
  }

  async generate(prompt, options = {}) {
    const model = options.model || DEFAULT_MODEL;
    const start = Date.now();

    const body = {
      model,
      prompt: typeof prompt === 'string' ? prompt : (Array.isArray(prompt) ? prompt.map(m => m.content).join('\n') : JSON.stringify(prompt)),
      stream: false,
      options: { temperature: options.temperature ?? 0.7, num_predict: options.maxTokens || 2048 },
    };

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);

      const json = await res.json();
      return {
        text: json.response || '',
        model: model,
        provider: this.name,
        usage: { inputTokens: json.prompt_eval_count || 0, outputTokens: json.eval_count || 0 },
        latency: Date.now() - start,
      };
    } catch (err) {
      return this._simulate(prompt, options);
    }
  }

  async stream(prompt, options = {}) {
    const model = options.model || DEFAULT_MODEL;
    const start = Date.now();
    let fullText = '';

    const body = {
      model,
      prompt: typeof prompt === 'string' ? prompt : (Array.isArray(prompt) ? prompt.map(m => m.content).join('\n') : JSON.stringify(prompt)),
      stream: true,
      options: { temperature: options.temperature ?? 0.7, num_predict: options.maxTokens || 2048 },
    };

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Ollama stream error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) { chunks.push(json.response); fullText += json.response; }
          } catch { chunks.push(line); fullText += line; }
        }
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
    } catch (err) {
      const result = this._simulate(prompt, options);
      return { ...result, streamed: true, chunks: [result.text] };
    }
  }

  async health() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      return { name: this.name, status: res.ok ? 'ok' : 'unavailable', timestamp: new Date().toISOString(), local: true };
    } catch {
      return { name: this.name, status: 'unavailable', timestamp: new Date().toISOString(), local: true };
    }
  }

  models() {
    return [
      { id: 'llama3', provider: 'ollama', costPer1kInput: 0, costPer1kOutput: 0, contextWindow: 8192, quality: 'medium', speed: 'medium', local: true },
      { id: 'mistral', provider: 'ollama', costPer1kInput: 0, costPer1kOutput: 0, contextWindow: 8192, quality: 'medium', speed: 'medium', local: true },
      { id: 'codellama', provider: 'ollama', costPer1kInput: 0, costPer1kOutput: 0, contextWindow: 16384, quality: 'medium', speed: 'medium', local: true, code: true },
    ];
  }

  _simulate(prompt, options) {
    const text = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
    return {
      text: `[ollama-simulated] Response to: ${text.slice(0, 100)}...`,
      model: options.model || DEFAULT_MODEL,
      provider: this.name,
      usage: { inputTokens: Math.ceil(text.length / 4), outputTokens: 50 },
      latency: 2,
      simulated: true,
      local: true,
    };
  }
}

module.exports = OllamaProvider;
