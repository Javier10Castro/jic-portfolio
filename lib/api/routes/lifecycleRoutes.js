function registerLifecycleRoutes(router, controller) {
  router.get('/projects/:id/lifecycle', controller.getLifecycle);
  router.get('/projects/:id/releases', controller.getReleases);
  router.get('/projects/:id/environments', controller.getEnvironments);
  router.get('/projects/:id/snapshots', controller.getSnapshots);
  router.post('/projects/:id/promote', controller.promote);
  router.post('/projects/:id/release', controller.createRelease);
  router.post('/projects/:id/snapshot', controller.createSnapshot);
  router.post('/projects/:id/import', controller.importProject);
  router.post('/projects/:id/export', controller.exportProject);
  router.post('/projects/:id/rollback', controller.rollback);
}
module.exports = { registerLifecycleRoutes };
