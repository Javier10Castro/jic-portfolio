function registerRuntimeRoutes(router, controller) {
  router.get('/runtime', controller.getOverview);
  router.get('/runtime/configuration', controller.getConfiguration);
  router.get('/runtime/flags', controller.getFlags);
  router.get('/runtime/secrets', controller.getSecrets);
  router.get('/runtime/services', controller.getServices);
  router.get('/runtime/rollouts', controller.getRollouts);
  router.get('/runtime/locks', controller.getLocks);
  router.post('/runtime/configuration', controller.postConfiguration);
  router.post('/runtime/flags', controller.postFlags);
  router.post('/runtime/rollouts', controller.postRollouts);
  router.post('/runtime/rollback', controller.postRollback);
  router.post('/runtime/kill-switch', controller.postKillSwitch);
  router.post('/runtime/safemode', controller.postSafeMode);
}
module.exports = { registerRuntimeRoutes };
