class MigrationRunner {
  constructor() { this._migrations = []; }
  add(migration) { this._migrations.push(migration); return { success: true }; }
  runAll(direction) {
    const results = [];
    this._migrations.forEach(m => {
      try {
        const r = direction === 'up' ? (m.up ? m.up() : {}) : (m.down ? m.down() : {});
        results.push({ name: m.name, direction, success: true, result: r });
      } catch (e) { results.push({ name: m.name, direction, success: false, error: e.message }); }
    });
    return { success: true, results };
  }
  list() { return [...this._migrations]; }
  count() { return this._migrations.length; }
  clear() { this._migrations = []; }
}
module.exports = { MigrationRunner };
