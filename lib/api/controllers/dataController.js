const { getDefaultPlatform, DataManager, StorageManager, ConnectionManager } = require('../../data');
const { success, error } = require('../responses/apiResponse');

function getController() {
  const platform = getDefaultPlatform();
  return {
    getOverview(req, res) {
      try {
        success(res, {
          connections: platform.connections.count(),
          adapters: platform.adapters.count(),
          storage: platform.storage.getAll(),
          cache: { hits: 0, misses: 0 },
          vectors: platform.vector ? platform.vector.list().length : 0,
          backups: platform.backups ? platform.backups.count() : 0,
          health: platform.health.getAll(),
        });
      } catch (e) { error(res, e.message); }
    },
    getProviders(req, res) {
      try { success(res, { providers: platform.adapters.list() }); }
      catch (e) { error(res, e.message); }
    },
    getStorage(req, res) {
      try { success(res, { storage: platform.storage.getAll() }); }
      catch (e) { error(res, e.message); }
    },
    getCache(req, res) {
      try {
        const cm = require('../../data/cache/cacheManager');
        const cacheMgr = new cm.CacheManager();
        success(res, { stats: cacheMgr.getStats ? cacheMgr.getStats() : { hits: 0, misses: 0, size: 0 } });
      } catch (e) { error(res, e.message); }
    },
    getVector(req, res) {
      try {
        const vm = require('../../data/vectors/vectorManager');
        const mgr = new vm.VectorManager();
        success(res, { indexes: mgr.list(), count: mgr.count() });
      } catch (e) { error(res, e.message); }
    },
    getSearch(req, res) {
      try {
        const se = require('../../data/search/searchEngine');
        const engine = new se.SearchEngine();
        success(res, { indexes: engine.listIndexes ? engine.listIndexes() : [] });
      } catch (e) { error(res, e.message); }
    },
    getBackups(req, res) {
      try { success(res, { backups: platform.backups ? platform.backups.list() : [] }); }
      catch (e) { error(res, e.message); }
    },
    getAnalytics(req, res) {
      try {
        const aw = require('../../data/analytics/analyticsWarehouse');
        const wh = new aw.AnalyticsWarehouse();
        success(res, { views: wh.listViews ? wh.listViews() : [], metrics: wh.getMetrics ? wh.getMetrics() : {} });
      } catch (e) { error(res, e.message); }
    },
    postQuery(req, res) {
      try {
        const { datasource, query, params } = req.body;
        if (!datasource || !query) return error(res, 'Datasource and query required');
        const result = platform.executeQuery(datasource, query, params);
        success(res, { result });
      } catch (e) { error(res, e.message); }
    },
    postVectorSearch(req, res) {
      try {
        const { index, query, topK } = req.body;
        if (!index || !query) return error(res, 'Index and query required');
        const ss = require('../../data/vectors/semanticSearch');
        const search = new ss.SemanticSearch();
        const results = search.search ? search.search(query, { topK: topK || 10 }) : [];
        success(res, { results });
      } catch (e) { error(res, e.message); }
    },
    postKnowledgeSearch(req, res) {
      try {
        const { query, options } = req.body;
        if (!query) return error(res, 'Query required');
        const kb = require('../../data/knowledge/knowledgeBase');
        const base = new kb.KnowledgeBase();
        const results = base.search ? base.search(query, options || {}) : [];
        success(res, { results });
      } catch (e) { error(res, e.message); }
    },
    postCacheInvalidate(req, res) {
      try {
        const { key, pattern } = req.body;
        const ci = require('../../data/cache/cacheInvalidation');
        const invalidator = new ci.CacheInvalidation();
        if (key) invalidator.invalidateByKey(null, key);
        if (pattern) invalidator.invalidateByPattern(null, pattern);
        success(res, { invalidated: true });
      } catch (e) { error(res, e.message); }
    },
    postBackup(req, res) {
      try {
        const { datasource, options } = req.body;
        if (!datasource) return error(res, 'Datasource required');
        const result = platform.createBackup(datasource, options || {});
        success(res, { backup: result });
      } catch (e) { error(res, e.message); }
    },
    postRestore(req, res) {
      try {
        const { id } = req.body;
        if (!id) return error(res, 'Backup ID required');
        const result = platform.restoreBackup(id);
        success(res, { restore: result });
      } catch (e) { error(res, e.message); }
    },
    postMigrate(req, res) {
      try {
        const { name, direction } = req.body;
        if (!name) return error(res, 'Migration name required');
        const result = platform.runMigration(name, direction || 'up');
        success(res, { migration: result });
      } catch (e) { error(res, e.message); }
    },
  };
}
module.exports = { getController };
