function registerDataRoutes(router, controller) {
  router.get('/data', controller.getOverview);
  router.get('/data/providers', controller.getProviders);
  router.get('/data/storage', controller.getStorage);
  router.get('/data/cache', controller.getCache);
  router.get('/data/vector', controller.getVector);
  router.get('/data/search', controller.getSearch);
  router.get('/data/backups', controller.getBackups);
  router.get('/data/analytics', controller.getAnalytics);
  router.post('/data/query', controller.postQuery);
  router.post('/data/vector/search', controller.postVectorSearch);
  router.post('/data/knowledge/search', controller.postKnowledgeSearch);
  router.post('/data/cache/invalidate', controller.postCacheInvalidate);
  router.post('/data/backup', controller.postBackup);
  router.post('/data/restore', controller.postRestore);
  router.post('/data/migrate', controller.postMigrate);
}
module.exports = { registerDataRoutes };
