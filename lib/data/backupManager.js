class BackupManager {
  constructor() { this._backups = {}; this._idCounter = 0; }

  create(datasource, options = {}) {
    const id = `bkp-${++this._idCounter}-${Date.now()}`;
    const backup = { id, datasource, type: options.type || 'full', status: 'completed', createdAt: Date.now(), size: Math.floor(Math.random() * 1000) + 100 };
    if (!this._backups[datasource]) this._backups[datasource] = [];
    this._backups[datasource].push(backup);
    return { success: true, backup };
  }

  get(id) {
    for (const ds of Object.keys(this._backups)) {
      const found = this._backups[ds].find(b => b.id === id);
      if (found) return found;
    }
    return null;
  }

  list(datasource) { return this._backups[datasource] ? [...this._backups[datasource]] : []; }
  listAll() { return Object.values(this._backups).flat(); }
  count() { return this.listAll().length; }
  clear() { this._backups = {}; this._idCounter = 0; }
}
module.exports = { BackupManager };
