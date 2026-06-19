class BaseProvider {
  constructor(config = {}) {
    this.name = 'base';
    this.config = config;
    this._healthy = true;
  }

  async generate(prompt, options = {}) {
    throw new Error(`generate() not implemented by ${this.name} provider`);
  }

  async stream(prompt, options = {}) {
    throw new Error(`stream() not implemented by ${this.name} provider`);
  }

  async health() {
    return { name: this.name, status: this._healthy ? 'ok' : 'unavailable', timestamp: new Date().toISOString() };
  }

  models() {
    return [];
  }

  setHealth(healthy) {
    this._healthy = healthy;
  }
}

module.exports = BaseProvider;
