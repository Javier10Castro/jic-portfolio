class MigrationHistory {
  constructor() { this._entries = []; }
  record(name, direction, status) { this._entries.push({ name, direction, status, timestamp: Date.now() }); return { success: true }; }
  list() { return [...this._entries]; }
  getLast() { return this._entries.length ? this._entries[this._entries.length - 1] : null; }
  count() { return this._entries.length; }
  clear() { this._entries = []; }
}
module.exports = { MigrationHistory };
