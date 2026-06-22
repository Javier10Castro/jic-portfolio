function registerComposerRoutes(router, controller) {
  router.get('/composer', controller.getComposer);
  router.post('/composer/compose', controller.compose);
  router.post('/composer/validate', controller.validate);
  router.post('/composer/simulate', controller.simulate);
  router.post('/composer/export', controller.exportComposition);
  router.get('/composer/templates', controller.getTemplates);
  router.get('/composer/capabilities', controller.getCapabilities);
  router.get('/composer/graph', controller.getGraph);
}
module.exports = { registerComposerRoutes };
