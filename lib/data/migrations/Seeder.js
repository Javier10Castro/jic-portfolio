class Seeder {
  constructor() { this._seeds = {}; }
  register(name, seedFn) { this._seeds[name] = seedFn; return { success: true }; }
  run(name) {
    const fn = this._seeds[name];
    if (!fn) return { success: false, error: 'Seeder not found' };
    return { success: true, result: fn(), seeder: name };
  }
  runAll() {
    const results = [];
    Object.entries(this._seeds).forEach(([name, fn]) => results.push({ name, success: true, result: fn() }));
    return { success: true, results };
  }
  list() { return Object.keys(this._seeds); }
  clear() { this._seeds = {}; }
}
module.exports = { Seeder };
