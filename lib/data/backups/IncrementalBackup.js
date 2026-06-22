class IncrementalBackup {
  constructor() { this._baseSnapshots = {}; this._deltas = []; }
  createBase(name, data) { this._baseSnapshots[name] = { data, timestamp: Date.now() }; return { success: true, base: name }; }
  addDelta(baseName, changes) { this._deltas.push({ baseName, changes, timestamp: Date.now() }); return { success: true, delta: this._deltas.length - 1 }; }
  restore(baseName) {
    const base = this._baseSnapshots[baseName];
    if (!base) return { success: false, error: 'Base not found' };
    const deltas = this._deltas.filter(d => d.baseName === baseName);
    return { success: true, base: baseName, deltaCount: deltas.length, data: base.data };
  }
  listBases() { return Object.keys(this._baseSnapshots); }
  clear() { this._baseSnapshots = {}; this._deltas = []; }
}
module.exports = { IncrementalBackup };
