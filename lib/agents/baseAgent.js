const AgentMemory = require('./memory/agentMemory');

class BaseAgent {
  constructor(id, name, options = {}) {
    this.id = id;
    this.name = name || id;
    this.memory = new AgentMemory(id);
    this.metrics = { executions: 0, successes: 0, failures: 0, totalTime: 0, retries: 0 };
    this.options = options;
    this._initialized = false;
  }

  async initialize() {
    this._initialized = true;
    return { success: true, agent: this.id };
  }

  async execute(task, context) {
    throw new Error(`execute() not implemented by ${this.id} agent`);
  }

  async validate(output) {
    return { valid: true, issues: [] };
  }

  summarize(output) {
    return { agent: this.id, outputSummary: typeof output === 'object' ? Object.keys(output).join(', ') : String(output).slice(0, 100) };
  }

  async health() {
    return { agent: this.id, status: this._initialized ? 'ok' : 'uninitialized', uptime: process.uptime() };
  }

  metricsReport() {
    return { ...this.metrics, agent: this.id, name: this.name };
  }

  log(event, data) {
    this.memory.remember(event, data);
  }

  report(task, output) {
    const duration = output?.executionTime || 0;
    return {
      agent: this.id,
      task: task?.type || 'unknown',
      output,
      metrics: { ...this.metrics, duration },
      timestamp: new Date().toISOString(),
    };
  }

  async _simulate(prompt, context = 'chat') {
    try {
      const ai = require('../ai');
      const result = await ai.generate(prompt, { context, provider: 'openai', model: 'gpt-3.5-turbo' });
      return result.text;
    } catch {
      return `[simulated-${this.id}] Response to: ${String(prompt).slice(0, 80)}...`;
    }
  }

  _track(success, duration) {
    this.metrics.executions++;
    if (success) this.metrics.successes++; else this.metrics.failures++;
    this.metrics.totalTime += duration;
  }
}

module.exports = BaseAgent;
