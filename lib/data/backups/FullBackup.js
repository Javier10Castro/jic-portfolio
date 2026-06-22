class FullBackup {
  constructor() { this._backups = []; }
  create(name, data) {
    const backup = { id: `full-${Date.now()}`, name, data, type: 'full', createdAt: Date.now(), size: JSON.stringify(data).length, checksum: 'abc123' };
    this._backups.push(backup);
    return { success: true, backup };
  }
  get(id) { return this._backups.find(b => b.id === id) || null; }
  list() { return this._backups.map(b => ({ id: b.id, name: b.name, type: b.type, createdAt: b.createdAt, size: b.size })); }
  delete(id) { const idx = this._backups.findIndex(b => b.id === id); if (idx >= 0) { this._backups.splice(idx, 1); return { success: true }; } return { success: false, error: 'Not found' }; }
  count() { return this._backups.length; }
  clear() { this._backups = []; }
}
module.exports = { FullBackup };
