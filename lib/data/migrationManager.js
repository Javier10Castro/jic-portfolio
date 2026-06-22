class MigrationManager {
  constructor() { this._migrations = {}; this._history = []; }

  register(name, migration) {
    if (this._migrations[name]) return { success: false, error: 'Already registered' };
    this._migrations[name] = { ...migration, name, registeredAt: Date.now() };
    return { success: true };
  }

  run(name, direction) {
    const migration = this._migrations[name];
    if (!migration) return { success: false, error: 'Migration not found' };
    const result = direction === 'up' ? (migration.up ? migration.up() : {}) : (migration.down ? migration.down() : {});
    this._history.push({ name, direction, timestamp: Date.now(), success: true });
    return { success: true, result };
  }

  generate(name) {
    const migration = { name, up: () => ({ applied: true }), down: () => ({ reverted: true }), generatedAt: Date.now() };
    this._migrations[name] = migration;
    return { success: true, migration };
  }

  list() { return Object.values(this._migrations); }
  getHistory() { return [...this._history]; }
  count() { return Object.keys(this._migrations).length; }
  clear() { this._migrations = {}; this._history = []; }
}
module.exports = { MigrationManager };
