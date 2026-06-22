const { IntegrationRegistry } = require('./integrationRegistry');
const { IntegrationLoader } = require('./integrationLoader');
const { IntegrationInstaller } = require('./integrationInstaller');
const { IntegrationValidator } = require('./integrationValidator');
const { IntegrationEvents, EVENTS } = require('./integrationEvents');
const { IntegrationStorage } = require('./integrationStorage');
const { IntegrationPermissions, PERMISSIONS } = require('./integrationPermissions');
const { IntegrationHealth } = require('./integrationHealth');
const { IntegrationScheduler } = require('./integrationScheduler');
const { IntegrationSync } = require('./integrationSync');
const { IntegrationWebhook } = require('./integrationWebhook');
const { IntegrationSecrets } = require('./integrationSecrets');
const { IntegrationAudit } = require('./integrationAudit');
const { getProvider, getProvidersList, registerProviderClass } = require('./providers');

class IntegrationManager {
  constructor(options = {}) {
    this.registry = options.registry || new IntegrationRegistry();
    this.loader = options.loader || new IntegrationLoader();
    this.installer = options.installer || new IntegrationInstaller({ registry: this.registry, loader: this.loader });
    this.validator = options.validator || new IntegrationValidator();
    this.events = options.events || new IntegrationEvents();
    this.storage = options.storage || new IntegrationStorage();
    this.permissions = options.permissions || new IntegrationPermissions();
    this.health = options.health || new IntegrationHealth();
    this.scheduler = options.scheduler || new IntegrationScheduler();
    this.sync = options.sync || new IntegrationSync({ storage: this.storage, events: this.events, health: this.health });
    this.secrets = options.secrets || new IntegrationSecrets({ storage: this.storage });
    this.audit = options.audit || new IntegrationAudit({ storage: this.storage });
    this.webhook = options.webhook || new IntegrationWebhook({ events: this.events, storage: this.storage, secrets: this.secrets });
  }

  connect(provider, config) {
    const existing = this.registry.getIntegration(provider);
    if (existing) return { success: false, error: 'Already connected' };
    const validation = this.validator.validate(provider, config);
    if (!validation.valid) return { success: false, error: validation.errors.join(', ') };
    const ProviderClass = getProvider(provider);
    if (!ProviderClass) return { success: false, error: `Unknown provider: ${provider}` };
    const instance = new ProviderClass(config);
    const connResult = instance.connect();
    if (!connResult.success) return connResult;
    const integration = { provider, config, instance, connectedAt: Date.now(), status: 'connected' };
    this.registry.register(integration);
    this.loader.load(integration);
    if (config.auth && config.auth.type) {
      const authValidation = this.validator.validateAuth(config.auth);
      if (authValidation.valid) {
        this.storage.setNamespaced(provider, 'auth_type', config.auth.type);
      }
    }
    this.health.recordSuccess(provider, connResult.latency || 0);
    this.audit.log(provider, 'connected', { timestamp: Date.now() });
    this.events.emit(EVENTS.CONNECTED, { provider, connectedAt: integration.connectedAt });
    return { success: true, integration, instance };
  }

  disconnect(provider) {
    const integration = this.registry.getIntegration(provider);
    if (!integration) return { success: false, error: 'Not connected' };
    if (integration.instance && integration.instance.disconnect) {
      integration.instance.disconnect();
    }
    this.loader.unload(provider);
    this.registry.unregister(provider);
    this.scheduler.cancel(provider);
    this.audit.log(provider, 'disconnected', { timestamp: Date.now() });
    this.events.emit(EVENTS.DISCONNECTED, { provider, disconnectedAt: Date.now() });
    return { success: true };
  }

  install(providerType, config) { return this.installer.install(providerType, config); }
  uninstall(provider) { return this.installer.uninstall(provider); }

  listIntegrations(filter) { return this.registry.listIntegrations(filter); }
  getIntegration(provider) { return this.registry.getIntegration(provider); }
  getProviders() { return getProvidersList(); }
  registerProviderClass(id, cls) { registerProviderClass(id, cls); }

  getHealth(provider) { return this.health.getHealth(provider); }
  getAllHealth() { return this.health.getAllHealth(); }

  startSync(provider, type) { return this.sync.startSync(provider, type); }
  completeSync(syncId, data) { return this.sync.completeSync(syncId, data); }
  failSync(syncId, error) { return this.sync.failSync(syncId, error); }
  getSyncs(provider, limit) { return this.sync.getSyncs(provider, limit); }
  retrySync(syncId) { return this.sync.retrySync(syncId); }

  registerIncomingWebhook(provider, config) { return this.webhook.registerIncoming(provider, config); }
  registerOutgoingWebhook(provider, config) { return this.webhook.registerOutgoing(provider, config); }
  processIncomingWebhook(provider, payload, signature) { return this.webhook.processIncoming(provider, payload, signature); }
  getWebhooks(provider) { return this.webhook.getWebhooks(provider); }

  scheduleSync(provider, interval) {
    this.scheduler.schedule(provider, interval, () => {
      const result = this.startSync(provider, 'incremental');
      if (result.success) {
        this.completeSync(result.syncId, { completedAt: Date.now() });
      }
    });
    return { success: true };
  }

  cancelSchedule(provider) { return this.scheduler.cancel(provider); }
  tickScheduler() { return this.scheduler.tick(); }

  grantPermission(provider, permission) { return this.permissions.grant(provider, permission); }
  checkPermission(provider, permission) { return this.permissions.hasPermission(provider, permission); }

  getSecrets(provider) { return this.secrets.list(provider); }
  storeSecret(provider, key, value) { return this.secrets.store(provider, key, value); }
  getSecret(provider, key) { return this.secrets.get(provider, key); }
  rotateSecret(provider, key) { return this.secrets.rotate(provider, key); }

  getAuditLog(filter) { return this.audit.query(filter); }
  getAuditStats() { return this.audit.getStats(); }

  getStatus() {
    const integrations = this.registry.listIntegrations();
    const healthData = this.health.getAllHealth();
    return {
      connected: integrations.filter(i => i.status === 'connected').length,
      total: integrations.length,
      providers: this.getProviders().length,
      healthy: Object.values(healthData).filter(h => h.status === 'healthy').length,
      unhealthy: Object.values(healthData).filter(h => h.status !== 'healthy').length,
      pendingSyncs: this.sync.getPending().length,
      activeWebhooks: this.webhook.getWebhooks().length
    };
  }

  getEvents(filter) { return this.events.history(filter); }

  clear() {
    this.registry.clear(); this.loader.clear(); this.installer = null;
    this.health.clear(); this.scheduler.clear(); this.sync.clear();
    this.webhook.clear(); this.secrets.clear(); this.audit.clear();
    this.storage.clear(); this.events.clear(); this.permissions.clear();
  }
}

let _defaultEngine = null;
function getDefaultEngine(options = {}) {
  if (!_defaultEngine) _defaultEngine = new IntegrationManager(options);
  return _defaultEngine;
}
function createEngine(options = {}) { return new IntegrationManager(options); }

module.exports = { IntegrationManager, getDefaultEngine, createEngine, EVENTS, PERMISSIONS };
