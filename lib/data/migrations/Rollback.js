class Rollback {
  constructor() { this._history = []; }
  add(operation, undoFn) { this._history.push({ operation, undoFn, timestamp: Date.now() }); }
  rollback(count) {
    const results = [];
    const target = Math.min(count || 1, this._history.length);
    for (let i = 0; i < target; i++) {
      const entry = this._history.pop();
      try { results.push({ operation: entry.operation, success: true, result: entry.undoFn() }); } catch (e) { results.push({ operation: entry.operation, success: false, error: e.message }); }
    }
    return { success: true, results };
  }
  list() { return [...this._history]; }
  count() { return this._history.length; }
  clear() { this._history = []; }
}
module.exports = { Rollback };
