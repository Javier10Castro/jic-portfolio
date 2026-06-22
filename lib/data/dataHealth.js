class DataHealth {
  constructor() { this._health = {}; }

  record(name, status, latency) {
    this._health[name] = { status, latency, lastChecked: Date.now(), uptime: status === 'healthy' ? 100 : Math.floor(Math.random() * 80) };
  }

  get(name) { return this._health[name] || null; }
  getAll() { return { ...this._health }; }
  count() { return Object.keys(this._health).length; }
  clear() { this._health = {}; }
}
module.exports = { DataHealth };
