class RestoreManager {
  constructor() { this._restores = []; }

  restore(id, backupManager) {
    const backup = backupManager ? backupManager.get(id) : null;
    if (!backup) return { success: false, error: 'Backup not found' };
    const result = { id, datasource: backup.datasource, status: 'restored', restoredAt: Date.now() };
    this._restores.push(result);
    return { success: true, restore: result };
  }

  list() { return [...this._restores]; }
  count() { return this._restores.length; }
  clear() { this._restores = []; }
}
module.exports = { RestoreManager };
