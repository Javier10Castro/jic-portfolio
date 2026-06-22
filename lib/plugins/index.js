const { PluginManager, getDefaultEngine, createEngine } = require('./pluginManager');
const { PluginRegistry } = require('./pluginRegistry');
const { PluginLoader } = require('./pluginLoader');
const { PluginInstaller } = require('./pluginInstaller');
const { PluginUninstaller } = require('./pluginUninstaller');
const { PluginValidator } = require('./pluginValidator');
const { PluginSandbox } = require('./pluginSandbox');
const { PluginLifecycle } = require('./pluginLifecycle');
const { PluginPermissions, PERMISSIONS } = require('./pluginPermissions');
const { PluginStorage } = require('./pluginStorage');
const { PluginEvents, EVENTS } = require('./pluginEvents');
const { HOOKS } = require('./pluginManifest');
const { PluginResolver } = require('./pluginResolver');
const { PluginDependencyGraph } = require('./pluginDependencyGraph');
const { PluginVersionManager } = require('./pluginVersionManager');
const { PluginCompatibility } = require('./pluginCompatibility');
const { PluginMarketplace } = require('./pluginMarketplace');
const { PluginSearch } = require('./pluginSearch');
const { PluginRatings } = require('./pluginRatings');
const { PluginReviews } = require('./pluginReviews');

module.exports = {
  PluginManager, getDefaultEngine, createEngine,
  PluginRegistry, PluginLoader, PluginInstaller, PluginUninstaller,
  PluginValidator, PluginSandbox, PluginLifecycle,
  PluginPermissions, PERMISSIONS, PluginStorage,
  PluginEvents, EVENTS, HOOKS,
  PluginResolver, PluginDependencyGraph,
  PluginVersionManager, PluginCompatibility,
  PluginMarketplace, PluginSearch, PluginRatings, PluginReviews
};
