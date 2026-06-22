class MigrationProvider {
  constructor(config) {
    this.name = config.name;
    this.type = config.type || 'schema';
  }
  migrate(data, fromVersion, toVersion) { return { success: true, fromVersion, toVersion, migratedAt: Date.now() }; }
  rollback(data, version) { return { success: true, version, rolledBackAt: Date.now() }; }
  validate(data, fromVersion, toVersion) { return { valid: true, issues: [] }; }
}
module.exports = { MigrationProvider };
