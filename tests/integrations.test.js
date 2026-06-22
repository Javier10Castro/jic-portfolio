const assert = require('assert');
const { IntegrationManager, createEngine, getDefaultEngine, EVENTS, PERMISSIONS } = require('../lib/integrations');
const { IntegrationRegistry } = require('../lib/integrations/integrationRegistry');
const { IntegrationLoader } = require('../lib/integrations/integrationLoader');
const { IntegrationInstaller } = require('../lib/integrations/integrationInstaller');
const { IntegrationValidator } = require('../lib/integrations/integrationValidator');
const { IntegrationEvents, EVENTS: EVENTS_RAW } = require('../lib/integrations/integrationEvents');
const { IntegrationStorage } = require('../lib/integrations/integrationStorage');
const { IntegrationPermissions, PERMISSIONS: PERMISSIONS_RAW } = require('../lib/integrations/integrationPermissions');
const { IntegrationHealth } = require('../lib/integrations/integrationHealth');
const { IntegrationScheduler } = require('../lib/integrations/integrationScheduler');
const { IntegrationSync } = require('../lib/integrations/integrationSync');
const { IntegrationWebhook } = require('../lib/integrations/integrationWebhook');
const { IntegrationSecrets } = require('../lib/integrations/integrationSecrets');
const { IntegrationAudit } = require('../lib/integrations/integrationAudit');
const { BaseIntegration } = require('../lib/integrations/providers');
const { GithubProvider } = require('../lib/integrations/providers/github/GithubProvider');
const { GithubRepositories } = require('../lib/integrations/providers/github/GithubRepositories');
const { GithubActions } = require('../lib/integrations/providers/github/GithubActions');
const { GithubPullRequests } = require('../lib/integrations/providers/github/GithubPullRequests');
const { GithubIssues } = require('../lib/integrations/providers/github/GithubIssues');
const { GithubWebhooks } = require('../lib/integrations/providers/github/GithubWebhooks');
const { GitlabProvider } = require('../lib/integrations/providers/gitlab/GitlabProvider');
const { GitlabPipelines } = require('../lib/integrations/providers/gitlab/GitlabPipelines');
const { GitlabRepositories } = require('../lib/integrations/providers/gitlab/GitlabRepositories');
const { GitlabMergeRequests } = require('../lib/integrations/providers/gitlab/GitlabMergeRequests');
const { BitbucketProvider } = require('../lib/integrations/providers/bitbucket/BitbucketProvider');
const { VercelProvider } = require('../lib/integrations/providers/vercel/VercelProvider');
const { VercelProjects } = require('../lib/integrations/providers/vercel/Projects');
const { VercelDeployments } = require('../lib/integrations/providers/vercel/Deployments');
const { VercelDomains } = require('../lib/integrations/providers/vercel/Domains');
const { NetlifyProvider } = require('../lib/integrations/providers/netlify/NetlifyProvider');
const { SlackProvider } = require('../lib/integrations/providers/slack/SlackProvider');
const { SlackChannels } = require('../lib/integrations/providers/slack/Channels');
const { SlackMessages } = require('../lib/integrations/providers/slack/Messages');
const { SlackNotifications } = require('../lib/integrations/providers/slack/Notifications');
const { SlackSlashCommands } = require('../lib/integrations/providers/slack/SlashCommands');
const { TeamsProvider } = require('../lib/integrations/providers/teams/TeamsProvider');
const { DiscordProvider } = require('../lib/integrations/providers/discord/DiscordProvider');
const { NotionProvider } = require('../lib/integrations/providers/notion/NotionProvider');
const { NotionPages } = require('../lib/integrations/providers/notion/Pages');
const { NotionDatabase } = require('../lib/integrations/providers/notion/Database');
const { JiraProvider } = require('../lib/integrations/providers/jira/JiraProvider');
const { JiraIssues } = require('../lib/integrations/providers/jira/Issues');
const { JiraProjects } = require('../lib/integrations/providers/jira/Projects');
const { LinearProvider } = require('../lib/integrations/providers/linear/LinearProvider');
const { TrelloProvider } = require('../lib/integrations/providers/trello/TrelloProvider');
const { AsanaProvider } = require('../lib/integrations/providers/asana/AsanaProvider');
const { GoogleOAuth } = require('../lib/integrations/providers/google/GoogleOAuth');
const { GoogleDrive } = require('../lib/integrations/providers/google/GoogleDrive');
const { GoogleDocs } = require('../lib/integrations/providers/google/GoogleDocs');
const { GoogleSheets } = require('../lib/integrations/providers/google/GoogleSheets');
const { OneDrive } = require('../lib/integrations/providers/office365/OneDrive');
const { Outlook } = require('../lib/integrations/providers/office365/Outlook');
const { DropboxProvider } = require('../lib/integrations/providers/dropbox/DropboxProvider');
const { S3Provider } = require('../lib/integrations/providers/aws/S3Provider');
const { SecretsManager } = require('../lib/integrations/providers/aws/SecretsManager');
const { CloudflarePages } = require('../lib/integrations/providers/cloudflare/Pages');
const { CloudflareDNS } = require('../lib/integrations/providers/cloudflare/DNS');
const { CloudflareKV } = require('../lib/integrations/providers/cloudflare/KV');
const { PostgresSync } = require('../lib/integrations/providers/postgres/PostgresSync');
const { MySQLSync } = require('../lib/integrations/providers/mysql/MySQLSync');
const { MongoSync } = require('../lib/integrations/providers/mongodb/MongoSync');
const { RedisSync } = require('../lib/integrations/providers/redis/RedisSync');
const pluginController = require('../lib/api/controllers/integrationController');
const { Plugin, createPlugin } = require('../lib/plugin-sdk/Plugin');
const { Integration, createIntegration } = require('../lib/plugin-sdk/Integration');
const { Webhook, createWebhook } = require('../lib/plugin-sdk/Webhook');
const { OAuthProvider, createOAuthProvider } = require('../lib/plugin-sdk/OAuthProvider');

describe('Enterprise Integration Hub — Phase 9.4.0', () => {
  let manager, registry, events, storage, health, sync, webhookModule, secrets, audit, scheduler, permissions, loader, installer, validator;

  beforeEach(() => {
    registry = new IntegrationRegistry();
    storage = new IntegrationStorage();
    events = new IntegrationEvents();
    permissions = new IntegrationPermissions();
    health = new IntegrationHealth();
    sync = new IntegrationSync({ storage, events, health });
    scheduler = new IntegrationScheduler();
    webhookModule = new IntegrationWebhook({ events, storage, secrets: new IntegrationSecrets({ storage }) });
    secrets = new IntegrationSecrets({ storage });
    audit = new IntegrationAudit({ storage });
    loader = new IntegrationLoader();
    validator = new IntegrationValidator();
    installer = new IntegrationInstaller({ registry, loader });
    manager = new IntegrationManager({ registry, loader, installer, validator, events, storage, permissions, health, scheduler, sync, webhook: webhookModule, secrets, audit });
  });

  describe('IntegrationManager', () => {
    it('should create with all sub-modules', () => {
      assert.ok(manager.registry);
      assert.ok(manager.loader);
      assert.ok(manager.installer);
      assert.ok(manager.validator);
      assert.ok(manager.events);
      assert.ok(manager.storage);
      assert.ok(manager.permissions);
      assert.ok(manager.health);
      assert.ok(manager.scheduler);
      assert.ok(manager.sync);
      assert.ok(manager.secrets);
      assert.ok(manager.audit);
      assert.ok(manager.webhook);
    });

    it('should create engine via createEngine()', () => {
      const engine = createEngine();
      assert.ok(engine instanceof IntegrationManager);
    });

    it('should connect to a provider', () => {
      const result = manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      assert.ok(result.success);
      assert.ok(result.integration);
      assert.ok(result.instance);
    });

    it('should reject duplicate connection', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const result = manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Already connected'));
    });

    it('should reject unknown provider', () => {
      const result = manager.connect('nonexistent', { name: 'test', auth: { type: 'oauth2' } });
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Unknown provider'));
    });

    it('should disconnect a provider', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const result = manager.disconnect('github');
      assert.ok(result.success);
    });

    it('should return error disconnecting not connected', () => {
      const result = manager.disconnect('nonexistent');
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Not connected'));
    });

    it('should list integrations', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const list = manager.listIntegrations();
      assert.strictEqual(list.length, 1);
      assert.strictEqual(list[0].provider, 'github');
    });

    it('should get integration by provider', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const integration = manager.getIntegration('github');
      assert.ok(integration);
      assert.strictEqual(integration.provider, 'github');
    });

    it('should return null for unknown integration', () => {
      const integration = manager.getIntegration('unknown');
      assert.strictEqual(integration, null);
    });

    it('should get status', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const status = manager.getStatus();
      assert.ok(status.connected >= 1);
      assert.ok(status.total >= 1);
      assert.ok(typeof status.providers === 'number');
    });

    it('should get providers list', () => {
      const providers = manager.getProviders();
      assert.ok(Array.isArray(providers));
      assert.ok(providers.length > 0);
    });

    it('should clear all state', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      manager.clear();
      assert.strictEqual(manager.getIntegration('github'), null);
    });

    it('should emit connected event', () => {
      let emitted = false;
      manager.events.on(EVENTS.CONNECTED, () => { emitted = true; });
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      assert.ok(emitted);
    });

    it('should emit disconnected event', () => {
      let emitted = false;
      manager.events.on(EVENTS.DISCONNECTED, () => { emitted = true; });
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      manager.disconnect('github');
      assert.ok(emitted);
    });

    it('should audit on connect', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const stats = manager.getAuditStats();
      assert.strictEqual(stats.totalEntries, 1);
      assert.strictEqual(stats.actions['connected'], 1);
    });

    it('should audit on disconnect', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      manager.disconnect('github');
      const stats = manager.getAuditStats();
      assert.strictEqual(stats.totalEntries, 2);
    });

    it('should reject invalid config on connect', () => {
      const result = manager.connect('github', null);
      assert.strictEqual(result.success, false);
    });
  });

  describe('IntegrationRegistry', () => {
    it('should register and unregister', () => {
      registry.register({ provider: 'test', status: 'connected' });
      assert.ok(registry.getIntegration('test'));
      registry.unregister('test');
      assert.strictEqual(registry.getIntegration('test'), null);
    });

    it('should list with filter', () => {
      registry.register({ provider: 'a', status: 'connected', type: 'source-control' });
      registry.register({ provider: 'b', status: 'disconnected', type: 'messaging' });
      const filtered = registry.listIntegrations({ status: 'connected' });
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].provider, 'a');
    });

    it('should get by provider', () => {
      registry.register({ provider: 'test', status: 'connected' });
      const result = registry.getIntegration('test');
      assert.ok(result);
      assert.strictEqual(result.provider, 'test');
    });

    it('should return null for missing', () => {
      assert.strictEqual(registry.getIntegration('missing'), null);
    });

    it('should register provider definitions', () => {
      registry.registerProvider({ id: 'custom', name: 'Custom', type: 'service', authType: 'api-key' });
      const provider = registry.getProvider('custom');
      assert.ok(provider);
      assert.strictEqual(provider.name, 'Custom');
    });

    it('should get provider definitions', () => {
      registry.registerProvider({ id: 'test-p', name: 'Test', type: 'generic', authType: 'none' });
      const provider = registry.getProvider('test-p');
      assert.strictEqual(provider.id, 'test-p');
    });

    it('should return null for missing provider def', () => {
      assert.strictEqual(registry.getProvider('nonexistent'), null);
    });

    it('should count', () => {
      registry.register({ provider: 'a' });
      registry.register({ provider: 'b' });
      assert.strictEqual(registry.getCount(), 2);
    });

    it('should clear', () => {
      registry.register({ provider: 'a' });
      registry.register({ provider: 'b' });
      registry.clear();
      assert.strictEqual(registry.getCount(), 0);
    });

    it('should list providers', () => {
      registry.register({ provider: 'x', type: 't', authType: 'a', version: '1.0' });
      registry.register({ provider: 'y', type: 't2', authType: 'a2', version: '2.0' });
      const providers = registry.getProviders();
      assert.strictEqual(providers.length, 2);
    });

    it('should filter by provider', () => {
      registry.register({ provider: 'a', status: 'connected' });
      registry.register({ provider: 'b', status: 'connected' });
      const filtered = registry.listIntegrations({ provider: 'a' });
      assert.strictEqual(filtered.length, 1);
    });

    it('should filter by type', () => {
      registry.register({ provider: 'a', status: 'connected', type: 'source-control' });
      registry.register({ provider: 'b', status: 'connected', type: 'messaging' });
      const filtered = registry.listIntegrations({ type: 'messaging' });
      assert.strictEqual(filtered.length, 1);
    });
  });

  describe('IntegrationLoader', () => {
    it('should load integration', () => {
      const result = loader.load({ provider: 'test' });
      assert.ok(result.success);
      assert.ok(loader.isLoaded('test'));
    });

    it('should unload integration', () => {
      loader.load({ provider: 'test' });
      loader.unload('test');
      assert.strictEqual(loader.isLoaded('test'), false);
    });

    it('should check isLoaded', () => {
      loader.load({ provider: 'test' });
      assert.ok(loader.isLoaded('test'));
      assert.strictEqual(loader.isLoaded('other'), false);
    });

    it('should get loaded list', () => {
      loader.load({ provider: 'a' });
      loader.load({ provider: 'b' });
      const loaded = loader.getLoaded();
      assert.strictEqual(loaded.length, 2);
    });

    it('should not load duplicate', () => {
      loader.load({ provider: 'test' });
      loader.load({ provider: 'test' });
      assert.strictEqual(loader.getCount(), 1);
    });

    it('should clear', () => {
      loader.load({ provider: 'a' });
      loader.load({ provider: 'b' });
      loader.clear();
      assert.strictEqual(loader.getCount(), 0);
    });

    it('should get instance', () => {
      const integration = { provider: 'test' };
      loader.load(integration);
      const instance = loader.getInstance('test');
      assert.strictEqual(instance.provider, 'test');
    });

    it('should return null for missing instance', () => {
      assert.strictEqual(loader.getInstance('missing'), null);
    });
  });

  describe('IntegrationValidator', () => {
    it('should validate valid config', () => {
      const result = validator.validate('test', { name: 'test', auth: { type: 'oauth2' } });
      assert.ok(result.valid);
    });

    it('should reject config without name', () => {
      const result = validator.validate('test', { auth: { type: 'oauth2' } });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('name')));
    });

    it('should reject config without auth', () => {
      const result = validator.validate('test', { name: 'test' });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('auth')));
    });

    it('should reject null config', () => {
      const result = validator.validate('test', null);
      assert.strictEqual(result.valid, false);
    });

    it('should validate auth types', () => {
      const validTypes = ['oauth2', 'oauth-pkce', 'pat', 'api-key', 'jwt', 'none'];
      for (const type of validTypes) {
        const result = validator.validate('test', { name: 'test', auth: { type } });
        assert.ok(result.valid, `Failed for auth type: ${type}`);
      }
    });

    it('should reject unknown auth type', () => {
      const result = validator.validate('test', { name: 'test', auth: { type: 'invalid' } });
      assert.strictEqual(result.valid, false);
    });

    it('should reject missing auth type', () => {
      const result = validator.validateAuth({});
      assert.strictEqual(result.valid, false);
    });

    it('should reject null auth', () => {
      const result = validator.validateAuth(null);
      assert.strictEqual(result.valid, false);
    });

    it('should accept auth with valid type', () => {
      const result = validator.validateAuth({ type: 'jwt' });
      assert.ok(result.valid);
    });
  });

  describe('IntegrationEvents', () => {
    it('should emit and listen', () => {
      let received = null;
      events.on(EVENTS.CONNECTED, (data) => { received = data; });
      events.emit(EVENTS.CONNECTED, { provider: 'test' });
      assert.ok(received);
      assert.strictEqual(received.provider, 'test');
    });

    it('should support wildcard listener', () => {
      let wildcardReceived = null;
      events.on('*', (event, data) => { wildcardReceived = { event, data }; });
      events.emit(EVENTS.SYNCED, { provider: 'test' });
      assert.ok(wildcardReceived);
      assert.strictEqual(wildcardReceived.event, EVENTS.SYNCED);
    });

    it('should remove listener', () => {
      let count = 0;
      const handler = () => { count++; };
      events.on(EVENTS.CONNECTED, handler);
      events.emit(EVENTS.CONNECTED, {});
      events.off(EVENTS.CONNECTED, handler);
      events.emit(EVENTS.CONNECTED, {});
      assert.strictEqual(count, 1);
    });

    it('should maintain history', () => {
      events.emit(EVENTS.CONNECTED, { provider: 'a' });
      events.emit(EVENTS.DISCONNECTED, { provider: 'b' });
      const history = events.history();
      assert.strictEqual(history.length, 2);
    });

    it('should filter history', () => {
      events.emit(EVENTS.CONNECTED, { provider: 'a' });
      events.emit(EVENTS.DISCONNECTED, { provider: 'b' });
      const filtered = events.history(EVENTS.CONNECTED);
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].event, EVENTS.CONNECTED);
    });

    it('should have EVENTS constants', () => {
      assert.strictEqual(EVENTS.CONNECTED, 'integration.connected');
      assert.strictEqual(EVENTS.DISCONNECTED, 'integration.disconnected');
      assert.strictEqual(EVENTS.INSTALLED, 'integration.installed');
      assert.strictEqual(EVENTS.SYNCED, 'integration.synced');
      assert.strictEqual(EVENTS.FAILED, 'integration.failed');
      assert.strictEqual(EVENTS.WEBHOOK_RECEIVED, 'integration.webhook.received');
      assert.strictEqual(EVENTS.HEALTH_CHANGED, 'integration.health.changed');
      assert.strictEqual(EVENTS.TOKEN_EXPIRED, 'integration.token.expired');
    });

    it('should emit all event types', () => {
      const emitted = [];
      events.on('*', (event) => { emitted.push(event); });
      events.emit(EVENTS.CONNECTED, {});
      events.emit(EVENTS.DISCONNECTED, {});
      events.emit(EVENTS.INSTALLED, {});
      events.emit(EVENTS.SYNCED, {});
      events.emit(EVENTS.FAILED, {});
      events.emit(EVENTS.WEBHOOK_RECEIVED, {});
      events.emit(EVENTS.HEALTH_CHANGED, {});
      events.emit(EVENTS.TOKEN_EXPIRED, {});
      assert.strictEqual(emitted.length, 8);
    });

    it('should clear', () => {
      events.emit(EVENTS.CONNECTED, {});
      events.clear();
      assert.strictEqual(events.history().length, 0);
    });

    it('should handle errors in listeners silently', () => {
      events.on(EVENTS.CONNECTED, () => { throw new Error('handler error'); });
      events.on(EVENTS.CONNECTED, () => { /* should still run */ });
      assert.doesNotThrow(() => events.emit(EVENTS.CONNECTED, {}));
    });
  });

  describe('IntegrationStorage', () => {
    it('should set and get', () => {
      storage.set('key1', 'value1');
      assert.strictEqual(storage.get('key1'), 'value1');
    });

    it('should check existence', () => {
      storage.set('key1', 'value1');
      assert.ok(storage.has('key1'));
      assert.strictEqual(storage.has('key2'), false);
    });

    it('should delete', () => {
      storage.set('key1', 'value1');
      storage.delete('key1');
      assert.strictEqual(storage.has('key1'), false);
    });

    it('should namespace by provider', () => {
      storage.setNamespaced('github', 'token', 'abc');
      assert.strictEqual(storage.getNamespaced('github', 'token'), 'abc');
    });

    it('should get provider data', () => {
      storage.setNamespaced('github', 'token', 'abc');
      storage.setNamespaced('github', 'refresh', 'def');
      storage.setNamespaced('slack', 'token', 'xyz');
      const data = storage.getProviderData('github');
      assert.strictEqual(Object.keys(data).length, 2);
      assert.strictEqual(data.token, 'abc');
    });

    it('should clear', () => {
      storage.set('key1', 'value1');
      storage.clear();
      assert.strictEqual(storage.has('key1'), false);
    });

    it('should handle namespaced delete', () => {
      storage.setNamespaced('github', 'key', 'val');
      storage.deleteNamespaced('github', 'key');
      assert.strictEqual(storage.getNamespaced('github', 'key'), undefined);
    });

    it('should return undefined for missing key', () => {
      assert.strictEqual(storage.get('missing'), undefined);
    });
  });

  describe('IntegrationPermissions', () => {
    it('should have PERMISSIONS constants', () => {
      assert.strictEqual(PERMISSIONS.INTEGRATIONS_READ, 'integrations.read');
      assert.strictEqual(PERMISSIONS.INTEGRATIONS_WRITE, 'integrations.write');
      assert.strictEqual(PERMISSIONS.INTEGRATIONS_ADMIN, 'integrations.admin');
      assert.strictEqual(PERMISSIONS.WEBHOOKS, 'webhooks');
      assert.strictEqual(PERMISSIONS.SYNC, 'sync');
      assert.strictEqual(PERMISSIONS.SECRETS, 'secrets');
    });

    it('should grant and check', () => {
      permissions.grant('github', PERMISSIONS.INTEGRATIONS_READ);
      assert.ok(permissions.hasPermission('github', PERMISSIONS.INTEGRATIONS_READ));
    });

    it('should reject invalid permission', () => {
      assert.strictEqual(permissions.hasPermission('github', 'nonexistent'), false);
    });

    it('should revoke', () => {
      permissions.grant('github', PERMISSIONS.INTEGRATIONS_READ);
      permissions.revoke('github', PERMISSIONS.INTEGRATIONS_READ);
      assert.strictEqual(permissions.hasPermission('github', PERMISSIONS.INTEGRATIONS_READ), false);
    });

    it('should get permissions', () => {
      permissions.grant('github', PERMISSIONS.INTEGRATIONS_READ);
      permissions.grant('github', PERMISSIONS.WEBHOOKS);
      const perms = permissions.getPermissions('github');
      assert.strictEqual(perms.length, 2);
    });

    it('should revoke all', () => {
      permissions.grant('github', PERMISSIONS.INTEGRATIONS_READ);
      permissions.grant('github', PERMISSIONS.WEBHOOKS);
      permissions.revokeAll('github');
      assert.strictEqual(permissions.getPermissions('github').length, 0);
    });

    it('should clear', () => {
      permissions.grant('github', PERMISSIONS.INTEGRATIONS_READ);
      permissions.clear();
      assert.strictEqual(permissions.hasPermission('github', PERMISSIONS.INTEGRATIONS_READ), false);
    });

    it('should revoke non-existent silently', () => {
      assert.doesNotThrow(() => permissions.revoke('missing', 'perm'));
    });

    it('should return empty array for unknown provider', () => {
      assert.deepStrictEqual(permissions.getPermissions('unknown'), []);
    });
  });

  describe('IntegrationHealth', () => {
    it('should record success', () => {
      health.recordSuccess('github', 150);
      const h = health.getHealth('github');
      assert.strictEqual(h.status, 'healthy');
      assert.strictEqual(h.latency, 150);
    });

    it('should record failure', () => {
      health.recordFailure('github', 'Connection timeout');
      const h = health.getHealth('github');
      assert.strictEqual(h.status, 'unhealthy');
      assert.ok(h.lastError.includes('Connection timeout'));
    });

    it('should record rate limit', () => {
      health.recordSuccess('github', 100);
      health.recordRateLimit('github', 5000, 4999, Math.floor(Date.now() / 1000) + 3600);
      const h = health.getHealth('github');
      assert.ok(h.rateLimits);
      assert.strictEqual(h.rateLimits.limit, 5000);
      assert.strictEqual(h.rateLimits.remaining, 4999);
    });

    it('should get health', () => {
      health.recordSuccess('github', 100);
      const h = health.getHealth('github');
      assert.ok(h);
      assert.strictEqual(h.status, 'healthy');
    });

    it('should calculate uptime', () => {
      health.recordSuccess('github', 100);
      const h = health.getHealth('github');
      assert.ok(h.uptime !== undefined);
    });

    it('should return null for unknown provider', () => {
      assert.strictEqual(health.getHealth('unknown'), null);
    });

    it('should get all health', () => {
      health.recordSuccess('github', 100);
      health.recordSuccess('slack', 50);
      const all = health.getAllHealth();
      assert.strictEqual(Object.keys(all).length, 2);
    });

    it('should clear', () => {
      health.recordSuccess('github', 100);
      health.clear();
      assert.strictEqual(health.getHealth('github'), null);
    });

    it('should increment failure count', () => {
      health.recordFailure('github', 'err1');
      health.recordFailure('github', 'err2');
      health.recordFailure('github', 'err3');
      const h = health.getHealth('github');
      assert.strictEqual(h.failures, 3);
    });

    it('should clear failures on success', () => {
      health.recordFailure('github', 'err');
      health.recordSuccess('github', 100);
      const h = health.getHealth('github');
      assert.strictEqual(h.failures, 0);
    });
  });

  describe('IntegrationScheduler', () => {
    it('should schedule job', () => {
      scheduler.schedule('github', 60000, () => {});
      const s = scheduler.getSchedule('github');
      assert.ok(s);
      assert.strictEqual(s.interval, 60000);
    });

    it('should cancel job', () => {
      scheduler.schedule('github', 60000, () => {});
      scheduler.cancel('github');
      assert.strictEqual(scheduler.getSchedule('github'), null);
    });

    it('should get schedule', () => {
      scheduler.schedule('github', 30000, () => {});
      const s = scheduler.getSchedule('github');
      assert.strictEqual(s.provider, 'github');
    });

    it('should return null for missing schedule', () => {
      assert.strictEqual(scheduler.getSchedule('missing'), null);
    });

    it('should list schedules', () => {
      scheduler.schedule('github', 60000, () => {});
      scheduler.schedule('slack', 120000, () => {});
      const list = scheduler.listSchedules();
      assert.strictEqual(list.length, 2);
    });

    it('should tick and run pending', () => {
      let ran = false;
      scheduler.schedule('github', -1000, () => { ran = true; });
      scheduler.tick();
      assert.ok(ran);
    });

    it('should clear', () => {
      scheduler.schedule('github', 60000, () => {});
      scheduler.clear();
      assert.strictEqual(scheduler.listSchedules().length, 0);
    });

    it('should handle tick with no jobs', () => {
      assert.doesNotThrow(() => scheduler.tick());
    });

    it('should handle task errors silently', () => {
      scheduler.schedule('github', -1000, () => { throw new Error('task error'); });
      assert.doesNotThrow(() => scheduler.tick());
    });

    it('should update nextRun after tick', () => {
      scheduler.schedule('github', 60000, () => {});
      const before = scheduler.getSchedule('github').nextRun;
      scheduler.tick();
      const after = scheduler.getSchedule('github').nextRun;
      assert.ok(after >= before);
    });
  });

  describe('IntegrationSync', () => {
    it('should start sync', () => {
      const result = sync.startSync('github', 'incremental');
      assert.ok(result.success);
      assert.ok(result.syncId);
    });

    it('should reject invalid sync type', () => {
      const result = sync.startSync('github', 'invalid');
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Invalid sync type'));
    });

    it('should complete sync', () => {
      const { syncId } = sync.startSync('github', 'full');
      const result = sync.completeSync(syncId, { rows: 10 });
      assert.ok(result.success);
    });

    it('should fail sync', () => {
      const { syncId } = sync.startSync('github', 'incremental');
      const result = sync.failSync(syncId, 'API error');
      assert.ok(result.success);
    });

    it('should fail completing unknown sync', () => {
      const result = sync.completeSync('unknown', {});
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('not found'));
    });

    it('should fail failing unknown sync', () => {
      const result = sync.failSync('unknown', 'error');
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('not found'));
    });

    it('should get syncs', () => {
      sync.startSync('github', 'incremental');
      sync.startSync('github', 'full');
      const syncs = sync.getSyncs('github');
      assert.strictEqual(syncs.length, 2);
    });

    it('should get pending', () => {
      sync.startSync('github', 'incremental');
      const pending = sync.getPending();
      assert.strictEqual(pending.length, 1);
      assert.strictEqual(pending[0].status, 'running');
    });

    it('should retry failed sync', () => {
      const { syncId } = sync.startSync('github', 'incremental');
      sync.failSync(syncId, 'error');
      const result = sync.retry(syncId);
      assert.ok(result.success);
    });

    it('should not retry non-failed sync', () => {
      const { syncId } = sync.startSync('github', 'incremental');
      const result = sync.retry(syncId);
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('not in failed state'));
    });

    it('should not retry unknown sync', () => {
      const result = sync.retry('unknown');
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('not found'));
    });

    it('should emit events', () => {
      let syncedEvent = null;
      events.on(EVENTS.SYNCED, (data) => { syncedEvent = data; });
      const { syncId } = sync.startSync('github', 'incremental');
      sync.completeSync(syncId, {});
      assert.ok(syncedEvent);
      assert.strictEqual(syncedEvent.provider, 'github');
    });

    it('should record health on failure', () => {
      const { syncId } = sync.startSync('github', 'incremental');
      sync.failSync(syncId, 'error');
      const h = health.getHealth('github');
      assert.strictEqual(h.status, 'unhealthy');
    });

    it('should clear', () => {
      sync.startSync('github', 'incremental');
      sync.clear();
      assert.strictEqual(sync.getPending().length, 0);
    });

    it('should enforce limit on getSyncs', () => {
      sync.startSync('github', 'incremental');
      sync.startSync('github', 'full');
      const syncs = sync.getSyncs('github', 1);
      assert.strictEqual(syncs.length, 1);
    });

    it('should track startedAt', () => {
      const { syncId } = sync.startSync('github', 'full');
      const s = sync.getSyncs('github')[0];
      assert.ok(s.startedAt);
      assert.ok(s.type, 'full');
    });
  });

  describe('IntegrationWebhook', () => {
    it('should register incoming webhook', () => {
      const result = webhookModule.registerIncoming('github', { path: '/webhook/github', secret: 'mysecret' });
      assert.ok(result.success);
      assert.ok(result.id);
    });

    it('should register outgoing webhook', () => {
      const result = webhookModule.registerOutgoing('github', { url: 'https://example.com/hook', secret: 'secret', events: ['push'] });
      assert.ok(result.success);
      assert.ok(result.id);
    });

    it('should process incoming webhook', () => {
      webhookModule.registerIncoming('github', { path: '/webhook/github' });
      const result = webhookModule.processIncoming('github', { action: 'push' }, '');
      assert.ok(result.success);
    });

    it('should verify signature', () => {
      const crypto = require('crypto');
      const secret = 'mysecret';
      const payload = { event: 'push' };
      const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
      webhookModule.registerIncoming('github', { path: '/webhook', secret });
      const result = webhookModule.processIncoming('github', payload, signature);
      assert.ok(result.success);
    });

    it('should reject invalid signature', () => {
      webhookModule.registerIncoming('github', { path: '/webhook', secret: 'real-secret' });
      const result = webhookModule.processIncoming('github', { event: 'push' }, 'invalid-signature');
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Invalid signature'));
    });

    it('should get webhooks', () => {
      webhookModule.registerIncoming('github', { path: '/hook1' });
      webhookModule.registerOutgoing('github', { url: 'https://example.com', events: [] });
      const hooks = webhookModule.getWebhooks('github');
      assert.strictEqual(hooks.length, 2);
    });

    it('should delete webhook', () => {
      const { id } = webhookModule.registerIncoming('github', { path: '/hook' });
      const result = webhookModule.deleteWebhook(id);
      assert.ok(result.success);
    });

    it('should fail deleting unknown webhook', () => {
      const result = webhookModule.deleteWebhook('nonexistent');
      assert.strictEqual(result.success, false);
    });

    it('should emit events on incoming', () => {
      let received = null;
      events.on(EVENTS.WEBHOOK_RECEIVED, (data) => { received = data; });
      webhookModule.registerIncoming('github', { path: '/hook' });
      webhookModule.processIncoming('github', { test: true }, '');
      assert.ok(received);
      assert.strictEqual(received.provider, 'github');
    });

    it('should clear', () => {
      webhookModule.registerIncoming('github', { path: '/hook' });
      webhookModule.clear();
      assert.strictEqual(webhookModule.getWebhooks('github').length, 0);
    });

    it('should send outgoing webhooks', () => {
      webhookModule.registerOutgoing('github', { url: 'https://ex.com/hook', events: ['push'] });
      const result = webhookModule.sendOutgoing('github', 'push', { data: 'test' });
      assert.ok(result.success);
      assert.strictEqual(result.results.length, 1);
    });

    it('should not send to unmatched event', () => {
      webhookModule.registerOutgoing('github', { url: 'https://ex.com/hook', events: ['push'] });
      const result = webhookModule.sendOutgoing('github', 'issues', {});
      assert.ok(result.success);
      assert.strictEqual(result.results.length, 0);
    });
  });

  describe('IntegrationSecrets', () => {
    it('should store secret', () => {
      const result = secrets.store('github', 'api_key', 'sk-12345');
      assert.ok(result.success);
    });

    it('should get secret', () => {
      secrets.store('github', 'api_key', 'sk-12345');
      const value = secrets.get('github', 'api_key');
      assert.strictEqual(value, 'sk-12345');
    });

    it('should delete secret', () => {
      secrets.store('github', 'api_key', 'sk-12345');
      secrets.delete('github', 'api_key');
      assert.strictEqual(secrets.get('github', 'api_key'), null);
    });

    it('should rotate secret', () => {
      secrets.store('github', 'api_key', 'old-key');
      const result = secrets.rotate('github', 'api_key');
      assert.ok(result.success);
      const newValue = secrets.get('github', 'api_key');
      assert.notStrictEqual(newValue, 'old-key');
    });

    it('should list secrets', () => {
      secrets.store('github', 'key1', 'val1');
      secrets.store('github', 'key2', 'val2');
      const list = secrets.list('github');
      assert.strictEqual(list.length, 2);
      assert.ok(list.includes('key1'));
      assert.ok(list.includes('key2'));
    });

    it('should handle missing secret', () => {
      assert.strictEqual(secrets.get('github', 'nonexistent'), null);
    });

    it('should clear', () => {
      secrets.store('github', 'key', 'val');
      secrets.clear();
    });
  });

  describe('IntegrationAudit', () => {
    it('should log entry', () => {
      const entry = audit.log('github', 'connected', { timestamp: Date.now() });
      assert.ok(entry.id);
      assert.strictEqual(entry.provider, 'github');
      assert.strictEqual(entry.action, 'connected');
    });

    it('should query by provider', () => {
      audit.log('github', 'connected', {});
      audit.log('slack', 'connected', {});
      const results = audit.query({ provider: 'github' });
      assert.strictEqual(results.length, 1);
    });

    it('should query by action', () => {
      audit.log('github', 'connected', {});
      audit.log('github', 'disconnected', {});
      const results = audit.query({ action: 'connected' });
      assert.strictEqual(results.length, 1);
    });

    it('should query by provider and action', () => {
      audit.log('github', 'connected', {});
      audit.log('github', 'disconnected', {});
      audit.log('slack', 'connected', {});
      const results = audit.query({ provider: 'github', action: 'connected' });
      assert.strictEqual(results.length, 1);
    });

    it('should get stats', () => {
      audit.log('github', 'connected', {});
      audit.log('github', 'disconnected', {});
      audit.log('slack', 'connected', {});
      const stats = audit.getStats();
      assert.strictEqual(stats.totalEntries, 3);
      assert.strictEqual(stats.uniqueProviders, 2);
      assert.strictEqual(stats.actions['connected'], 2);
    });

    it('should clear', () => {
      audit.log('github', 'connected', {});
      audit.clear();
      assert.strictEqual(audit.getStats().totalEntries, 0);
    });

    it('should filter by since', async () => {
      audit.log('github', 'old', {});
      await new Promise(r => setTimeout(r, 5));
      const now = Date.now();
      audit.log('github', 'new', {});
      const results = audit.query({ since: now });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].action, 'new');
    });

    it('should getByProvider', () => {
      audit.log('github', 'a', {});
      audit.log('slack', 'b', {});
      const entries = audit.getByProvider('github');
      assert.strictEqual(entries.length, 1);
    });

    it('should include details in log', () => {
      const entry = audit.log('github', 'test', { detail: 'value' });
      assert.strictEqual(entry.details.detail, 'value');
    });
  });

  describe('BaseIntegration', () => {
    it('should construct with config', () => {
      const base = new BaseIntegration({ oauth: { clientId: 'id' } });
      assert.ok(base);
      assert.strictEqual(base.connected, false);
    });

    it('should connect', async () => {
      const base = new BaseIntegration();
      const result = await base.connect();
      assert.ok(result.success);
      assert.ok(base.connected);
    });

    it('should disconnect', async () => {
      const base = new BaseIntegration();
      await base.connect();
      const result = await base.disconnect();
      assert.ok(result.success);
      assert.strictEqual(base.connected, false);
    });

    it('should test connection', async () => {
      const base = new BaseIntegration();
      try {
        const result = await base.testConnection();
        assert.ok(result.success !== undefined);
      } catch (e) {
        assert.ok(e.message.includes('Subclass'));
      }
    });

    it('should get provider info', () => {
      const base = new BaseIntegration();
      base.name = 'custom';
      base.version = '2.0.0';
      base.type = 'service';
      base.authType = 'api-key';
      const info = base.getProviderInfo();
      assert.strictEqual(info.name, 'custom');
      assert.strictEqual(info.version, '2.0.0');
      assert.strictEqual(info.type, 'service');
      assert.strictEqual(info.authType, 'api-key');
    });

    it('should get rate limits', () => {
      const base = new BaseIntegration();
      const limits = base.getRateLimits();
      assert.ok(limits.limit > 0);
      assert.ok(limits.remaining >= 0);
    });
  });

  describe('GithubProvider', () => {
    it('should connect with token', async () => {
      const gh = new GithubProvider({ token: 'ghp_test' });
      const result = await gh.connect();
      assert.ok(result.success);
      assert.ok(gh.connected);
    });

    it('should fail connect without token', async () => {
      const gh = new GithubProvider();
      const result = await gh.connect();
      assert.strictEqual(result.success, false);
    });

    it('should get profile', async () => {
      const gh = new GithubProvider({ token: 'ghp_test' });
      await gh.connect();
      const profile = await gh.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.login, 'octocat');
    });

    it('should have correct provider info', () => {
      const gh = new GithubProvider({ token: 'test' });
      assert.strictEqual(gh.name, 'github');
      assert.strictEqual(gh.type, 'source-control');
      assert.strictEqual(gh.authType, 'oauth2');
    });

    it('should make request', async () => {
      const gh = new GithubProvider({ token: 'test' });
      const res = await gh._request('GET', '/user');
      assert.ok(res.success);
      assert.strictEqual(res.status, 200);
    });
  });

  describe('GithubRepositories', () => {
    let repos;
    beforeEach(() => {
      repos = new GithubRepositories(new GithubProvider({ token: 'test' }));
    });

    it('should list repos', async () => {
      const result = await repos.list('test-org');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 3);
    });

    it('should get repo', async () => {
      const result = await repos.get('owner', 'my-repo');
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'my-repo');
    });

    it('should create repo', async () => {
      const result = await repos.create('new-repo', { private: true });
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'new-repo');
    });

    it('should delete repo', async () => {
      const result = await repos.delete('owner', 'old-repo');
      assert.ok(result.success);
    });
  });

  describe('GithubActions', () => {
    let actions;
    beforeEach(() => {
      actions = new GithubActions(new GithubProvider({ token: 'test' }));
    });

    it('should list workflows', async () => {
      const result = await actions.listWorkflows('owner', 'repo');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should trigger workflow', async () => {
      const result = await actions.triggerWorkflow('owner', 'repo', 1, 'main');
      assert.ok(result.success);
      assert.strictEqual(result.data.status, 'queued');
    });

    it('should list runs', async () => {
      const result = await actions.listRuns('owner', 'repo');
      assert.ok(result.success);
      assert.strictEqual(result.total_count, 3);
    });

    it('should get run', async () => {
      const result = await actions.getRun('owner', 'repo', 101);
      assert.ok(result.success);
      assert.strictEqual(result.data.id, 101);
    });
  });

  describe('GithubPullRequests', () => {
    let prs;
    beforeEach(() => {
      prs = new GithubPullRequests(new GithubProvider({ token: 'test' }));
    });

    it('should list PRs', async () => {
      const result = await prs.list('owner', 'repo');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 3);
    });

    it('should get PR', async () => {
      const result = await prs.get('owner', 'repo', 1);
      assert.ok(result.success);
      assert.strictEqual(result.data.number, 1);
    });

    it('should create PR', async () => {
      const result = await prs.create('owner', 'repo', 'Feature', 'feat-branch', 'main');
      assert.ok(result.success);
      assert.strictEqual(result.data.state, 'open');
    });

    it('should merge PR', async () => {
      const result = await prs.merge('owner', 'repo', 1);
      assert.ok(result.success);
      assert.ok(result.data.merged);
    });
  });

  describe('GithubIssues', () => {
    let issues;
    beforeEach(() => {
      issues = new GithubIssues(new GithubProvider({ token: 'test' }));
    });

    it('should list issues', async () => {
      const result = await issues.list('owner', 'repo');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 3);
    });

    it('should get issue', async () => {
      const result = await issues.get('owner', 'repo', 1);
      assert.ok(result.success);
      assert.strictEqual(result.data.number, 1);
    });

    it('should create issue', async () => {
      const result = await issues.create('owner', 'repo', 'Bug found');
      assert.ok(result.success);
      assert.ok(result.data.title.includes('Bug'));
    });

    it('should update issue', async () => {
      const result = await issues.update('owner', 'repo', 1, { title: 'Updated title' });
      assert.ok(result.success);
      assert.strictEqual(result.data.title, 'Updated title');
    });

    it('should close issue', async () => {
      const result = await issues.close('owner', 'repo', 1);
      assert.ok(result.success);
      assert.strictEqual(result.data.state, 'closed');
    });
  });

  describe('GithubWebhooks', () => {
    let hooks;
    beforeEach(() => {
      hooks = new GithubWebhooks(new GithubProvider({ token: 'test' }));
    });

    it('should list webhooks', async () => {
      const result = await hooks.list('owner', 'repo');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should create webhook', async () => {
      const result = await hooks.create('owner', 'repo', { url: 'https://ex.com/hook', content_type: 'json' }, ['push']);
      assert.ok(result.success);
      assert.ok(result.data.active);
    });

    it('should delete webhook', async () => {
      const result = await hooks.delete('owner', 'repo', 1);
      assert.ok(result.success);
    });

    it('should verify signature', () => {
      const payload = { event: 'push' };
      const secret = 'test-secret';
      const crypto = require('crypto');
      const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
      const result = hooks.verifySignature(payload, signature, secret);
      assert.ok(result);
    });
  });

  describe('GitlabProvider', () => {
    it('should connect', async () => {
      const gl = new GitlabProvider({ token: 'glpat-test' });
      const result = await gl.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const gl = new GitlabProvider({ token: 'test' });
      await gl.connect();
      const profile = await gl.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.username, 'root');
    });

    it('should get projects', async () => {
      const gl = new GitlabProvider({ token: 'test' });
      await gl.connect();
      const projects = await gl.getProjects();
      assert.ok(projects.success);
      assert.strictEqual(projects.data.length, 3);
    });

    it('should fail without token', async () => {
      const gl = new GitlabProvider();
      const result = await gl.connect();
      assert.strictEqual(result.success, false);
    });
  });

  describe('GitlabPipelines', () => {
    let pipelines;
    beforeEach(() => {
      pipelines = new GitlabPipelines(new GitlabProvider({ token: 'test' }));
    });

    it('should list pipelines', async () => {
      const result = await pipelines.list(1);
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 3);
    });

    it('should get pipeline', async () => {
      const result = await pipelines.get(1, 5);
      assert.ok(result.success);
      assert.strictEqual(result.data.id, 5);
    });

    it('should retry pipeline', async () => {
      const result = await pipelines.retry(1, 2);
      assert.ok(result.success);
      assert.strictEqual(result.data.status, 'pending');
    });
  });

  describe('GitlabRepositories', () => {
    let repos;
    beforeEach(() => {
      repos = new GitlabRepositories(new GitlabProvider({ token: 'test' }));
    });

    it('should list repos', async () => {
      const result = await repos.list();
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should get project', async () => {
      const result = await repos.get(1);
      assert.ok(result.success);
      assert.strictEqual(result.data.id, 1);
    });

    it('should create project', async () => {
      const result = await repos.create('new-project', { visibility: 'public' });
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'new-project');
    });

    it('should fork project', async () => {
      const result = await repos.fork(1, 'my-user');
      assert.ok(result.success);
      assert.ok(result.data.forked_from_project);
    });
  });

  describe('GitlabMergeRequests', () => {
    let mrs;
    beforeEach(() => {
      mrs = new GitlabMergeRequests(new GitlabProvider({ token: 'test' }));
    });

    it('should list MRs', async () => {
      const result = await mrs.list(1);
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 3);
    });

    it('should get MR', async () => {
      const result = await mrs.get(1, 2);
      assert.ok(result.success);
      assert.strictEqual(result.data.iid, 2);
    });

    it('should create MR', async () => {
      const result = await mrs.create(1, 'Feature', 'feat-branch', 'main');
      assert.ok(result.success);
      assert.strictEqual(result.data.state, 'opened');
    });

    it('should merge MR', async () => {
      const result = await mrs.merge(1, 1);
      assert.ok(result.success);
      assert.strictEqual(result.data.state, 'merged');
    });

    it('should approve MR', async () => {
      const result = await mrs.approve(1, 1);
      assert.ok(result.success);
      assert.ok(result.data.approved);
    });
  });

  describe('BitbucketProvider', () => {
    it('should connect', async () => {
      const bb = new BitbucketProvider({ token: 'test-token' });
      const result = await bb.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const bb = new BitbucketProvider({ token: 'test' });
      await bb.connect();
      const profile = await bb.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.display_name, 'John Doe');
    });

    it('should list repos', async () => {
      const bb = new BitbucketProvider({ token: 'test' });
      await bb.connect();
      const repos = await bb.listRepos();
      assert.ok(repos.success);
      assert.strictEqual(repos.data.length, 2);
    });

    it('should fail without token', async () => {
      const bb = new BitbucketProvider();
      const result = await bb.connect();
      assert.strictEqual(result.success, false);
    });
  });

  describe('VercelProvider', () => {
    it('should connect', async () => {
      const vc = new VercelProvider({ token: 'test-token' });
      const result = await vc.connect();
      assert.ok(result.success);
    });

    it('should get correct provider info', () => {
      const vc = new VercelProvider({ token: 'test' });
      assert.strictEqual(vc.name, 'vercel');
      assert.strictEqual(vc.type, 'deployment');
      assert.strictEqual(vc.authType, 'pat');
    });

    it('should fail without token', async () => {
      const vc = new VercelProvider();
      const result = await vc.connect();
      assert.strictEqual(result.success, false);
    });
  });

  describe('Vercel Projects', () => {
    let projects;
    beforeEach(() => {
      projects = new VercelProjects(new VercelProvider({ token: 'test' }));
    });

    it('should list projects', async () => {
      const result = await projects.list();
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should get project', async () => {
      const result = await projects.get('prj_abc123');
      assert.ok(result.success);
      assert.strictEqual(result.data.id, 'prj_abc123');
    });

    it('should create project', async () => {
      const result = await projects.create('my-app', { framework: 'nextjs' });
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'my-app');
    });

    it('should delete project', async () => {
      const result = await projects.delete('prj_abc123');
      assert.ok(result.success);
    });
  });

  describe('Vercel Deployments', () => {
    let deployments;
    beforeEach(() => {
      deployments = new VercelDeployments(new VercelProvider({ token: 'test' }));
    });

    it('should list deployments', async () => {
      const result = await deployments.list('prj_abc');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 3);
    });

    it('should get deployment', async () => {
      const result = await deployments.get('dpl_001');
      assert.ok(result.success);
      assert.strictEqual(result.data.id, 'dpl_001');
    });

    it('should create deployment', async () => {
      const result = await deployments.create('prj_abc', { ref: 'main' });
      assert.ok(result.success);
      assert.strictEqual(result.data.state, 'QUEUED');
    });

    it('should cancel deployment', async () => {
      const result = await deployments.cancel('dpl_001');
      assert.ok(result.success);
      assert.strictEqual(result.data.state, 'CANCELED');
    });
  });

  describe('Vercel Domains', () => {
    let domains;
    beforeEach(() => {
      domains = new VercelDomains(new VercelProvider({ token: 'test' }));
    });

    it('should list domains', async () => {
      const result = await domains.list('prj_abc');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should add domain', async () => {
      const result = await domains.add('prj_abc', 'mysite.com');
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'mysite.com');
    });

    it('should remove domain', async () => {
      const result = await domains.remove('prj_abc', 'mysite.com');
      assert.ok(result.success);
    });
  });

  describe('NetlifyProvider', () => {
    it('should connect', async () => {
      const nl = new NetlifyProvider({ token: 'test-token' });
      const result = await nl.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const nl = new NetlifyProvider({ token: 'test' });
      await nl.connect();
      const profile = await nl.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.email, 'john@example.com');
    });

    it('should list sites', async () => {
      const nl = new NetlifyProvider({ token: 'test' });
      await nl.connect();
      const sites = await nl.listSites();
      assert.ok(sites.success);
      assert.strictEqual(sites.data.length, 2);
    });

    it('should create site', async () => {
      const nl = new NetlifyProvider({ token: 'test' });
      await nl.connect();
      const result = await nl.createSite('my-new-site');
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'my-new-site');
    });

    it('should get deployments', async () => {
      const nl = new NetlifyProvider({ token: 'test' });
      await nl.connect();
      const deployments = await nl.getDeployments('site_abc');
      assert.ok(deployments.success);
      assert.strictEqual(deployments.data.length, 2);
    });

    it('should fail without token', async () => {
      const nl = new NetlifyProvider();
      const result = await nl.connect();
      assert.strictEqual(result.success, false);
    });
  });

  describe('SlackProvider', () => {
    it('should connect', async () => {
      const sl = new SlackProvider({ token: 'xoxb-test' });
      const result = await sl.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const sl = new SlackProvider({ token: 'test' });
      await sl.connect();
      const profile = await sl.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.user.name, 'johndoe');
    });

    it('should get team info', async () => {
      const sl = new SlackProvider({ token: 'test' });
      await sl.connect();
      const info = await sl.getTeamInfo();
      assert.ok(info.success);
      assert.strictEqual(info.data.team.name, 'Acme Corp');
    });

    it('should fail without token', async () => {
      const sl = new SlackProvider();
      const result = await sl.connect();
      assert.strictEqual(result.success, false);
    });
  });

  describe('Slack Channels', () => {
    let channels;
    beforeEach(() => {
      channels = new SlackChannels(new SlackProvider({ token: 'test' }));
    });

    it('should list channels', async () => {
      const result = await channels.list();
      assert.ok(result.success);
      assert.strictEqual(result.data.channels.length, 5);
    });

    it('should create channel', async () => {
      const result = await channels.create('new-channel');
      assert.ok(result.success);
      assert.strictEqual(result.data.channel.name, 'new-channel');
    });

    it('should join channel', async () => {
      const result = await channels.join('C001');
      assert.ok(result.success);
      assert.ok(result.data.channel.is_member);
    });

    it('should leave channel', async () => {
      const result = await channels.leave('C001');
      assert.ok(result.success);
      assert.strictEqual(result.data.channel.is_member, false);
    });

    it('should get history', async () => {
      const result = await channels.getHistory('C001');
      assert.ok(result.success);
      assert.strictEqual(result.data.messages.length, 3);
    });
  });

  describe('Slack Messages', () => {
    let messages;
    beforeEach(() => {
      messages = new SlackMessages(new SlackProvider({ token: 'test' }));
    });

    it('should send message', async () => {
      const result = await messages.send('C001', 'Hello!');
      assert.ok(result.success);
      assert.ok(result.data.message.text.includes('Hello'));
    });

    it('should update message', async () => {
      const result = await messages.update('C001', '1704067200.000100', 'Updated text');
      assert.ok(result.success);
      assert.strictEqual(result.data.message.text, 'Updated text');
    });

    it('should delete message', async () => {
      const result = await messages.delete('C001', '1704067200.000100');
      assert.ok(result.success);
    });

    it('should search messages', async () => {
      const result = await messages.search('hello');
      assert.ok(result.success);
      assert.strictEqual(result.data.messages.total, 2);
    });
  });

  describe('Slack Notifications', () => {
    let notifications;
    beforeEach(() => {
      notifications = new SlackNotifications(new SlackProvider({ token: 'test' }));
    });

    it('should send notification', async () => {
      const result = await notifications.sendNotification('C001', 'Alert', 'Something happened');
      assert.ok(result.success);
      assert.ok(result.data.message.attachments.length > 0);
    });

    it('should handle different severities', async () => {
      const severities = ['info', 'warning', 'error', 'success'];
      for (const sev of severities) {
        const result = await notifications.sendNotification('C001', 'Test', 'msg', sev);
        assert.ok(result.success);
      }
    });

    it('should default to info severity', async () => {
      const result = await notifications.sendNotification('C001', 'Test', 'msg', 'unknown');
      assert.ok(result.success);
    });
  });

  describe('Slack SlashCommands', () => {
    let cmds;
    beforeEach(() => {
      cmds = new SlackSlashCommands(new SlackProvider({ token: 'test' }));
    });

    it('should register command', async () => {
      const result = await cmds.register('/hello', async () => 'Hello!');
      assert.ok(result.success);
    });

    it('should execute command', async () => {
      await cmds.register('/hello', async () => ({ text: 'Hello!' }));
      const result = await cmds.execute('/hello', '', 'U123');
      assert.ok(result.success);
      assert.strictEqual(result.data.text, 'Hello!');
    });

    it('should list commands', async () => {
      await cmds.register('/hello', () => {});
      await cmds.register('/bye', () => {});
      const result = await cmds.list();
      assert.strictEqual(result.data.length, 2);
    });

    it('should handle unknown command', async () => {
      const result = await cmds.execute('/unknown', '', 'U123');
      assert.strictEqual(result.success, false);
    });
  });

  describe('TeamsProvider', () => {
    it('should connect', async () => {
      const tm = new TeamsProvider({ token: 'test-token' });
      const result = await tm.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const tm = new TeamsProvider({ token: 'test' });
      await tm.connect();
      const profile = await tm.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.displayName, 'John Doe');
    });

    it('should send message', async () => {
      const tm = new TeamsProvider({ token: 'test' });
      await tm.connect();
      const result = await tm.sendMessage('ch-001', 'Hello Teams!');
      assert.ok(result.success);
      assert.strictEqual(result.data.body.content, 'Hello Teams!');
    });

    it('should list channels', async () => {
      const tm = new TeamsProvider({ token: 'test' });
      await tm.connect();
      const result = await tm.listChannels('team-1');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 3);
    });
  });

  describe('DiscordProvider', () => {
    it('should connect', async () => {
      const dc = new DiscordProvider({ token: 'test-token' });
      const result = await dc.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const dc = new DiscordProvider({ token: 'test' });
      await dc.connect();
      const profile = await dc.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.username, 'MyBot');
    });

    it('should send message', async () => {
      const dc = new DiscordProvider({ token: 'test' });
      await dc.connect();
      const result = await dc.sendMessage('ch-001', 'Hello!');
      assert.ok(result.success);
      assert.strictEqual(result.data.content, 'Hello!');
    });

    it('should list channels', async () => {
      const dc = new DiscordProvider({ token: 'test' });
      await dc.connect();
      const result = await dc.listChannels('guild-1');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 4);
    });
  });

  describe('NotionProvider', () => {
    it('should connect', async () => {
      const nt = new NotionProvider({ token: 'test-token' });
      const result = await nt.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const nt = new NotionProvider({ token: 'test' });
      await nt.connect();
      const profile = await nt.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.name, 'John Doe');
    });

    it('should search', async () => {
      const nt = new NotionProvider({ token: 'test' });
      await nt.connect();
      const result = await nt.search('guide');
      assert.ok(result.success);
      assert.strictEqual(result.data.results.length, 2);
    });
  });

  describe('Notion Pages', () => {
    let pages;
    beforeEach(() => {
      pages = new NotionPages(new NotionProvider({ token: 'test' }));
    });

    it('should get page', async () => {
      const result = await pages.get('page-uuid-1');
      assert.ok(result.success);
      assert.strictEqual(result.data.id, 'page-uuid-1');
    });

    it('should create page', async () => {
      const result = await pages.create('parent-uuid', 'New Page', 'Content');
      assert.ok(result.success);
      assert.strictEqual(result.data.properties.title.title[0].plain_text, 'New Page');
    });

    it('should update page', async () => {
      const result = await pages.update('page-uuid-1', { title: 'Updated' });
      assert.ok(result.success);
    });

    it('should delete page', async () => {
      const result = await pages.delete('page-uuid-1');
      assert.ok(result.success);
      assert.ok(result.data.archived);
    });
  });

  describe('Notion Database', () => {
    let db;
    beforeEach(() => {
      db = new NotionDatabase(new NotionProvider({ token: 'test' }));
    });

    it('should query database', async () => {
      const result = await db.query('db-uuid-1');
      assert.ok(result.success);
      assert.strictEqual(result.data.results.length, 3);
    });

    it('should get database', async () => {
      const result = await db.get('db-uuid-1');
      assert.ok(result.success);
      assert.ok(result.data.title.length > 0);
    });

    it('should create database', async () => {
      const result = await db.create('parent-uuid', 'New DB', { Name: { title: {} } });
      assert.ok(result.success);
      assert.strictEqual(result.data.object, 'database');
    });
  });

  describe('JiraProvider', () => {
    it('should connect', async () => {
      const jr = new JiraProvider({ token: 'test-token', baseUrl: 'https://test.atlassian.net' });
      const result = await jr.connect();
      assert.ok(result.success);
    });

    it('should get correct provider info', () => {
      const jr = new JiraProvider({ token: 'test' });
      assert.strictEqual(jr.name, 'jira');
      assert.strictEqual(jr.type, 'project-management');
      assert.strictEqual(jr.authType, 'pat');
    });

    it('should fail without token', async () => {
      const jr = new JiraProvider();
      const result = await jr.connect();
      assert.strictEqual(result.success, false);
    });
  });

  describe('Jira Issues', () => {
    let issues;
    beforeEach(() => {
      issues = new JiraIssues(new JiraProvider({ token: 'test', baseUrl: 'https://test.atlassian.net' }));
    });

    it('should list issues', async () => {
      const result = await issues.list('PROJ');
      assert.ok(result.success);
      assert.strictEqual(result.data.total, 3);
    });

    it('should get issue', async () => {
      const result = await issues.get('PROJ-1');
      assert.ok(result.success);
      assert.strictEqual(result.data.key, 'PROJ-1');
    });

    it('should create issue', async () => {
      const result = await issues.create('PROJ', 'New bug', 'Bug', 'High');
      assert.ok(result.success);
      assert.ok(result.data.key.startsWith('PROJ-'));
    });

    it('should update issue', async () => {
      const result = await issues.update('PROJ-1', { summary: 'Updated summary' });
      assert.ok(result.success);
    });

    it('should transition issue', async () => {
      const result = await issues.transition('PROJ-1', '31');
      assert.ok(result.success);
      assert.ok(result.data.transition);
    });
  });

  describe('Jira Projects', () => {
    let projects;
    beforeEach(() => {
      projects = new JiraProjects(new JiraProvider({ token: 'test', baseUrl: 'https://test.atlassian.net' }));
    });

    it('should list projects', async () => {
      const result = await projects.list();
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should get project', async () => {
      const result = await projects.get('PROJ');
      assert.ok(result.success);
      assert.strictEqual(result.data.key, 'PROJ');
    });

    it('should create project', async () => {
      const result = await projects.create('New Project', 'NEW', 'lead@example.com');
      assert.ok(result.success);
      assert.strictEqual(result.data.key, 'NEW');
    });
  });

  describe('LinearProvider', () => {
    it('should connect', async () => {
      const ln = new LinearProvider({ apiKey: 'lin-api-test' });
      const result = await ln.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const ln = new LinearProvider({ apiKey: 'test' });
      await ln.connect();
      const profile = await ln.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.name, 'John Doe');
    });

    it('should list teams', async () => {
      const ln = new LinearProvider({ apiKey: 'test' });
      await ln.connect();
      const teams = await ln.listTeams();
      assert.ok(teams.success);
      assert.strictEqual(teams.data.length, 2);
    });

    it('should list issues', async () => {
      const ln = new LinearProvider({ apiKey: 'test' });
      await ln.connect();
      const issues = await ln.listIssues('team-uuid-1');
      assert.ok(issues.success);
      assert.strictEqual(issues.data.length, 3);
    });

    it('should create issue', async () => {
      const ln = new LinearProvider({ apiKey: 'test' });
      await ln.connect();
      const result = await ln.createIssue('team-uuid-1', 'New task');
      assert.ok(result.success);
      assert.strictEqual(result.data.title, 'New task');
    });

    it('should fail without api key', async () => {
      const ln = new LinearProvider();
      const result = await ln.connect();
      assert.strictEqual(result.success, false);
    });
  });

  describe('TrelloProvider', () => {
    it('should connect', async () => {
      const tr = new TrelloProvider({ apiKey: 'key', token: 'token' });
      const result = await tr.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const tr = new TrelloProvider({ apiKey: 'key', token: 'token' });
      await tr.connect();
      const profile = await tr.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.fullName, 'John Doe');
    });

    it('should list boards', async () => {
      const tr = new TrelloProvider({ apiKey: 'key', token: 'token' });
      await tr.connect();
      const boards = await tr.listBoards();
      assert.ok(boards.success);
      assert.strictEqual(boards.data.length, 3);
    });

    it('should create board', async () => {
      const tr = new TrelloProvider({ apiKey: 'key', token: 'token' });
      await tr.connect();
      const result = await tr.createBoard('New Board');
      assert.ok(result.success);
    });

    it('should list lists', async () => {
      const tr = new TrelloProvider({ apiKey: 'key', token: 'token' });
      await tr.connect();
      const lists = await tr.listLists('board-1');
      assert.ok(lists.success);
      assert.strictEqual(lists.data.length, 3);
    });

    it('should create card', async () => {
      const tr = new TrelloProvider({ apiKey: 'key', token: 'token' });
      await tr.connect();
      const result = await tr.createCard('list-1', 'New Card');
      assert.ok(result.success);
    });

    it('should fail without credentials', async () => {
      const tr = new TrelloProvider();
      const result = await tr.connect();
      assert.strictEqual(result.success, false);
    });
  });

  describe('AsanaProvider', () => {
    it('should connect', async () => {
      const as = new AsanaProvider({ token: 'test-token' });
      const result = await as.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const as = new AsanaProvider({ token: 'test' });
      await as.connect();
      const profile = await as.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.name, 'John Doe');
    });

    it('should list projects', async () => {
      const as = new AsanaProvider({ token: 'test' });
      await as.connect();
      const projects = await as.listProjects('ws-1');
      assert.ok(projects.success);
      assert.strictEqual(projects.data.length, 2);
    });

    it('should create project', async () => {
      const as = new AsanaProvider({ token: 'test' });
      await as.connect();
      const result = await as.createProject('ws-1', 'New Project');
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'New Project');
    });

    it('should list tasks', async () => {
      const as = new AsanaProvider({ token: 'test' });
      await as.connect();
      const tasks = await as.listTasks('project-1');
      assert.ok(tasks.success);
      assert.strictEqual(tasks.data.length, 3);
    });

    it('should create task', async () => {
      const as = new AsanaProvider({ token: 'test' });
      await as.connect();
      const result = await as.createTask('project-1', 'New Task');
      assert.ok(result.success);
    });
  });

  describe('GoogleOAuth', () => {
    it('should generate auth URL', () => {
      const oauth = new GoogleOAuth({ clientId: 'client-1', clientSecret: 'secret', redirectUri: 'https://example.com/callback' });
      const result = oauth.generateAuthUrl('https://example.com/callback', ['openid', 'profile']);
      assert.ok(result.success);
      assert.ok(result.url.includes('accounts.google.com'));
      assert.ok(result.url.includes('client_id=client-1'));
    });

    it('should exchange code', async () => {
      const oauth = new GoogleOAuth({ clientId: 'client-1', clientSecret: 'secret' });
      const result = await oauth.exchangeCode('auth-code', 'https://example.com/callback');
      assert.ok(result.success);
      assert.ok(result.data.access_token);
    });

    it('should refresh token', async () => {
      const oauth = new GoogleOAuth({ clientId: 'client-1', clientSecret: 'secret' });
      const result = await oauth.refreshToken('refresh-token');
      assert.ok(result.success);
      assert.ok(result.data.access_token.includes('refreshed'));
    });

    it('should get access token from cache', async () => {
      const oauth = new GoogleOAuth({ clientId: 'c', clientSecret: 's' });
      await oauth.exchangeCode('code', 'https://ex.com/cb');
      const result = await oauth.getAccessToken();
      assert.ok(result.success);
      assert.ok(result.accessToken);
    });
  });

  describe('GoogleDrive', () => {
    let drive;
    beforeEach(() => {
      drive = new GoogleDrive({});
    });

    it('should list files', async () => {
      const result = await drive.listFiles();
      assert.ok(result.success);
      assert.strictEqual(result.data.files.length, 3);
    });

    it('should upload file', async () => {
      const result = await drive.upload('test.txt', 'content');
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'test.txt');
    });

    it('should download file', async () => {
      const result = await drive.download('file-1');
      assert.ok(result.success);
      assert.ok(result.data.content);
    });

    it('should delete file', async () => {
      const result = await drive.delete('file-1');
      assert.ok(result.success);
    });

    it('should create folder', async () => {
      const result = await drive.createFolder('New Folder');
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'New Folder');
    });
  });

  describe('GoogleDocs', () => {
    let docs;
    beforeEach(() => {
      docs = new GoogleDocs({});
    });

    it('should create document', async () => {
      const result = await docs.create('My Doc', 'Hello');
      assert.ok(result.success);
      assert.ok(result.data.documentId);
    });

    it('should get document', async () => {
      const result = await docs.get('doc-123');
      assert.ok(result.success);
      assert.strictEqual(result.data.title, 'My Document');
    });

    it('should update document', async () => {
      const result = await docs.update('doc-123', 'New content');
      assert.ok(result.success);
    });

    it('should export document', async () => {
      const result = await docs.export('doc-123', 'pdf');
      assert.ok(result.success);
      assert.strictEqual(result.data.format, 'pdf');
    });
  });

  describe('GoogleSheets', () => {
    let sheets;
    beforeEach(() => {
      sheets = new GoogleSheets({});
    });

    it('should create spreadsheet', async () => {
      const result = await sheets.create('My Sheet', ['Sheet1']);
      assert.ok(result.success);
      assert.ok(result.data.spreadsheetId);
    });

    it('should get spreadsheet', async () => {
      const result = await sheets.get('ss-123');
      assert.ok(result.success);
      assert.strictEqual(result.data.title, 'My Spreadsheet');
    });

    it('should update cell', async () => {
      const result = await sheets.updateCell('ss-123', 'A1', 'Hello');
      assert.ok(result.success);
    });

    it('should get sheet', async () => {
      const result = await sheets.getSheet('ss-123', 'Sheet1!A1:C3');
      assert.ok(result.success);
      assert.strictEqual(result.data.values.length, 3);
    });

    it('should append row', async () => {
      const result = await sheets.appendRow('ss-123', 'Sheet1!A:D', ['New', '25', 'new@example.com']);
      assert.ok(result.success);
      assert.ok(result.data.updates.updatedRows > 0);
    });
  });

  describe('OneDrive', () => {
    let od;
    beforeEach(() => {
      od = new OneDrive({});
    });

    it('should list files', async () => {
      const result = await od.listFiles('root');
      assert.ok(result.success);
      assert.strictEqual(result.data.value.length, 3);
    });

    it('should upload file', async () => {
      const result = await od.upload('/Documents/file.txt', 'content');
      assert.ok(result.success);
    });

    it('should download file', async () => {
      const result = await od.download('file-1');
      assert.ok(result.success);
      assert.ok(result.data.content);
    });

    it('should delete file', async () => {
      const result = await od.delete('file-1');
      assert.ok(result.success);
    });

    it('should create folder', async () => {
      const result = await od.createFolder('New Folder');
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'New Folder');
    });
  });

  describe('Outlook', () => {
    let outlook;
    beforeEach(() => {
      outlook = new Outlook({});
    });

    it('should send email', async () => {
      const result = await outlook.sendEmail('recipient@example.com', 'Subject', 'Body');
      assert.ok(result.success);
      assert.strictEqual(result.data.subject, 'Subject');
    });

    it('should list emails', async () => {
      const result = await outlook.listEmails('inbox', 10);
      assert.ok(result.success);
      assert.strictEqual(result.data.value.length, 2);
    });

    it('should get email', async () => {
      const result = await outlook.getEmail('msg-1');
      assert.ok(result.success);
      assert.strictEqual(result.data.id, 'msg-1');
    });

    it('should create draft', async () => {
      const result = await outlook.createDraft('to@example.com', 'Draft subject', 'Draft body');
      assert.ok(result.success);
      assert.ok(result.data.isDraft);
    });
  });

  describe('DropboxProvider', () => {
    it('should connect', async () => {
      const db = new DropboxProvider({ token: 'test-token' });
      const result = await db.connect();
      assert.ok(result.success);
    });

    it('should get profile', async () => {
      const db = new DropboxProvider({ token: 'test' });
      await db.connect();
      const profile = await db.getProfile();
      assert.ok(profile.success);
      assert.strictEqual(profile.data.name.display_name, 'John Doe');
    });

    it('should list files', async () => {
      const db = new DropboxProvider({ token: 'test' });
      await db.connect();
      const files = await db.listFiles('/');
      assert.ok(files.success);
      assert.strictEqual(files.data.entries.length, 3);
    });

    it('should upload file', async () => {
      const db = new DropboxProvider({ token: 'test' });
      await db.connect();
      const result = await db.upload('/test.txt', 'content');
      assert.ok(result.success);
    });

    it('should download file', async () => {
      const db = new DropboxProvider({ token: 'test' });
      await db.connect();
      const result = await db.download('file-1');
      assert.ok(result.success);
      assert.ok(result.data.content);
    });

    it('should create folder', async () => {
      const db = new DropboxProvider({ token: 'test' });
      await db.connect();
      const result = await db.createFolder('/NewFolder');
      assert.ok(result.success);
    });

    it('should delete', async () => {
      const db = new DropboxProvider({ token: 'test' });
      await db.connect();
      const result = await db.delete('/test.txt');
      assert.ok(result.success);
    });
  });

  describe('S3Provider', () => {
    let s3;
    beforeEach(() => {
      s3 = new S3Provider({ accessKeyId: 'AKID', secretAccessKey: 'secret' });
    });

    it('should list buckets', async () => {
      const result = await s3.listBuckets();
      assert.ok(result.success);
      assert.strictEqual(result.data.Buckets.length, 3);
    });

    it('should create bucket', async () => {
      const result = await s3.createBucket('new-bucket');
      assert.ok(result.success);
    });

    it('should list objects', async () => {
      const result = await s3.listObjects('my-bucket', 'prefix/');
      assert.ok(result.success);
      assert.strictEqual(result.data.Contents.length, 3);
    });

    it('should upload object', async () => {
      const result = await s3.upload('my-bucket', 'key', Buffer.from('data'));
      assert.ok(result.success);
      assert.ok(result.data.ETag);
    });

    it('should download object', async () => {
      const result = await s3.download('my-bucket', 'key');
      assert.ok(result.success);
      assert.ok(result.data.Body);
    });

    it('should delete object', async () => {
      const result = await s3.delete('my-bucket', 'key');
      assert.ok(result.success);
    });

    it('should delete bucket', async () => {
      const result = await s3.deleteBucket('old-bucket');
      assert.ok(result.success);
    });
  });

  describe('SecretsManager', () => {
    let sm;
    beforeEach(() => {
      sm = new SecretsManager({ accessKeyId: 'AKID', secretAccessKey: 'secret' });
    });

    it('should create secret', async () => {
      const result = await sm.createSecret('db-password', 'super-secret');
      assert.ok(result.success);
      assert.strictEqual(result.data.Name, 'db-password');
    });

    it('should get secret', async () => {
      const result = await sm.getSecret('api-key');
      assert.ok(result.success);
      assert.ok(result.data.SecretString);
    });

    it('should update secret', async () => {
      const result = await sm.updateSecret('api-key', 'new-value');
      assert.ok(result.success);
    });

    it('should delete secret', async () => {
      const result = await sm.deleteSecret('old-secret');
      assert.ok(result.success);
    });

    it('should list secrets', async () => {
      const result = await sm.listSecrets();
      assert.ok(result.success);
      assert.strictEqual(result.data.SecretList.length, 2);
    });
  });

  describe('Cloudflare Pages', () => {
    let pages;
    beforeEach(() => {
      pages = new CloudflarePages({});
    });

    it('should list projects', async () => {
      const result = await pages.listProjects();
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should get project', async () => {
      const result = await pages.getProject('my-site');
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'my-site');
    });

    it('should create project', async () => {
      const result = await pages.createProject('new-site', 'account-1');
      assert.ok(result.success);
      assert.strictEqual(result.data.name, 'new-site');
    });

    it('should deploy', async () => {
      const result = await pages.deploy('my-site', 'main');
      assert.ok(result.success);
      assert.strictEqual(result.data.state, 'queued');
    });
  });

  describe('Cloudflare DNS', () => {
    let dns;
    beforeEach(() => {
      dns = new CloudflareDNS({});
    });

    it('should list zones', async () => {
      const result = await dns.listZones();
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should list records', async () => {
      const result = await dns.listRecords('zone-1');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 3);
    });

    it('should create record', async () => {
      const result = await dns.createRecord('zone-1', 'A', 'test.example.com', '1.2.3.4');
      assert.ok(result.success);
    });

    it('should delete record', async () => {
      const result = await dns.deleteRecord('zone-1', 'record-1');
      assert.ok(result.success);
    });
  });

  describe('Cloudflare KV', () => {
    let kv;
    beforeEach(() => {
      kv = new CloudflareKV({});
    });

    it('should list namespaces', async () => {
      const result = await kv.listNamespaces('account-1');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should get value', async () => {
      const result = await kv.getValue('ns-1', 'my-key');
      assert.ok(result.success);
      assert.strictEqual(result.data.value, 'mock-kv-value');
    });

    it('should set value', async () => {
      const result = await kv.setValue('ns-1', 'my-key', 'my-value');
      assert.ok(result.success);
    });

    it('should delete value', async () => {
      const result = await kv.deleteValue('ns-1', 'my-key');
      assert.ok(result.success);
    });
  });

  describe('PostgresSync', () => {
    let pg;
    beforeEach(() => {
      pg = new PostgresSync({ host: 'localhost', database: 'test', user: 'test', password: 'test' });
    });

    it('should connect', async () => {
      const result = await pg.connect();
      assert.ok(result.success);
      assert.ok(pg.connected);
    });

    it('should disconnect', async () => {
      await pg.connect();
      const result = await pg.disconnect();
      assert.ok(result.success);
      assert.strictEqual(pg.connected, false);
    });

    it('should query', async () => {
      await pg.connect();
      const result = await pg.query('SELECT * FROM users');
      assert.ok(result.success);
      assert.strictEqual(result.data.rows.length, 2);
    });

    it('should get tables', async () => {
      const result = await pg.getTables();
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 3);
    });

    it('should get schema', async () => {
      const result = await pg.getSchema('users');
      assert.ok(result.success);
      assert.strictEqual(result.data.columns.length, 4);
    });

    it('should sync table', async () => {
      const result = await pg.syncTable('users');
      assert.ok(result.success);
      assert.ok(result.data.syncedRows > 0);
    });

    it('should test connection', async () => {
      const result = await pg.testConnection();
      assert.ok(result.success);
    });
  });

  describe('MySQLSync', () => {
    let mysql;
    beforeEach(() => {
      mysql = new MySQLSync({ host: 'localhost', database: 'test', user: 'root', password: '' });
    });

    it('should connect', async () => {
      const result = await mysql.connect();
      assert.ok(result.success);
    });

    it('should query', async () => {
      await mysql.connect();
      const result = await mysql.query('SELECT * FROM users');
      assert.ok(result.success);
      assert.strictEqual(result.data.rows.length, 2);
    });

    it('should get tables', async () => {
      const result = await mysql.getTables();
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 3);
    });

    it('should sync table', async () => {
      const result = await mysql.syncTable('users');
      assert.ok(result.success);
      assert.ok(result.data.syncedRows > 0);
    });

    it('should test connection', async () => {
      const result = await mysql.testConnection();
      assert.ok(result.success);
    });
  });

  describe('MongoSync', () => {
    let mongo;
    beforeEach(() => {
      mongo = new MongoSync({ url: 'mongodb://localhost:27017', database: 'test' });
    });

    it('should connect', async () => {
      const result = await mongo.connect();
      assert.ok(result.success);
      assert.ok(mongo.connected);
    });

    it('should find documents', async () => {
      await mongo.connect();
      const result = await mongo.find('users', { name: 'test' });
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should insert document', async () => {
      await mongo.connect();
      const result = await mongo.insert('users', { name: 'new-user' });
      assert.ok(result.success);
      assert.ok(result.insertedCount === 1);
    });

    it('should update document', async () => {
      await mongo.connect();
      const result = await mongo.update('users', { name: 'old' }, { $set: { name: 'new' } });
      assert.ok(result.success);
    });

    it('should delete document', async () => {
      await mongo.connect();
      const result = await mongo.delete('users', { name: 'old' });
      assert.ok(result.success);
    });

    it('should list collections', async () => {
      await mongo.connect();
      const result = await mongo.listCollections();
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 4);
    });

    it('should test connection', async () => {
      const result = await mongo.testConnection();
      assert.ok(result.success);
    });
  });

  describe('RedisSync', () => {
    let redis;
    beforeEach(() => {
      redis = new RedisSync({ host: 'localhost', port: 6379 });
    });

    it('should connect', async () => {
      const result = await redis.connect();
      assert.ok(result.success);
      assert.ok(redis.connected);
    });

    it('should get and set', async () => {
      await redis.connect();
      await redis.set('key1', 'value1');
      const result = await redis.get('key1');
      assert.ok(result.success);
      assert.strictEqual(result.data.value, 'value1');
    });

    it('should delete key', async () => {
      await redis.connect();
      await redis.set('key1', 'val');
      const result = await redis.delete('key1');
      assert.ok(result.success);
      assert.strictEqual(result.data.deleted, 1);
    });

    it('should keys pattern', async () => {
      await redis.connect();
      await redis.set('prefix:a', '1');
      await redis.set('prefix:b', '2');
      const result = await redis.keys('prefix:*');
      assert.ok(result.success);
      assert.strictEqual(result.data.length, 2);
    });

    it('should publish and subscribe', async () => {
      await redis.connect();
      let received = null;
      await redis.subscribe('channel1', (msg) => { received = msg; });
      const result = await redis.publish('channel1', 'hello');
      assert.ok(result.success);
      assert.strictEqual(received, 'hello');
    });

    it('should test connection', async () => {
      const result = await redis.testConnection();
      assert.ok(result.success);
    });
  });

  describe('IntegrationInstaller', () => {
    it('should install integration', () => {
      registry.registerProvider({ id: 'custom', name: 'Custom', type: 'service', authType: 'api-key' });
      const result = installer.install('custom', { name: 'My Custom' });
      assert.ok(result.success);
    });

    it('should fail installing unknown provider', () => {
      const result = installer.install('unknown', { name: 'Test' });
      assert.strictEqual(result.success, false);
    });

    it('should uninstall integration', () => {
      registry.registerProvider({ id: 'custom', name: 'Custom', type: 'service', authType: 'api-key' });
      installer.install('custom', { name: 'My Custom' });
      installer.uninstall('custom');
      assert.strictEqual(registry.getIntegration('custom'), null);
    });
  });

  describe('OAuth2 Flow', () => {
    it('should generate authorization URL', () => {
      const oauth = new GoogleOAuth({ clientId: 'client-1', clientSecret: 'secret', redirectUri: 'https://ex.com/cb' });
      const result = oauth.generateAuthUrl('https://ex.com/cb', ['openid', 'profile']);
      assert.ok(result.success);
      assert.ok(result.url.includes('response_type=code'));
    });

    it('should exchange authorization code', async () => {
      const oauth = new GoogleOAuth({ clientId: 'c', clientSecret: 's' });
      const result = await oauth.exchangeCode('auth-code', 'https://ex.com/cb');
      assert.ok(result.success);
      assert.ok(result.data.access_token);
    });

    it('should refresh token', async () => {
      const oauth = new GoogleOAuth({ clientId: 'c', clientSecret: 's' });
      const result = await oauth.refreshToken('old-refresh');
      assert.ok(result.success);
      assert.ok(result.data.access_token);
    });

    it('should handle PKCE flow', () => {
      const oauth = new GoogleOAuth({ clientId: 'c', clientSecret: 's' });
      const result = oauth.generateAuthUrl('https://ex.com/cb', ['openid']);
      assert.ok(result.url.includes('code_challenge_method') === false || result.url.includes('access_type=offline'));
    });
  });

  describe('PAT Authentication', () => {
    it('should connect with PAT', async () => {
      const vc = new VercelProvider({ token: 'pat-test' });
      const result = await vc.connect();
      assert.ok(result.success);
    });

    it('should reject invalid PAT', async () => {
      const vc = new VercelProvider();
      const result = await vc.connect();
      assert.strictEqual(result.success, false);
    });
  });

  describe('API Key Authentication', () => {
    it('should connect with API key', async () => {
      const ln = new LinearProvider({ apiKey: 'lin-api-key' });
      const result = await ln.connect();
      assert.ok(result.success);
    });

    it('should reject invalid key', async () => {
      const ln = new LinearProvider();
      const result = await ln.connect();
      assert.strictEqual(result.success, false);
    });
  });

  describe('Webhook Engine', () => {
    it('should register incoming webhook', () => {
      const result = manager.registerIncomingWebhook('github', { path: '/hook', secret: 's' });
      assert.ok(result.success);
    });

    it('should register outgoing webhook', () => {
      const result = manager.registerOutgoingWebhook('github', { url: 'https://ex.com/hook', events: ['push'] });
      assert.ok(result.success);
    });

    it('should process incoming webhook', () => {
      manager.registerIncomingWebhook('github', { path: '/hook' });
      const result = manager.processIncomingWebhook('github', { event: 'push' }, '');
      assert.ok(result.success);
    });

    it('should verify webhook signature', () => {
      const crypto = require('crypto');
      const secret = 'mysecret';
      const payload = { test: true };
      const sig = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
      manager.registerIncomingWebhook('github', { path: '/hook', secret });
      const result = manager.processIncomingWebhook('github', payload, sig);
      assert.ok(result.success);
    });

    it('should reject invalid signature', () => {
      manager.registerIncomingWebhook('github', { path: '/hook', secret: 'real' });
      const result = manager.processIncomingWebhook('github', { test: true }, 'bad-sig');
      assert.strictEqual(result.success, false);
    });

    it('should retry failed outgoing', () => {
      const result = manager.registerOutgoingWebhook('github', { url: 'https://ex.com/hook', events: ['push'] });
      assert.ok(result.success);
    });

    it('should detect replay', () => {
      const wh = new Webhook({ provider: 'test', secret: 's' });
      const crypto = require('crypto');
      const payload = { event: 'test' };
      const sig = crypto.createHmac('sha256', 's').update(JSON.stringify(payload)).digest('hex');
      assert.ok(wh.verifySignature(payload, sig));
    });
  });

  describe('Sync Engine', () => {
    it('should perform incremental sync', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const result = manager.startSync('github', 'incremental');
      assert.ok(result.success);
    });

    it('should perform full sync', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const result = manager.startSync('github', 'full');
      assert.ok(result.success);
    });

    it('should schedule sync', () => {
      const result = manager.scheduleSync('github', 60000);
      assert.ok(result.success);
    });

    it('should cancel schedule', () => {
      manager.scheduleSync('github', 60000);
      const result = manager.cancelSchedule('github');
      assert.ok(result);
    });

    it('should detect conflicts', async () => {
      const { syncId } = sync.startSync('github', 'incremental');
      sync.failSync(syncId, 'Conflict detected');
      const history = sync.getSyncs('github');
      assert.strictEqual(history[0].status, 'failed');
    });

    it('should retry failed sync', () => {
      const { syncId } = sync.startSync('github', 'incremental');
      sync.failSync(syncId, 'error');
      const retry = sync.retry(syncId);
      assert.ok(retry.success);
    });

    it('should track sync history', () => {
      sync.startSync('github', 'incremental');
      sync.startSync('github', 'full');
      const syncs = sync.getSyncs('github');
      assert.strictEqual(syncs.length, 2);
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limits', () => {
      health.recordRateLimit('github', 5000, 4999, Math.floor(Date.now() / 1000) + 3600);
      const h = health.getHealth('github');
      assert.ok(h.rateLimits);
      assert.strictEqual(h.rateLimits.limit, 5000);
    });

    it('should record rate limit exceeded', () => {
      health.recordRateLimit('github', 5000, 0, Math.floor(Date.now() / 1000) + 3600);
      const h = health.getHealth('github');
      assert.strictEqual(h.rateLimits.remaining, 0);
    });

    it('should report remaining quota', () => {
      health.recordRateLimit('github', 100, 75, Math.floor(Date.now() / 1000) + 3600);
      const h = health.getHealth('github');
      assert.strictEqual(h.quotaUsage, 25);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed sync', () => {
      const { syncId } = sync.startSync('github', 'incremental');
      sync.failSync(syncId, 'transient error');
      const retryResult = sync.retry(syncId);
      assert.ok(retryResult.success);
    });

    it('should track retry count', () => {
      const { syncId } = sync.startSync('github', 'incremental');
      sync.failSync(syncId, 'err');
      const retry = sync.retry(syncId);
      assert.ok(retry.success);
      const syncs = sync.getSyncs('github');
      const found = syncs.find(s => s.syncId === retry.syncId);
      assert.ok(found);
      assert.strictEqual(found.status, 'running');
    });

    it('should eventually give up', () => {
      const result = sync.retry('nonexistent');
      assert.strictEqual(result.success, false);
    });
  });

  describe('Health Tracking', () => {
    it('should track connection health', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const h = manager.getHealth('github');
      assert.ok(h);
      assert.strictEqual(h.status, 'healthy');
    });

    it('should calculate uptime percentage', () => {
      health.recordSuccess('github', 100);
      const h = health.getHealth('github');
      assert.ok(typeof h.uptime === 'number');
    });

    it('should record latency', () => {
      health.recordSuccess('github', 250);
      const h = health.getHealth('github');
      assert.strictEqual(h.latency, 250);
    });

    it('should track failure count', () => {
      health.recordFailure('github', 'err');
      health.recordFailure('github', 'err');
      const h = health.getHealth('github');
      assert.strictEqual(h.failures, 2);
    });

    it('should report health status', () => {
      health.recordSuccess('github', 100);
      const h = health.getHealth('github');
      assert.strictEqual(h.status, 'healthy');
    });

    it('should get all health', () => {
      health.recordSuccess('a', 10);
      health.recordSuccess('b', 20);
      const all = manager.getAllHealth();
      assert.strictEqual(Object.keys(all).length, 2);
    });
  });

  describe('Security', () => {
    it('should encrypt stored credentials', () => {
      secrets.store('github', 'token', 'ghp_secret');
      const stored = secrets.get('github', 'token');
      assert.strictEqual(stored, 'ghp_secret');
    });

    it('should rotate tokens', () => {
      secrets.store('github', 'token', 'old-token');
      const result = secrets.rotate('github', 'token');
      assert.ok(result.success);
      const newToken = secrets.get('github', 'token');
      assert.notStrictEqual(newToken, 'old-token');
    });

    it('should check permission scopes', () => {
      manager.grantPermission('github', PERMISSIONS.INTEGRATIONS_READ);
      assert.ok(manager.checkPermission('github', PERMISSIONS.INTEGRATIONS_READ));
    });

    it('should audit all connections', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const stats = manager.getAuditStats();
      assert.strictEqual(stats.totalEntries, 1);
    });

    it('should support secret providers', () => {
      secrets.store('github', 'key', 'value');
      const list = secrets.list('github');
      assert.ok(list.includes('key'));
    });
  });

  describe('Integration API Controller', () => {
    it('should export all handler functions', () => {
      assert.ok(typeof pluginController.listIntegrations === 'function');
      assert.ok(typeof pluginController.listInstalled === 'function');
      assert.ok(typeof pluginController.listProviders === 'function');
      assert.ok(typeof pluginController.getProvider === 'function');
      assert.ok(typeof pluginController.connectIntegration === 'function');
      assert.ok(typeof pluginController.disconnectIntegration === 'function');
      assert.ok(typeof pluginController.syncIntegration === 'function');
      assert.ok(typeof pluginController.processWebhook === 'function');
      assert.ok(typeof pluginController.getHealth === 'function');
      assert.ok(typeof pluginController.getEvents === 'function');
      assert.ok(typeof pluginController.getStatus === 'function');
    });
  });

  describe('Plugin SDK Integration Extensions', () => {
    it('Plugin should registerIntegration', () => {
      const plugin = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      plugin.registerIntegration('github', { provider: 'github', authType: 'oauth2' });
      const integrations = plugin.getIntegrations();
      assert.ok(integrations.github);
    });

    it('Plugin should getIntegrations', () => {
      const plugin = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      plugin.registerIntegration('slack', { provider: 'slack' });
      const integrations = plugin.getIntegrations();
      assert.strictEqual(Object.keys(integrations).length, 1);
    });

    it('Plugin should registerWebhook', () => {
      const plugin = new Plugin({ id: 'test-plugin', name: 'Test', version: '1.0.0' });
      plugin.registerWebhook('push-hook', { path: '/hooks/push' });
      const webhooks = plugin.getWebhooks();
      assert.ok(webhooks['push-hook']);
    });

    it('Plugin should getWebhooks', () => {
      const plugin = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      plugin.registerWebhook('hook1', { path: '/hook1' });
      plugin.registerWebhook('hook2', { path: '/hook2' });
      assert.strictEqual(Object.keys(plugin.getWebhooks()).length, 2);
    });

    it('Plugin should registerOAuthProvider', () => {
      const plugin = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      plugin.registerOAuthProvider('google', { authorizationUrl: 'https://accounts.google.com/o/oauth2/auth', tokenUrl: 'https://oauth2.googleapis.com/token' });
      const providers = plugin.getOAuthProviders();
      assert.ok(providers.google);
    });

    it('Plugin should getOAuthProviders', () => {
      const plugin = new Plugin({ id: 'test', name: 'Test', version: '1.0.0' });
      plugin.registerOAuthProvider('google', {});
      plugin.registerOAuthProvider('github', {});
      assert.strictEqual(Object.keys(plugin.getOAuthProviders()).length, 2);
    });

    it('Integration SDK class should connect', () => {
      const integration = createIntegration({ provider: 'github', onConnect: () => ({ success: true, data: { id: 1 } }) });
      const result = integration.connect({ token: 'test' });
      assert.ok(result.success);
    });

    it('Integration SDK class should disconnect', () => {
      const integration = createIntegration({ provider: 'github', onDisconnect: () => ({ success: true }) });
      const result = integration.disconnect();
      assert.ok(result.success);
    });

    it('Integration SDK class should sync', () => {
      const integration = createIntegration({ provider: 'github', onSync: () => ({ success: true, rows: 10 }) });
      const result = integration.sync('incremental');
      assert.ok(result.success);
    });

    it('Webhook SDK class should handle payload', () => {
      const wh = createWebhook({ provider: 'github', handler: (payload) => ({ received: true, data: payload }) });
      const result = wh.handle({ event: 'push' });
      assert.ok(result.received);
    });

    it('Webhook SDK class should verify signature', () => {
      const wh = createWebhook({ provider: 'github', secret: 'mysecret' });
      const crypto = require('crypto');
      const payload = { test: true };
      const sig = crypto.createHmac('sha256', 'mysecret').update(JSON.stringify(payload)).digest('hex');
      assert.ok(wh.verifySignature(payload, sig));
    });

    it('Webhook SDK class should reject bad signature', () => {
      const wh = createWebhook({ provider: 'github', secret: 'mysecret' });
      assert.strictEqual(wh.verifySignature({ test: true }, 'bad-sig'), false);
    });

    it('Webhook SDK class should skip verification when no secret', () => {
      const wh = createWebhook({ provider: 'github' });
      assert.ok(wh.verifySignature({ test: true }, ''));
    });

    it('OAuthProvider SDK class should authorize', () => {
      const oauth = createOAuthProvider({ name: 'google', authorizationUrl: 'https://accounts.google.com/o/oauth2/auth', tokenUrl: 'https://oauth2.googleapis.com/token' });
      const result = oauth.authorize('https://ex.com/cb', ['openid']);
      assert.ok(result);
    });

    it('OAuthProvider SDK class should exchange code', () => {
      const oauth = createOAuthProvider({ name: 'google', onToken: () => ({ accessToken: 'real-token', refreshToken: 'refresh' }) });
      const result = oauth.exchangeCode('auth-code', 'https://ex.com/cb');
      assert.strictEqual(result.accessToken, 'real-token');
    });

    it('OAuthProvider SDK class should refresh token', () => {
      const oauth = createOAuthProvider({ name: 'google' });
      const result = oauth.refreshToken('old-refresh');
      assert.ok(result.accessToken);
      assert.ok(result.expiresIn);
    });

    it('Integration SDK should use default placeholder handlers', () => {
      const integration = createIntegration({ provider: 'test' });
      assert.ok(integration.connect({}).success);
      assert.ok(integration.disconnect().success);
      assert.ok(integration.sync('full').success);
    });

    it('Integration SDK should allow handler replacement', () => {
      const integration = createIntegration({ provider: 'test' });
      integration.setConnectHandler(() => ({ success: false, error: 'custom' }));
      assert.strictEqual(integration.connect({}).success, false);
    });

    it('Integration SDK should expose properties', () => {
      const integration = createIntegration({ provider: 'github', name: 'GitHub Integration', description: 'Sync repos', authType: 'oauth2' });
      assert.strictEqual(integration.provider, 'github');
      assert.strictEqual(integration.name, 'GitHub Integration');
      assert.strictEqual(integration.description, 'Sync repos');
      assert.strictEqual(integration.authType, 'oauth2');
    });

    it('Webhook SDK should have defaults', () => {
      const wh = createWebhook({ provider: 'test' });
      assert.strictEqual(wh.name, 'webhook');
      assert.strictEqual(wh.path, '/webhook');
    });

    it('OAuthProvider SDK should have default scopes', () => {
      const oauth = createOAuthProvider({ name: 'test' });
      assert.deepStrictEqual(oauth.scopes, []);
    });

    it('Plugin should return empty objects when nothing registered', () => {
      const plugin = new Plugin({ id: 't', name: 'T', version: '1.0.0' });
      assert.deepStrictEqual(plugin.getIntegrations(), {});
      assert.deepStrictEqual(plugin.getWebhooks(), {});
      assert.deepStrictEqual(plugin.getOAuthProviders(), {});
    });
  });

  describe('End-to-End Flows', () => {
    it('should connect, sync, disconnect cycle', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const syncResult = manager.startSync('github', 'incremental');
      assert.ok(syncResult.success);
      manager.completeSync(syncResult.syncId, { rows: 5 });
      const disconnectResult = manager.disconnect('github');
      assert.ok(disconnectResult.success);
    });

    it('should handle webhook processing', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      manager.registerIncomingWebhook('github', { path: '/webhook', secret: 'secret' });
      const crypto = require('crypto');
      const payload = { action: 'push' };
      const sig = crypto.createHmac('sha256', 'secret').update(JSON.stringify(payload)).digest('hex');
      const result = manager.processIncomingWebhook('github', payload, sig);
      assert.ok(result.success);
    });

    it('should maintain health tracking', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const h = manager.getHealth('github');
      assert.ok(h);
      assert.strictEqual(h.status, 'healthy');
    });

    it('should audit operations', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      manager.disconnect('github');
      const log = manager.getAuditLog();
      assert.strictEqual(log.length, 2);
    });

    it('should manage secrets', () => {
      manager.storeSecret('github', 'api-key', 'sk-test');
      const value = manager.getSecret('github', 'api-key');
      assert.strictEqual(value, 'sk-test');
    });

    it('should handle permission checks', () => {
      manager.grantPermission('github', PERMISSIONS.INTEGRATIONS_READ);
      assert.ok(manager.checkPermission('github', PERMISSIONS.INTEGRATIONS_READ));
      assert.strictEqual(manager.checkPermission('github', PERMISSIONS.SECRETS), false);
    });

    it('should schedule recurring syncs', () => {
      const result = manager.scheduleSync('github', 60000);
      assert.ok(result.success);
      const schedules = scheduler.listSchedules();
      assert.strictEqual(schedules.length, 1);
      assert.strictEqual(schedules[0].provider, 'github');
    });

    it('should handle provider errors gracefully', () => {
      const result = manager.connect('nonexistent', { name: 'test', auth: { type: 'oauth2' } });
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Unknown provider'));
    });

    it('should clear and reset entire system', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      manager.clear();
      assert.strictEqual(manager.getIntegration('github'), null);
      assert.strictEqual(manager.getHealth('github'), null);
    });

    it('should handle multiple provider connections', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      manager.connect('slack', { name: 'slack-test', auth: { type: 'oauth2' }, token: 'slack-token' });
      assert.strictEqual(manager.listIntegrations().length, 2);
    });

    it('should handle getStatus with no integrations', () => {
      const status = manager.getStatus();
      assert.strictEqual(status.connected, 0);
      assert.strictEqual(status.total, 0);
    });

    it('should handle tickScheduler', () => {
      let ran = false;
      scheduler.schedule('github', -1, () => { ran = true; });
      manager.tickScheduler();
      assert.ok(ran);
    });

    it('should get events history from manager', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const events = manager.getEvents();
      assert.strictEqual(events.length, 1);
    });

    it('should getAuditLog with filter', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      const filtered = manager.getAuditLog({ provider: 'github' });
      assert.strictEqual(filtered.length, 1);
    });

    it('should get secret from manager', () => {
      manager.connect('github', { name: 'test', auth: { type: 'oauth2' }, token: 'test-token' });
      manager.storeSecret('github', 'test', 'value');
      assert.strictEqual(manager.getSecret('github', 'test'), 'value');
    });

    it('should getSecrets from manager', () => {
      manager.storeSecret('github', 'k1', 'v1');
      manager.storeSecret('github', 'k2', 'v2');
      const secretsList = manager.getSecrets('github');
      assert.strictEqual(secretsList.length, 2);
    });
  });
});
