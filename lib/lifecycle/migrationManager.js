class MigrationManager {
  constructor() {
    this._migrations = new Map();
    this._counter = 0;
  }

  createMigration(projectId, fromVersion, toVersion, type) {
    if (!projectId || !fromVersion || !toVersion || !type) {
      throw new Error('projectId, fromVersion, toVersion, and type are required');
    }
    const id = `mig_${++this._counter}`;
    const migration = {
      id,
      projectId,
      fromVersion,
      toVersion,
      type,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this._migrations.set(id, migration);
    return migration;
  }

  executeMigration(id) {
    if (!this._migrations.has(id)) {
      throw new Error(`Migration "${id}" not found`);
    }
    const migration = this._migrations.get(id);
    if (migration.status !== 'pending') {
      throw new Error(`Migration "${id}" is already ${migration.status}`);
    }
    migration.status = 'completed';
    return migration;
  }

  rollbackMigration(id) {
    if (!this._migrations.has(id)) {
      throw new Error(`Migration "${id}" not found`);
    }
    const migration = this._migrations.get(id);
    if (migration.status !== 'completed') {
      throw new Error(`Cannot rollback migration "${id}" with status "${migration.status}"`);
    }
    migration.status = 'rolled_back';
    return migration;
  }

  getMigration(id) {
    return this._migrations.get(id) || null;
  }

  listMigrations(projectId) {
    return Array.from(this._migrations.values()).filter(m => m.projectId === projectId);
  }

  validateMigration(id) {
    if (!this._migrations.has(id)) {
      throw new Error(`Migration "${id}" not found`);
    }
    const migration = this._migrations.get(id);
    const issues = [];
    if (migration.fromVersion === migration.toVersion) {
      issues.push('fromVersion and toVersion are identical');
    }
    const fromParts = migration.fromVersion.split('.').map(Number);
    const toParts = migration.toVersion.split('.').map(Number);
    if (fromParts.length !== 3 || toParts.length !== 3 || fromParts.some(isNaN) || toParts.some(isNaN)) {
      issues.push('Invalid version format in fromVersion or toVersion');
    }
    return { valid: issues.length === 0, issues };
  }

  clear() {
    this._migrations.clear();
  }
}

module.exports = { MigrationManager };
