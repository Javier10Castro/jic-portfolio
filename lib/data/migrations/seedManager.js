class SeedManager {
  constructor() {
    this._seeds = {};
    this._executed = {};
  }

  registerSeed(name, seedFn) {
    if (!name || typeof seedFn !== 'function') return null;
    this._seeds[name] = seedFn;
    return { name, registered: true };
  }

  runSeed(name) {
    if (!this._seeds[name]) return null;
    this._seeds[name]();
    this._executed[name] = { name, executedAt: Date.now(), success: true };
    return { ...this._executed[name] };
  }

  runAll() {
    const results = [];
    Object.keys(this._seeds).forEach(name => results.push(this.runSeed(name)));
    return results;
  }

  listSeeds() {
    return Object.keys(this._seeds);
  }

  getSeedStatus(name) {
    return this._executed[name] ? { ...this._executed[name] } : { name, executed: false };
  }

  clear() {
    this._seeds = {};
    this._executed = {};
  }
}

module.exports = { SeedManager };
