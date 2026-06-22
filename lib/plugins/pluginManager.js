const { PluginRegistry } = require('./pluginRegistry');
const { PluginLoader } = require('./pluginLoader');
const { PluginInstaller } = require('./pluginInstaller');
const { PluginUninstaller } = require('./pluginUninstaller');
const { PluginValidator } = require('./pluginValidator');
const { PluginSandbox } = require('./pluginSandbox');
const { PluginLifecycle } = require('./pluginLifecycle');
const { PluginPermissions } = require('./pluginPermissions');
const { PluginStorage } = require('./pluginStorage');
const { PluginEvents, EVENTS } = require('./pluginEvents');
const { PluginManifest, HOOKS } = require('./pluginManifest');
const { PluginResolver } = require('./pluginResolver');
const { PluginDependencyGraph } = require('./pluginDependencyGraph');
const { PluginVersionManager } = require('./pluginVersionManager');
const { PluginCompatibility } = require('./pluginCompatibility');
const { PluginMarketplace } = require('./pluginMarketplace');
const { PluginSearch } = require('./pluginSearch');
const { PluginRatings } = require('./pluginRatings');
const { PluginReviews } = require('./pluginReviews');

class PluginManager {
  constructor(options = {}) {
    this.events = options.events || new PluginEvents();
    this.storage = options.storage || new PluginStorage();
    this.registry = options.registry || new PluginRegistry();
    this.permissions = options.permissions || new PluginPermissions();
    this.sandbox = options.sandbox || new PluginSandbox({ permissions: this.permissions });
    this.loader = options.loader || new PluginLoader({ sandbox: this.sandbox });
    this.validator = options.validator || new PluginValidator();
    this.compatibility = options.compatibility || new PluginCompatibility();
    this.versions = options.versions || new PluginVersionManager();
    this.resolver = options.resolver || new PluginResolver({ registry: this.registry, compatibility: this.compatibility });
    this.dependencyGraph = options.dependencyGraph || new PluginDependencyGraph({ registry: this.registry });
    this.installer = options.installer || new PluginInstaller({ registry: this.registry, loader: this.loader, events: this.events, validator: this.validator, compatibility: this.compatibility, platformVersion: options.platformVersion || '4.3.0' });
    this.uninstaller = options.uninstaller || new PluginUninstaller({ registry: this.registry, loader: this.loader, events: this.events, storage: this.storage });
    this.lifecycle = options.lifecycle || new PluginLifecycle({ registry: this.registry, loader: this.loader, events: this.events, pluginStorage: this.storage });
    this.marketplace = options.marketplace || new PluginMarketplace({ registry: this.registry, events: this.events });
    this.search = options.search || new PluginSearch({ registry: this.registry, marketplace: this.marketplace });
    this.ratings = options.ratings || new PluginRatings();
    this.reviews = options.reviews || new PluginReviews();
    this._hooks = {};
    this.platformVersion = options.platformVersion || '4.3.0';
  }

  install(pluginData, options) { return this.installer.install(pluginData, options); }
  uninstall(pluginId) { return this.uninstaller.uninstall(pluginId); }
  enable(pluginId) { return this.lifecycle.enable(pluginId); }
  disable(pluginId) { return this.lifecycle.disable(pluginId); }
  reload(pluginId, newManifest) { return this.lifecycle.reload(pluginId, newManifest); }

  listPlugins(filter) { return this.registry.listPlugins(filter); }
  getPlugin(id) { return this.registry.getPlugin(id); }
  getPluginRaw(id) { return this.registry.getPluginRaw(id); }

  searchPlugins(query, options) { return this.search.search(query, options); }
  searchByCategory(category, options) { return this.search.searchByCategory(category, options); }
  getCategories() { return this.registry.getCategories(); }

  getMarketplaceListings(filter) { return this.marketplace.listListings(filter); }
  publishListing(listing) { return this.marketplace.publish(listing); }
  getFeatured() { return this.marketplace.getFeatured(); }
  getTopRated(limit) { return this.marketplace.getTopRated(limit); }
  getRecentlyUpdated(limit) { return this.marketplace.getRecentlyUpdated(limit); }

  ratePlugin(pluginId, userId, score) { return this.ratings.rate(pluginId, userId, score); }
  getPluginRating(pluginId) { return this.ratings.getAverage(pluginId); }
  addReview(pluginId, userId, data) { return this.reviews.addReview(pluginId, userId, data); }
  getReviews(pluginId) { return this.reviews.getReviews(pluginId); }

  registerHook(hook, pluginId, handler) {
    if (!HOOKS[Object.keys(HOOKS).find(k => HOOKS[k] === hook)]) return { success: false, error: `Unknown hook: ${hook}` };
    if (!this._hooks[hook]) this._hooks[hook] = [];
    this._hooks[hook].push({ pluginId, handler });
    return { success: true };
  }

  executeHook(hook, context = {}) {
    const handlers = this._hooks[hook] || [];
    const results = [];
    handlers.forEach(({ pluginId, handler }) => {
      if (this.getPluginRaw(pluginId)?.enabled !== false) {
        try { results.push({ pluginId, result: handler(context) }); } catch (e) { results.push({ pluginId, error: e.message }); }
      }
    });
    return { hook, handlerCount: handlers.length, results };
  }

  getRegisteredHooks() {
    const hooks = {};
    Object.entries(this._hooks).forEach(([hook, handlers]) => {
      hooks[hook] = handlers.map(h => h.pluginId);
    });
    return hooks;
  }

  grantPermission(pluginId, permission) { return this.permissions.grant(pluginId, permission); }
  revokePermission(pluginId, permission) { return this.permissions.revoke(pluginId, permission); }
  checkPermission(pluginId, permission) { return this.permissions.hasPermission(pluginId, permission); }
  getPluginPermissions(pluginId) { return this.permissions.getPermissions(pluginId); }

  getDependencyGraph() { return this.dependencyGraph.buildGraph(); }
  getDependencyChain(pluginId) { return this.dependencyGraph.getDependencyChain(pluginId); }
  getDependents(pluginId) { return this.dependencyGraph.getDependents(pluginId); }
  getCycles() { return this.dependencyGraph.getCycles(); }

  getVersionInfo(pluginId) { return this.versions.getVersions(pluginId); }
  getInstalledCount() { return this.registry.getCount(); }
  getEnabledCount() { return this.listPlugins().filter(p => p.enabled).length; }
  getStatus() {
    return { installed: this.registry.getCount(), enabled: this.getEnabledCount(), loaded: this.loader.getCount(), hooks: Object.keys(this._hooks).length, marketplace: Object.keys(this.marketplace._listings).length };
  }

  clear() {
    this.registry.clear(); this.loader.clear(); this.permissions.clear();
    this.storage.clear(); this.events.clear(); this._hooks = {};
    this.marketplace.clear(); this.ratings.clear(); this.reviews.clear();
  }
}

let _defaultEngine = null;
function getDefaultEngine(options = {}) { if (!_defaultEngine) _defaultEngine = new PluginManager(options); return _defaultEngine; }
function createEngine(options = {}) { return new PluginManager(options); }

module.exports = { PluginManager, getDefaultEngine, createEngine, HOOKS, EVENTS };
