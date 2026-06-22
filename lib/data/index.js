const { DataPlatform, getDefaultPlatform, createPlatform, EVENTS } = require('./dataPlatform');
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
const { DataEvents } = require('./dataEvents');
const { DataStorage } = require('./dataStorage');
const { DataEncryption } = require('./dataEncryption');
const { DataCompression } = require('./dataCompression');
const { DataRetention } = require('./dataRetention');

module.exports = {
  DataPlatform, getDefaultPlatform, createPlatform, EVENTS,
  DataManager, ConnectionManager, AdapterRegistry,
  MigrationManager, SchemaManager, BackupManager, RestoreManager,
  ReplicationManager, DataHealth, DataMetrics, DataEvents,
  DataStorage, DataEncryption, DataCompression, DataRetention
};
