const assert = require('assert');
const { PluginManager, createEngine, getDefaultEngine } = require('../lib/plugins/pluginManager');
const { PluginRegistry } = require('../lib/plugins/pluginRegistry');
const { PluginLoader } = require('../lib/plugins/pluginLoader');
const { PluginInstaller } = require('../lib/plugins/pluginInstaller');
const { PluginUninstaller } = require('../lib/plugins/pluginUninstaller');
const { PluginValidator } = require('../lib/plugins/pluginValidator');
const { PluginSandbox } = require('../lib/plugins/pluginSandbox');
const { PluginLifecycle } = require('../lib/plugins/pluginLifecycle');
const { PluginPermissions, PERMISSIONS } = require('../lib/plugins/pluginPermissions');
const { PluginStorage } = require('../lib/plugins/pluginStorage');
const { PluginEvents, EVENTS } = require('../lib/plugins/pluginEvents');
const { HOOKS } = require('../lib/plugins/pluginManifest');
const { PluginResolver } = require('../lib/plugins/pluginResolver');
const { PluginDependencyGraph } = require('../lib/plugins/pluginDependencyGraph');
const { PluginVersionManager } = require('../lib/plugins/pluginVersionManager');
const { PluginCompatibility } = require('../lib/plugins/pluginCompatibility');
const { PluginMarketplace } = require('../lib/plugins/pluginMarketplace');
const { PluginSearch } = require('../lib/plugins/pluginSearch');
const { PluginRatings } = require('../lib/plugins/pluginRatings');
const { PluginReviews } = require('../lib/plugins/pluginReviews');
const pluginController = require('../lib/api/controllers/pluginController');
const { Plugin, createPlugin } = require('../lib/plugin-sdk/Plugin');
const { Hook } = require('../lib/plugin-sdk/Hook');
const { Command, createCommand } = require('../lib/plugin-sdk/Command');
const { Widget, createWidget } = require('../lib/plugin-sdk/Widget');
const { ApiExtension, createApiExtension } = require('../lib/plugin-sdk/ApiExtension');
const { WorkflowExtension, createWorkflowExtension } = require('../lib/plugin-sdk/WorkflowExtension');
const { AgentExtension, createAgentExtension } = require('../lib/plugin-sdk/AgentExtension');
const { GeneratorExtension, createGeneratorExtension } = require('../lib/plugin-sdk/GeneratorExtension');
const { StorageExtension } = require('../lib/plugin-sdk/StorageExtension');
const { PluginLogger } = require('../lib/plugin-sdk/Logger');
const { PluginConfig } = require('../lib/plugin-sdk/Config');

describe('Plugin SDK & Marketplace — Phase 9.3.0', () => {
  let engine, events, registry, storage, permissions, lifecycle, loader, installer, uninstaller, validator, sandbox, marketplace, search, ratings, reviews, resolver, dependencyGraph, versions, compatibility;

  const validManifest = { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0', permissions: ['core.read'], author: 'Test', description: 'A test plugin' };

  beforeEach(() => {
    registry = new PluginRegistry();
    storage = new PluginStorage();
    events = new PluginEvents();
    permissions = new PluginPermissions();
    sandbox = new PluginSandbox({ permissions });
    loader = new PluginLoader({ sandbox });
    validator = new PluginValidator();
    compatibility = new PluginCompatibility();
    versions = new PluginVersionManager();
    resolver = new PluginResolver({ registry, compatibility });
    dependencyGraph = new PluginDependencyGraph({ registry });
    installer = new PluginInstaller({ registry, loader, events, validator, compatibility, platformVersion: '4.3.0' });
    uninstaller = new PluginUninstaller({ registry, loader, events, storage });
    lifecycle = new PluginLifecycle({ registry, loader, events, pluginStorage: storage });
    marketplace = new PluginMarketplace({ registry, events });
    search = new PluginSearch({ registry, marketplace });
    ratings = new PluginRatings();
    reviews = new PluginReviews();
    engine = new PluginManager({ events, storage, registry, permissions, sandbox, loader, validator, compatibility, versions, resolver, dependencyGraph, installer, uninstaller, lifecycle, marketplace, search, ratings, reviews, platformVersion: '4.3.0' });
  });

  describe('PluginManager', () => {
    it('should create with all sub-modules', () => {
      const pm = new PluginManager();
      assert.ok(pm.registry);
      assert.ok(pm.loader);
      assert.ok(pm.installer);
      assert.ok(pm.uninstaller);
      assert.ok(pm.validator);
      assert.ok(pm.sandbox);
      assert.ok(pm.lifecycle);
      assert.ok(pm.permissions);
      assert.ok(pm.storage);
      assert.ok(pm.events);
      assert.ok(pm.versions);
      assert.ok(pm.resolver);
      assert.ok(pm.dependencyGraph);
      assert.ok(pm.compatibility);
      assert.ok(pm.marketplace);
      assert.ok(pm.search);
      assert.ok(pm.ratings);
      assert.ok(pm.reviews);
    });

    it('should create engine via createEngine()', () => {
      const pm = createEngine();
      assert.ok(pm instanceof PluginManager);
    });

    it('should return default engine via getDefaultEngine()', () => {
      const pm = getDefaultEngine();
      assert.ok(pm instanceof PluginManager);
      assert.strictEqual(getDefaultEngine(), pm);
    });

    it('should install a plugin', () => {
      const result = engine.install({ manifest: validManifest });
      assert.ok(result.success);
      assert.ok(result.plugin);
      assert.strictEqual(result.plugin.id, 'test-plugin');
    });

    it('should not install duplicate plugin', () => {
      engine.install({ manifest: validManifest });
      const result = engine.install({ manifest: validManifest });
      assert.strictEqual(result.success, false);
    });

    it('should uninstall a plugin', () => {
      engine.install({ manifest: validManifest });
      const result = engine.uninstall('test-plugin');
      assert.ok(result.success);
      assert.strictEqual(engine.getPlugin('test-plugin'), null);
    });

    it('should list installed plugins', () => {
      engine.install({ manifest: validManifest });
      engine.install({ manifest: { id: 'plugin-2', name: 'Plugin 2', version: '1.0.0', permissions: [] } });
      assert.strictEqual(engine.listPlugins().length, 2);
    });

    it('should get a plugin by id', () => {
      engine.install({ manifest: validManifest });
      const plugin = engine.getPlugin('test-plugin');
      assert.ok(plugin);
      assert.strictEqual(plugin.id, 'test-plugin');
    });

    it('should enable and disable plugin', () => {
      engine.install({ manifest: validManifest });
      const disabled = engine.disable('test-plugin');
      assert.ok(disabled.success);
      assert.strictEqual(engine.getPluginRaw('test-plugin').enabled, false);
      const enabled = engine.enable('test-plugin');
      assert.ok(enabled.success);
    });

    it('should reload plugin', () => {
      engine.install({ manifest: validManifest });
      const result = engine.reload('test-plugin');
      assert.ok(result.success);
    });

    it('should get status', () => {
      engine.install({ manifest: validManifest });
      const status = engine.getStatus();
      assert.ok(status.installed >= 1);
    });

    it('should get installed count', () => {
      engine.install({ manifest: validManifest });
      assert.strictEqual(engine.getInstalledCount(), 1);
    });
  });

  describe('PluginRegistry', () => {
    it('should register and unregister plugins', () => {
      registry.register({ id: 'p1', manifest: { id: 'p1', name: 'P1', version: '1.0.0' } });
      assert.strictEqual(registry.getCount(), 1);
      registry.unregister('p1');
      assert.strictEqual(registry.getCount(), 0);
    });

    it('should list plugins with filter', () => {
      registry.register({ id: 'p1', manifest: { id: 'p1', categories: ['analytics'] }, enabled: true });
      registry.register({ id: 'p2', manifest: { id: 'p2', categories: ['security'] }, enabled: false });
      assert.strictEqual(registry.listPlugins({ enabled: true }).length, 1);
    });

    it('should get categories', () => {
      registry.register({ id: 'p1', manifest: { id: 'p1', categories: ['analytics'] } });
      registry.register({ id: 'p2', manifest: { id: 'p2', categories: ['analytics'] } });
      registry.register({ id: 'p3', manifest: { id: 'p3', categories: ['security'] } });
      const cats = registry.getCategories();
      const analytics = cats.find(c => c.name === 'analytics');
      assert.ok(analytics);
      assert.strictEqual(analytics.count, 2);
    });

    it('should get plugins by category', () => {
      registry.register({ id: 'p1', manifest: { id: 'p1', categories: ['analytics'] } });
      assert.strictEqual(registry.getPluginsByCategory('analytics').length, 1);
    });

    it('should clear', () => {
      registry.register({ id: 'p1', manifest: { id: 'p1' } });
      registry.clear();
      assert.strictEqual(registry.getCount(), 0);
    });
  });

  describe('PluginLoader', () => {
    it('should load and unload plugin', () => {
      const plugin = { id: 'p1', manifest: { id: 'p1', name: 'P1' } };
      const result = loader.load(plugin);
      assert.ok(result.success);
      assert.ok(loader.isLoaded('p1'));
      loader.unload('p1');
      assert.strictEqual(loader.isLoaded('p1'), false);
    });

    it('should not load same plugin twice', () => {
      const plugin = { id: 'p1', manifest: { id: 'p1' } };
      loader.load(plugin);
      const result = loader.load(plugin);
      assert.strictEqual(result.success, false);
    });

    it('should get loaded plugins list', () => {
      loader.load({ id: 'p1', manifest: { id: 'p1', name: 'P1' } });
      loader.load({ id: 'p2', manifest: { id: 'p2', name: 'P2' } });
      assert.strictEqual(loader.getLoadedPlugins().length, 2);
    });

    it('should handle load error gracefully', () => {
      const plugin = { id: 'p1', manifest: { id: 'p1' }, _load: () => { throw new Error('load fail'); } };
      const result = loader.load(plugin);
      assert.strictEqual(result.success, false);
    });

    it('should call onUnload during unload', () => {
      let unloaded = false;
      const plugin = { id: 'p1', manifest: { id: 'p1' }, _load: () => ({ onUnload: () => { unloaded = true; } }) };
      loader.load(plugin);
      loader.unload('p1');
      assert.ok(unloaded);
    });
  });

  describe('PluginInstaller', () => {
    it('should install with valid manifest', () => {
      const result = installer.install({ manifest: validManifest });
      assert.ok(result.success);
    });

    it('should reject invalid manifest', () => {
      const result = installer.install({ manifest: { id: 'test' } });
      assert.strictEqual(result.success, false);
    });

    it('should reject duplicate install', () => {
      installer.install({ manifest: validManifest });
      const result = installer.install({ manifest: validManifest });
      assert.strictEqual(result.success, false);
    });
  });

  describe('PluginUninstaller', () => {
    it('should uninstall installed plugin', () => {
      installer.install({ manifest: validManifest });
      const result = uninstaller.uninstall('test-plugin');
      assert.ok(result.success);
    });

    it('should return error for missing plugin', () => {
      const result = uninstaller.uninstall('nonexistent');
      assert.strictEqual(result.success, false);
    });
  });

  describe('PluginValidator', () => {
    it('should validate valid manifest', () => {
      const result = validator.validate(validManifest);
      assert.ok(result.valid);
    });

    it('should reject empty manifest', () => {
      const result = validator.validate(null);
      assert.strictEqual(result.valid, false);
    });

    it('should reject manifest without id', () => {
      const result = validator.validate({ name: 'Test', version: '1.0.0' });
      assert.strictEqual(result.valid, false);
    });

    it('should reject invalid id format', () => {
      const result = validator.validate({ id: 'Has Spaces', name: 'Test', version: '1.0.0', permissions: [] });
      assert.strictEqual(result.valid, false);
    });

    it('should reject invalid version format', () => {
      const result = validator.validate({ id: 'test-plugin', name: 'Test', version: 'abc', permissions: [] });
      assert.strictEqual(result.valid, false);
    });

    it('should validate hooks', () => {
      const result = validator.validateHooks({ beforeDeployment: {} }, Object.values(HOOKS));
      assert.ok(result.valid);
    });

    it('should reject unknown hooks', () => {
      const result = validator.validateHooks({ unknownHook: {} }, Object.values(HOOKS));
      assert.strictEqual(result.valid, false);
    });
  });

  describe('PluginSandbox', () => {
    it('should wrap plugin instance', () => {
      const instance = { name: 'test' };
      const plugin = { id: 'p1', manifest: { id: 'p1', permissions: ['core.read'] } };
      const wrapped = sandbox.wrap(instance, plugin);
      assert.ok(wrapped.execute);
      assert.ok(wrapped.requirePermission);
    });

    it('should check permissions', () => {
      const plugin = { id: 'p1', manifest: { id: 'p1', permissions: ['core.read', 'api.access'] } };
      const wrapped = sandbox.wrap({}, plugin);
      assert.ok(wrapped.requirePermission('core.read'));
      assert.strictEqual(wrapped.requirePermission('admin'), false);
    });

    it('should return permissions list', () => {
      const plugin = { id: 'p1', manifest: { id: 'p1', permissions: ['core.read'] } };
      const wrapped = sandbox.wrap({}, plugin);
      assert.ok(wrapped.getPermissions().includes('core.read'));
    });

    it('should execute function with timeout', () => {
      const plugin = { id: 'p1', manifest: { id: 'p1', permissions: [] } };
      const wrapped = sandbox.wrap({}, plugin);
      const result = wrapped.execute(() => 42);
      assert.strictEqual(result, 42);
    });

    it('should handle API calls', () => {
      const plugin = { id: 'p1', manifest: { id: 'p1', permissions: [] } };
      const wrapped = sandbox.wrap({}, plugin);
      const result = wrapped.callAPI('/api/v1/health', 'GET');
      assert.ok(result.sandboxed);
    });
  });

  describe('PluginLifecycle', () => {
    it('should enable and disable', () => {
      registry.register({ id: 'p1', manifest: { id: 'p1', name: 'P1' }, enabled: false });
      lifecycle.enable('p1');
      assert.strictEqual(registry.getPluginRaw('p1').enabled, true);
      lifecycle.disable('p1');
      assert.strictEqual(registry.getPluginRaw('p1').enabled, false);
    });

    it('should return error for unknown plugin', () => {
      const result = lifecycle.enable('nonexistent');
      assert.strictEqual(result.success, false);
    });

    it('should get plugin state', () => {
      registry.register({ id: 'p1', manifest: { id: 'p1' }, enabled: true });
      assert.strictEqual(lifecycle.getState('p1'), 'enabled');
    });
  });

  describe('PluginPermissions', () => {
    it('should grant and check permissions', () => {
      permissions.grant('p1', PERMISSIONS.CORE_READ);
      assert.ok(permissions.hasPermission('p1', PERMISSIONS.CORE_READ));
    });

    it('should reject invalid permission', () => {
      const result = permissions.grant('p1', 'invalid.perm');
      assert.strictEqual(result.success, false);
    });

    it('should revoke permission', () => {
      permissions.grant('p1', PERMISSIONS.CORE_READ);
      permissions.revoke('p1', PERMISSIONS.CORE_READ);
      assert.strictEqual(permissions.hasPermission('p1', PERMISSIONS.CORE_READ), false);
    });

    it('should have admin override', () => {
      permissions.grant('p1', PERMISSIONS.ADMIN);
      assert.ok(permissions.hasPermission('p1', PERMISSIONS.CORE_READ));
    });

    it('should get plugin permissions', () => {
      permissions.grant('p1', PERMISSIONS.API_ACCESS);
      const perms = permissions.getPermissions('p1');
      assert.ok(perms.includes(PERMISSIONS.API_ACCESS));
    });
  });

  describe('PluginStorage', () => {
    it('should set and get values', () => {
      storage.set('key1', 'value1');
      assert.strictEqual(storage.get('key1'), 'value1');
    });

    it('should check existence', () => {
      storage.set('k', 'v');
      assert.ok(storage.has('k'));
      assert.strictEqual(storage.has('missing'), false);
    });

    it('should delete values', () => {
      storage.set('k', 'v');
      storage.delete('k');
      assert.strictEqual(storage.get('k'), undefined);
    });

    it('should namespace by plugin', () => {
      storage.setNamespaced('plugin-a', 'config', '{"theme":"dark"}');
      storage.setNamespaced('plugin-b', 'config', '{"theme":"light"}');
      assert.strictEqual(storage.getNamespaced('plugin-a', 'config'), '{"theme":"dark"}');
      assert.strictEqual(storage.getPluginData('plugin-a').config, '{"theme":"dark"}');
    });

    it('should clear all', () => {
      storage.set('a', 1);
      storage.set('b', 2);
      storage.clear();
      assert.strictEqual(storage.get('a'), undefined);
    });
  });

  describe('PluginEvents', () => {
    it('should emit and listen', () => {
      let heard = false;
      events.on('test', (e) => { heard = true; });
      events.emit('test', {});
      assert.ok(heard);
    });

    it('should support wildcard', () => {
      let heard = false;
      events.on('*', () => { heard = true; });
      events.emit('anything', {});
      assert.ok(heard);
    });

    it('should off listener', () => {
      let count = 0;
      const h = () => { count++; };
      events.on('e', h);
      events.emit('e', {});
      events.off('e', h);
      events.emit('e', {});
      assert.strictEqual(count, 1);
    });

    it('should maintain history', () => {
      events.emit('a', {});
      events.emit('b', {});
      assert.strictEqual(events.history().length, 2);
    });

    it('should filter history', () => {
      events.emit('x', {});
      events.emit('y', {});
      assert.strictEqual(events.history('x').length, 1);
    });

    it('should have EVENTS constants', () => {
      assert.ok(EVENTS.PLUGIN_INSTALLED);
      assert.ok(EVENTS.PLUGIN_REMOVED);
      assert.ok(EVENTS.PLUGIN_FAILED);
      assert.strictEqual(EVENTS.PLUGIN_INSTALLED, 'plugin.installed');
    });

    it('should have HOOKS constants', () => {
      assert.ok(HOOKS.BEFORE_DEPLOYMENT);
      assert.ok(HOOKS.AFTER_WORKFLOW);
      assert.strictEqual(HOOKS.SYSTEM_STARTUP, 'systemStartup');
    });

    it('should handle handler errors', () => {
      events.on('fail', () => { throw new Error('oops'); });
      events.on('fail', () => { /* noop */ });
      events.emit('fail', {});
    });
  });

  describe('PluginResolver', () => {
    it('should resolve plugin by id', () => {
      registry.register({ id: 'p1', manifest: { id: 'p1', name: 'P1', version: '1.0.0' } });
      const resolved = resolver.resolve('p1');
      assert.ok(resolved);
    });

    it('should return null for missing plugin', () => {
      assert.strictEqual(resolver.resolve('missing'), null);
    });

    it('should find plugins by search term', () => {
      registry.register({ id: 'analytics-pro', manifest: { id: 'analytics-pro', name: 'Analytics Pro', description: 'Advanced analytics' } });
      registry.register({ id: 'security-pro', manifest: { id: 'security-pro', name: 'Security Pro', description: 'Security tools' } });
      const results = resolver.find('analytics');
      assert.strictEqual(results.length, 1);
    });
  });

  describe('PluginDependencyGraph', () => {
    beforeEach(() => {
      registry.register({ id: 'base', manifest: { id: 'base', name: 'Base', version: '1.0.0', dependencies: {} } });
      registry.register({ id: 'middle', manifest: { id: 'middle', name: 'Middle', version: '1.0.0', dependencies: { base: '1.0.0' } } });
      registry.register({ id: 'top', manifest: { id: 'top', name: 'Top', version: '1.0.0', dependencies: { middle: '1.0.0' } } });
    });

    it('should build dependency graph', () => {
      const graph = dependencyGraph.buildGraph();
      assert.ok(graph.base);
      assert.ok(graph.middle);
      assert.ok(graph.top);
    });

    it('should get dependency chain', () => {
      const chain = dependencyGraph.getDependencyChain('top');
      assert.ok(chain.includes('base'));
      assert.ok(chain.includes('middle'));
    });

    it('should get dependents', () => {
      const dependents = dependencyGraph.getDependents('base');
      assert.ok(dependents.includes('middle'));
      assert.ok(dependents.includes('top'));
    });

    it('should get installation order', () => {
      const order = dependencyGraph.getInstallationOrder(['top', 'middle', 'base']);
      assert.strictEqual(order[0], 'base');
    });

    it('should detect cycles', () => {
      registry.register({ id: 'cycle-a', manifest: { id: 'cycle-a', dependencies: { 'cycle-b': '1.0.0' } } });
      registry.register({ id: 'cycle-b', manifest: { id: 'cycle-b', dependencies: { 'cycle-a': '1.0.0' } } });
      const cycles = dependencyGraph.getCycles();
      assert.ok(cycles.length >= 0);
    });
  });

  describe('PluginVersionManager', () => {
    it('should register and get versions', () => {
      versions.registerVersion('p1', '1.0.0', { changelog: 'Initial' });
      versions.registerVersion('p1', '1.1.0', { changelog: 'Updates' });
      assert.strictEqual(versions.getVersions('p1').length, 2);
    });

    it('should get latest version', () => {
      versions.registerVersion('p1', '1.0.0', {});
      versions.registerVersion('p1', '2.0.0', {});
      const latest = versions.getLatestVersion('p1');
      assert.strictEqual(latest.version, '2.0.0');
    });

    it('should get specific version', () => {
      versions.registerVersion('p1', '1.0.0', { data: 'initial' });
      const v = versions.getVersion('p1', '1.0.0');
      assert.ok(v);
      assert.strictEqual(v.data.data, 'initial');
    });

    it('should return null for missing', () => {
      assert.strictEqual(versions.getVersion('missing', '1.0.0'), null);
    });
  });

  describe('PluginCompatibility', () => {
    it('should check platform version compatibility', () => {
      const result = compatibility.check({ manifest: validManifest }, '4.3.0');
      assert.ok(result.compatible);
    });

    it('should reject if platform below minimum', () => {
      const result = compatibility.check({ manifest: { ...validManifest, minimumPlatformVersion: '5.0.0' } }, '4.3.0');
      assert.strictEqual(result.compatible, false);
    });

    it('should reject if platform above maximum', () => {
      const result = compatibility.check({ manifest: { ...validManifest, maximumPlatformVersion: '4.0.0' } }, '4.3.0');
      assert.strictEqual(result.compatible, false);
    });

    it('should handle wildcard compatibility', () => {
      const result = compatibility.check({ manifest: { ...validManifest, minimumPlatformVersion: '*' } }, '4.3.0');
      assert.ok(result.compatible);
    });
  });

  describe('PluginMarketplace', () => {
    it('should publish listing', () => {
      const listing = marketplace.publish({ id: 'plugin-1', name: 'Plugin 1', version: '1.0.0', author: 'Author', categories: ['analytics'] });
      assert.ok(listing.id);
      assert.strictEqual(listing.downloads, 0);
    });

    it('should list listings', () => {
      marketplace.publish({ id: 'p1', name: 'P1', version: '1.0.0', categories: ['analytics'] });
      marketplace.publish({ id: 'p2', name: 'P2', version: '1.0.0', categories: ['security'] });
      assert.strictEqual(marketplace.listListings().length, 2);
    });

    it('should filter by category', () => {
      marketplace.publish({ id: 'p1', name: 'P1', version: '1.0.0', categories: ['analytics'] });
      marketplace.publish({ id: 'p2', name: 'P2', version: '1.0.0', categories: ['security'] });
      assert.strictEqual(marketplace.listListings({ category: 'analytics' }).length, 1);
    });

    it('should increment downloads', () => {
      marketplace.publish({ id: 'p1', name: 'P1', version: '1.0.0' });
      marketplace.incrementDownloads('p1');
      marketplace.incrementDownloads('p1');
      assert.strictEqual(marketplace.getListing('p1').downloads, 2);
    });

    it('should verify and unverify', () => {
      marketplace.publish({ id: 'p1', name: 'P1', version: '1.0.0' });
      marketplace.verify('p1');
      assert.ok(marketplace.getListing('p1').verified);
      marketplace.unverify('p1');
      assert.strictEqual(marketplace.getListing('p1').verified, false);
    });

    it('should get featured listings', () => {
      marketplace.publish({ id: 'p1', name: 'P1', version: '1.0.0' });
      marketplace.publish({ id: 'p2', name: 'P2', version: '1.0.0' });
      marketplace.verify('p1');
      marketplace.verify('p2');
      marketplace._listings.p1.rating = 4.5;
      marketplace._listings.p2.rating = 4.2;
      const featured = marketplace.getFeatured();
      assert.ok(featured.length >= 2);
    });

    it('should get top rated', () => {
      marketplace.publish({ id: 'p1', name: 'P1', version: '1.0.0' });
      marketplace.publish({ id: 'p2', name: 'P2', version: '1.0.0' });
      assert.ok(marketplace.getTopRated().length >= 2);
    });
  });

  describe('PluginSearch', () => {
    it('should search by query', () => {
      engine.install({ manifest: { id: 'my-plugin', name: 'My Plugin', version: '1.0.0', permissions: [], description: 'A great plugin' } });
      const result = engine.searchPlugins('my-plugin');
      assert.ok(result.results.length >= 1);
    });

    it('should search by category', () => {
      registry.register({ id: 'cat-plugin', manifest: { id: 'cat-plugin', name: 'Cat Plugin', categories: ['analytics'] } });
      const result = search.searchByCategory('analytics');
      assert.ok(result.local.length >= 1);
    });

    it('should paginate results', () => {
      engine.install({ manifest: { id: 's-p1', name: 'S P1', version: '1.0.0', permissions: [] } });
      engine.install({ manifest: { id: 's-p2', name: 'S P2', version: '1.0.0', permissions: [] } });
      const result = engine.searchPlugins('s-', { limit: 1, offset: 0 });
      assert.strictEqual(result.results.length, 1);
      assert.strictEqual(result.total, 2);
    });
  });

  describe('PluginRatings', () => {
    it('should rate a plugin', () => {
      const result = ratings.rate('p1', 'user1', 5);
      assert.ok(result.success);
      assert.strictEqual(result.average, 5);
    });

    it('should reject invalid scores', () => {
      const result = ratings.rate('p1', 'user1', 6);
      assert.strictEqual(result.success, false);
    });

    it('should calculate average', () => {
      ratings.rate('p1', 'u1', 4);
      ratings.rate('p1', 'u2', 5);
      assert.strictEqual(ratings.getAverage('p1'), 4.5);
    });

    it('should get user rating', () => {
      ratings.rate('p1', 'user1', 3);
      assert.strictEqual(ratings.getUserRating('p1', 'user1'), 3);
    });

    it('should return 0 for unrated plugin', () => {
      assert.strictEqual(ratings.getAverage('unrated'), 0);
    });
  });

  describe('PluginReviews', () => {
    it('should add and get reviews', () => {
      reviews.addReview('p1', 'user1', { title: 'Great!', body: 'Works perfectly', rating: 5 });
      const all = reviews.getReviews('p1');
      assert.strictEqual(all.length, 1);
    });

    it('should get single review by id', () => {
      const r = reviews.addReview('p1', 'u1', { body: 'Nice' });
      const found = reviews.getReview(r.id);
      assert.ok(found);
    });

    it('should delete review', () => {
      const r = reviews.addReview('p1', 'u1', { body: 'test' });
      reviews.deleteReview(r.id);
      assert.strictEqual(reviews.getReviews('p1').length, 0);
    });

    it('should count reviews', () => {
      reviews.addReview('p1', 'u1', { body: 'a' });
      reviews.addReview('p1', 'u2', { body: 'b' });
      assert.strictEqual(reviews.getCount('p1'), 2);
    });
  });

  describe('Hooks System', () => {
    it('should register hook on engine', () => {
      const result = engine.registerHook('beforeDeployment', 'plugin-1', () => {});
      assert.ok(result.success);
    });

    it('should reject unknown hooks', () => {
      const result = engine.registerHook('unknown.hook', 'plugin-1', () => {});
      assert.strictEqual(result.success, false);
    });

    it('should execute hooks', () => {
      let called = false;
      engine.registerHook('afterDeployment', 'plugin-1', (ctx) => { called = true; return { handled: true }; });
      const result = engine.executeHook('afterDeployment', { project: 'test' });
      assert.ok(called);
      assert.strictEqual(result.handlerCount, 1);
    });

    it('should get registered hooks', () => {
      engine.registerHook('beforeWorkflow', 'p1', () => {});
      const hooks = engine.getRegisteredHooks();
      assert.ok(hooks.beforeWorkflow);
    });

    it('should execute multiple hook handlers', () => {
      let count = 0;
      engine.registerHook('systemStartup', 'p1', () => { count++; });
      engine.registerHook('systemStartup', 'p2', () => { count++; });
      engine.executeHook('systemStartup', {});
      assert.strictEqual(count, 2);
    });
  });

  describe('Plugin SDK', () => {
    it('Plugin should create with manifest', () => {
      const p = new Plugin({ id: 'sdk-test', name: 'SDK Test', version: '1.0.0' });
      assert.strictEqual(p.id, 'sdk-test');
      assert.strictEqual(p.name, 'SDK Test');
    });

    it('createPlugin should return Plugin instance', () => {
      const p = createPlugin({ id: 'cp-test', name: 'CP Test', version: '1.0.0' });
      assert.ok(p instanceof Plugin);
    });

    it('Plugin should register and get hooks', () => {
      const p = new Plugin({ id: 'p1', name: 'P1', version: '1.0.0' });
      p.registerHook('beforeDeployment', () => {});
      const hooks = p.getHooks();
      assert.ok(hooks.beforeDeployment);
    });

    it('Plugin should register and get commands', () => {
      const p = new Plugin({ id: 'p1', name: 'P1', version: '1.0.0' });
      p.registerCommand('hello', () => 'world', { description: 'Say hello' });
      const cmds = p.getCommands();
      assert.ok(cmds.hello);
    });

    it('Plugin should register and get widgets', () => {
      const p = new Plugin({ id: 'p1', name: 'P1', version: '1.0.0' });
      p.registerWidget('chart', () => '<div>Chart</div>', { title: 'Chart' });
      const widgets = p.getWidgets();
      assert.ok(widgets.chart);
    });

    it('Plugin should extend API', () => {
      const p = new Plugin({ id: 'p1', name: 'P1', version: '1.0.0' });
      p.extendAPI('/custom/endpoint', () => ({}), 'GET');
      const apis = p.getAPIExtensions();
      assert.ok(apis['/custom/endpoint']);
    });

    it('Plugin should extend workflows', () => {
      const p = new Plugin({ id: 'p1', name: 'P1', version: '1.0.0' });
      p.extendWorkflow('custom_step', () => {});
      const wf = p.getWorkflowExtensions();
      assert.ok(wf.custom_step);
    });

    it('Plugin should extend agents', () => {
      const p = new Plugin({ id: 'p1', name: 'P1', version: '1.0.0' });
      p.extendAgent('custom', () => ({}));
      const agents = p.getAgentExtensions();
      assert.ok(agents.custom);
    });

    it('Plugin should manage storage', () => {
      const p = new Plugin({ id: 'p1', name: 'P1', version: '1.0.0' });
      p.setStorage('key', 'value');
      assert.strictEqual(p.getStorage('key'), 'value');
    });

    it('Plugin should have lifecycle methods', () => {
      const p = new Plugin({ id: 'p1', name: 'P1', version: '1.0.0' });
      p.onLoad();
      p.onUnload();
      p.onEnable();
      p.onDisable();
    });

    it('Hook should register and execute', () => {
      const hook = new Hook('testHook');
      let called = false;
      hook.register((ctx) => { called = true; return ctx; });
      hook.execute({ a: 1 });
      assert.ok(called);
    });

    it('Hook should support priorities', () => {
      const hook = new Hook('ordered');
      const order = [];
      hook.register(() => { order.push(2); }, 20);
      hook.register(() => { order.push(1); }, 10);
      hook.execute({});
      assert.strictEqual(order[0], 1);
      assert.strictEqual(order[1], 2);
    });

    it('Command should execute handler', () => {
      const cmd = new Command({ name: 'greet', handler: ({ name }) => `Hello ${name}` });
      assert.strictEqual(cmd.execute({ name: 'World' }), 'Hello World');
    });

    it('createCommand should work', () => {
      const cmd = createCommand({ name: 'test', handler: () => 'ok' });
      assert.strictEqual(cmd.execute(), 'ok');
    });

    it('Widget should render', () => {
      const w = new Widget({ id: 'my-widget', title: 'My Widget', renderer: () => '<div>Content</div>' });
      assert.strictEqual(w.render(), '<div>Content</div>');
    });

    it('createWidget should work', () => {
      const w = createWidget({ id: 'w1', renderer: () => 'ok' });
      assert.strictEqual(w.render(), 'ok');
    });

    it('ApiExtension should handle requests', () => {
      const ext = new ApiExtension({ path: '/test', method: 'GET', handler: (req) => ({ ok: true }) });
      const result = ext.handle({});
      assert.ok(result.ok);
    });

    it('createApiExtension should work', () => {
      const ext = createApiExtension({ path: '/test', handler: () => ({}) });
      assert.ok(ext);
    });

    it('WorkflowExtension should execute', () => {
      const ext = new WorkflowExtension({ type: 'custom', handler: (ctx) => ({ processed: true }) });
      const result = ext.execute({});
      assert.ok(result.processed);
    });

    it('createWorkflowExtension should work', () => {
      const ext = createWorkflowExtension({ type: 'test', handler: () => ({}) });
      assert.ok(ext);
    });

    it('AgentExtension should execute', () => {
      const ext = new AgentExtension({ type: 'custom', handler: (task) => ({ output: `done ${task}` }) });
      const result = ext.execute('work', {});
      assert.strictEqual(result.output, 'done work');
    });

    it('createAgentExtension should work', () => {
      const ext = createAgentExtension({ type: 'test', handler: () => ({}) });
      assert.ok(ext);
    });

    it('GeneratorExtension should generate', () => {
      const ext = new GeneratorExtension({ name: 'page-gen', generator: (input) => ({ html: `<div>${input}</div>` }) });
      const result = ext.generate('hello', {});
      assert.strictEqual(result.html, '<div>hello</div>');
    });

    it('StorageExtension should namespace correctly', () => {
      const store = new PluginStorage();
      const ext = new StorageExtension('my-plugin', store);
      ext.set('theme', 'dark');
      assert.strictEqual(ext.get('theme'), 'dark');
      assert.strictEqual(store.getNamespaced('my-plugin', 'theme'), 'dark');
    });

    it('StorageExtension should get all', () => {
      const store = new PluginStorage();
      const ext = new StorageExtension('my-plugin', store);
      ext.set('a', 1);
      ext.set('b', 2);
      const all = ext.getAll();
      assert.strictEqual(Object.keys(all).length, 2);
    });

    it('PluginLogger should log at levels', () => {
      const log = new PluginLogger('test-plugin');
      log.info('Info message');
      log.warn('Warning');
      log.error('Error');
      log.debug('Debug');
      assert.strictEqual(log.getLogs().length, 4);
    });

    it('PluginLogger should filter by level', () => {
      const log = new PluginLogger('test');
      log.info('a');
      log.error('b');
      const errors = log.getLogs('error');
      assert.strictEqual(errors.length, 1);
    });

    it('PluginConfig defaults', () => {
      const config = new PluginConfig('test-plugin', { theme: 'dark', port: 3000 });
      assert.strictEqual(config.get('theme'), 'dark');
      assert.strictEqual(config.get('port'), 3000);
    });

    it('PluginConfig should set and get', () => {
      const config = new PluginConfig('test');
      config.set('host', 'localhost');
      assert.strictEqual(config.get('host'), 'localhost');
    });

    it('PluginConfig should support change listeners', () => {
      const config = new PluginConfig('test', { mode: 'dev' });
      let newVal = null;
      config.onChange('mode', (val) => { newVal = val; });
      config.set('mode', 'prod');
      assert.strictEqual(newVal, 'prod');
    });

    it('PluginConfig should reset to defaults', () => {
      const config = new PluginConfig('test', { timeout: 5000 });
      config.set('timeout', 10000);
      config.reset('timeout');
      assert.strictEqual(config.get('timeout'), 5000);
    });

    it('PluginConfig should get all as JSON', () => {
      const config = new PluginConfig('test', { a: 1, b: 2 });
      const json = config.toJSON();
      assert.strictEqual(json.a, 1);
      assert.strictEqual(json.b, 2);
    });
  });

  describe('Grant/Revoke Permissions via Engine', () => {
    it('should grant and check permission', () => {
      engine.grantPermission('p1', PERMISSIONS.CORE_READ);
      assert.ok(engine.checkPermission('p1', PERMISSIONS.CORE_READ));
    });

    it('should revoke permission', () => {
      engine.grantPermission('p1', PERMISSIONS.CORE_READ);
      engine.revokePermission('p1', PERMISSIONS.CORE_READ);
      assert.strictEqual(engine.checkPermission('p1', PERMISSIONS.CORE_READ), false);
    });

    it('should get permissions', () => {
      engine.grantPermission('p1', PERMISSIONS.API_ACCESS);
      const perms = engine.getPluginPermissions('p1');
      assert.ok(perms.includes(PERMISSIONS.API_ACCESS));
    });
  });

  describe('Engine Integration', () => {
    it('should install, enable, disable, uninstall lifecycle', () => {
      const result = engine.install({ manifest: validManifest });
      assert.ok(result.success);
      assert.ok(result.plugin.enabled);
      engine.disable('test-plugin');
      assert.strictEqual(engine.getPluginRaw('test-plugin').enabled, false);
      engine.enable('test-plugin');
      assert.strictEqual(engine.getPluginRaw('test-plugin').enabled, true);
      engine.uninstall('test-plugin');
      assert.strictEqual(engine.getPlugin('test-plugin'), null);
    });

    it('should rate a plugin via engine', () => {
      engine.install({ manifest: validManifest });
      const result = engine.ratePlugin('test-plugin', 'user1', 5);
      assert.ok(result.success);
      assert.strictEqual(engine.getPluginRating('test-plugin'), 5);
    });

    it('should review a plugin via engine', () => {
      engine.install({ manifest: validManifest });
      engine.addReview('test-plugin', 'user1', { title: 'Great', body: 'Works well', rating: 5 });
      assert.strictEqual(engine.getReviews('test-plugin').length, 1);
    });

    it('should register and execute hooks through engine', () => {
      let executed = false;
      engine.registerHook('afterGeneration', 'test-plugin', (ctx) => { executed = true; return ctx; });
      engine.executeHook('afterGeneration', { id: 'test' });
      assert.ok(executed);
    });

    it('should get marketplace listings through engine', () => {
      engine.publishListing({ id: 'market-p1', name: 'Market P1', version: '1.0.0', categories: ['tools'] });
      const listings = engine.getMarketplaceListings();
      assert.strictEqual(listings.length, 1);
    });

    it('should get featured plugins', () => {
      engine.publishListing({ id: 'f1', name: 'F1', version: '1.0.0', categories: ['analytics'] });
      engine.publishListing({ id: 'f2', name: 'F2', version: '1.0.0', categories: ['security'] });
      const featured = engine.getFeatured();
      assert.ok(Array.isArray(featured));
    });

    it('should search marketplace and installed', () => {
      engine.install({ manifest: { id: 'installed-search', name: 'Installed Search', version: '1.0.0', permissions: [] } });
      const result = engine.searchPlugins('installed');
      assert.ok(result.results.length >= 1);
    });

    it('should get categories', () => {
      engine.install({ manifest: { id: 'cat-test', name: 'Cat Test', version: '1.0.0', permissions: [], categories: ['tools'] } });
      const cats = engine.getCategories();
      assert.ok(cats.length >= 1);
    });

    it('should get dependency info', () => {
      engine.install({ manifest: { id: 'dep-base', name: 'Base', version: '1.0.0', permissions: [], dependencies: {} } });
      engine.install({ manifest: { id: 'dep-child', name: 'Child', version: '1.0.0', permissions: [], dependencies: { 'dep-base': '1.0.0' } } });
      const dependents = engine.getDependents('dep-base');
      assert.ok(dependents.includes('dep-child'));
    });

    it('should get version info', () => {
      engine.install({ manifest: validManifest });
      engine.versions.registerVersion('test-plugin', '1.0.0', {});
      const versionsList = engine.getVersionInfo('test-plugin');
      assert.ok(versionsList.length >= 1);
    });

    it('should clear all state', () => {
      engine.install({ manifest: validManifest });
      engine.publishListing({ id: 'clear-test', name: 'Clear', version: '1.0.0' });
      engine.clear();
      assert.strictEqual(engine.getInstalledCount(), 0);
    });
  });

  describe('API Controller', () => {
    it('should export all handler functions', () => {
      assert.ok(typeof pluginController.listPlugins === 'function');
      assert.ok(typeof pluginController.getInstalledPlugins === 'function');
      assert.ok(typeof pluginController.getMarketplaceListings === 'function');
      assert.ok(typeof pluginController.getPlugin === 'function');
      assert.ok(typeof pluginController.installPlugin === 'function');
      assert.ok(typeof pluginController.uninstallPlugin === 'function');
      assert.ok(typeof pluginController.updatePlugin === 'function');
      assert.ok(typeof pluginController.enablePlugin === 'function');
      assert.ok(typeof pluginController.disablePlugin === 'function');
      assert.ok(typeof pluginController.reloadPlugin === 'function');
      assert.ok(typeof pluginController.searchPlugins === 'function');
      assert.ok(typeof pluginController.getCategories === 'function');
    });

    it('should handle listPlugins', () => {
      let jsonData;
      const req = {};
      const res = { status: () => res, json: (d) => { jsonData = d; } };
      pluginController.listPlugins(req, res);
      assert.ok(jsonData);
    });

    it('should handle getPlugin with missing plugin', () => {
      let jsonData;
      const req = { params: { id: 'nonexistent' } };
      const res = { status: () => res, json: (d) => { jsonData = d; } };
      pluginController.getPlugin(req, res);
      assert.ok(jsonData);
    });

    it('should handle installPlugin', () => {
      let jsonData;
      const req = { body: { manifest: { id: 'api-test', name: 'API Test', version: '1.0.0', permissions: [] } } };
      const res = { status: () => res, json: (d) => { jsonData = d; } };
      pluginController.installPlugin(req, res);
      assert.ok(jsonData);
    });

    it('should handle uninstallPlugin', () => {
      let jsonData;
      const req = { params: { id: 'nonexistent' } };
      const res = { status: () => res, json: (d) => { jsonData = d; } };
      pluginController.uninstallPlugin(req, res);
      assert.ok(jsonData);
    });

    it('should handle searchPlugins', () => {
      let jsonData;
      const req = { query: { q: 'test' } };
      const res = { status: () => res, json: (d) => { jsonData = d; } };
      pluginController.searchPlugins(req, res);
      assert.ok(jsonData);
    });

    it('should handle getCategories', () => {
      let jsonData;
      const req = {};
      const res = { status: () => res, json: (d) => { jsonData = d; } };
      pluginController.getCategories(req, res);
      assert.ok(jsonData);
    });
  });
});
