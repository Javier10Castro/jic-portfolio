const { DataManager } = require('./dataManager');
const { ConnectionManager } = require('./connectionManager');
const { AdapterRegistry } = require('./adapterRegistry');
const { MigrationManager } = require('./migrationManager');
const { SchemaManager } = require('./schemaManager');
const { BackupManager } = require('./backupManager');
const { RestoreManager } = require('./restoreManager');
const { ReplicationManager } = require('./replicationManager');
const { DataHealth } = require('./dataHealth');
const { DataMetrics } = require('./dataMetrics');
const { DataEvents, EVENTS } = require('./dataEvents');
const { DataStorage } = require('./dataStorage');
const { DataEncryption } = require('./dataEncryption');
const { DataCompression } = require('./dataCompression');
const { DataRetention } = require('./dataRetention');

class DataPlatform {
  constructor(options = {}) {
    this.manager = options.manager || new DataManager();
    this.connections = options.connections || new ConnectionManager();
    this.adapters = options.adapters || new AdapterRegistry();
    this.migrations = options.migrations || new MigrationManager();
    this.schemas = options.schemas || new SchemaManager();
    this.backups = options.backups || new BackupManager();
    this.restores = options.restores || new RestoreManager();
    this.replication = options.replication || new ReplicationManager();
    this.health = options.health || new DataHealth();
    this.metrics = options.metrics || new DataMetrics();
    this.events = options.events || new DataEvents();
    this.storage = options.storage || new DataStorage();
    this.encryption = options.encryption || new DataEncryption();
    this.compression = options.compression || new DataCompression();
    this.retention = options.retention || new DataRetention();
  }

  connect(name, type, config) { return this.connections.connect(name, type, config, this.adapters); }
  disconnect(name) { return this.connections.disconnect(name); }
  getConnection(name) { return this.connections.get(name); }

  registerAdapter(type, adapter) { return this.adapters.register(type, adapter); }
  getAdapter(type) { return this.adapters.get(type); }
  listAdapters() { return this.adapters.list(); }

  executeQuery(datasource, query, params) {
    const conn = this.connections.get(datasource);
    if (!conn) return { success: false, error: 'Not connected' };
    const adapter = this.adapters.get(conn.type);
    if (!adapter) return { success: false, error: 'No adapter' };
    this.metrics.recordQuery(datasource, Date.now());
    return adapter.query(conn.config, query, params);
  }

  runMigration(name, direction) { return this.migrations.run(name, direction); }
  listMigrations() { return this.migrations.list(); }
  generateMigration(name) { return this.migrations.generate(name); }

  createBackup(datasource, options) { return this.backups.create(datasource, options); }
  listBackups(datasource) { return this.backups.list(datasource); }
  restoreBackup(id) { return this.restores.restore(id, this.backups); }

  setupReplication(name, config) { return this.replication.setup(name, config); }
  getReplicationStatus(name) { return this.replication.getStatus(name); }

  getHealth(datasource) { return this.health.get(datasource); }
  getAllHealth() { return this.health.getAll(); }

  getMetrics(datasource) { return this.metrics.get(datasource); }
  getAllMetrics() { return this.metrics.getAll(); }

  encrypt(data, key) { return this.encryption.encrypt(data, key); }
  decrypt(data, key) { return this.encryption.decrypt(data, key); }

  compress(data) { return this.compression.compress(data); }
  decompress(data) { return this.compression.decompress(data); }

  getRetentionPolicy(datasource) { return this.retention.getPolicy(datasource); }
  setRetentionPolicy(datasource, policy) { return this.retention.setPolicy(datasource, policy); }

  getStatus() {
    return {
      connections: this.connections.count(),
      adapters: this.adapters.count(),
      migrations: this.migrations.count(),
      backups: this.backups.count(),
      replications: this.replication.count(),
      health: this.health.count()
    };
  }

  getEvents(filter) { return this.events.history(filter); }
  trackEvent(type, data) { return this.events.emit(type, data); }

  storeProvider(name, provider) {
    if (!this._storageProviders) this._storageProviders = {};
    this._storageProviders[name] = provider;
  }
  getStoreProvider(name) { return this._storageProviders ? this._storageProviders[name] : null; }

  beginTransaction(name) {
    if (!this._txManager) { const { TransactionManager } = require('./transactionManager'); this._txManager = new TransactionManager(); }
    return this._txManager.begin(name);
  }
  commitTransaction(txId) { return this._txManager ? this._txManager.commit(txId) : null; }
  rollbackTransaction(txId) { return this._txManager ? this._txManager.rollback(txId) : null; }

  createRepository(store, entityName) {
    const { Repository } = require('./repository');
    return new Repository(store || this.storage, entityName);
  }

  getIntegration() {
    if (!this._integration) { const { DataIntegration } = require('./dataIntegration'); this._integration = new DataIntegration(this); }
    return this._integration;
  }

  clear() {
    this.connections.clear(); this.adapters.clear(); this.migrations.clear();
    this.backups.clear(); this.restores.clear(); this.replication.clear();
    this.health.clear(); this.metrics.clear(); this.events.clear();
    this.storage.clear(); this.retention.clear();
    this._storageProviders = {};
    if (this._txManager) this._txManager.clear();
  }
}

let _default = null;
function getDefaultPlatform(options = {}) { if (!_default) _default = new DataPlatform(options); return _default; }
function createPlatform(options = {}) { return new DataPlatform(options); }

module.exports = { DataPlatform, getDefaultPlatform, createPlatform, EVENTS };
