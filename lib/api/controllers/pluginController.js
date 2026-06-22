const { getDefaultEngine } = require('../../plugins');
const { success, created, error } = require('../responses/apiResponse');

function _getEngine() { return getDefaultEngine(); }

function listPlugins(req, res) {
  try {
    const plugins = _getEngine().listPlugins();
    success(res, { plugins });
  } catch (e) { error(res, e.message); }
}

function getInstalledPlugins(req, res) {
  try {
    const plugins = _getEngine().listPlugins({ enabled: true });
    success(res, { plugins, count: plugins.length });
  } catch (e) { error(res, e.message); }
}

function getMarketplaceListings(req, res) {
  try {
    const listings = _getEngine().getMarketplaceListings(req.query);
    success(res, { listings });
  } catch (e) { error(res, e.message); }
}

function getPlugin(req, res) {
  try {
    const plugin = _getEngine().getPlugin(req.params.id);
    if (!plugin) return error(res, 'Plugin not found', 404);
    success(res, { plugin });
  } catch (e) { error(res, e.message); }
}

function installPlugin(req, res) {
  try {
    const result = _getEngine().install(req.body.manifest || req.body, { source: req.body.source || 'marketplace' });
    if (!result.success) return error(res, result.error, 400);
    created(res, { plugin: result.plugin });
  } catch (e) { error(res, e.message); }
}

function uninstallPlugin(req, res) {
  try {
    const result = _getEngine().uninstall(req.params.id);
    if (!result.success) return error(res, result.error, 404);
    success(res, { uninstalled: true });
  } catch (e) { error(res, e.message); }
}

function updatePlugin(req, res) {
  try {
    const result = _getEngine().reload(req.params.id, req.body.manifest);
    if (!result.success) return error(res, result.error, 404);
    success(res, { updated: true });
  } catch (e) { error(res, e.message); }
}

function enablePlugin(req, res) {
  try {
    const result = _getEngine().enable(req.params.id);
    if (!result.success) return error(res, result.error, 400);
    success(res, { enabled: true });
  } catch (e) { error(res, e.message); }
}

function disablePlugin(req, res) {
  try {
    const result = _getEngine().disable(req.params.id);
    if (!result.success) return error(res, result.error, 400);
    success(res, { disabled: true });
  } catch (e) { error(res, e.message); }
}

function reloadPlugin(req, res) {
  try {
    const result = _getEngine().reload(req.params.id);
    if (!result.success) return error(res, result.error, 404);
    success(res, { reloaded: true });
  } catch (e) { error(res, e.message); }
}

function searchPlugins(req, res) {
  try {
    const { q, category, limit, offset } = req.query;
    if (category) {
      const result = _getEngine().searchByCategory(category, { limit: parseInt(limit) || 20 });
      return success(res, result);
    }
    const result = _getEngine().searchPlugins(q || '', { limit: parseInt(limit) || 20, offset: parseInt(offset) || 0, sort: req.query.sort });
    success(res, result);
  } catch (e) { error(res, e.message); }
}

function getCategories(req, res) {
  try {
    const categories = _getEngine().getCategories();
    success(res, { categories });
  } catch (e) { error(res, e.message); }
}

module.exports = { listPlugins, getInstalledPlugins, getMarketplaceListings, getPlugin, installPlugin, uninstallPlugin, updatePlugin, enablePlugin, disablePlugin, reloadPlugin, searchPlugins, getCategories };
