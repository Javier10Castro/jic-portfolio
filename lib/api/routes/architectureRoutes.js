function registerArchitectureRoutes(router, controller) {
  router.get('/architecture', controller.getArchitecture);
  router.post('/architecture/design', controller.design);
  router.post('/architecture/validate', controller.validate);
  router.post('/architecture/analyze', controller.analyze);
  router.post('/architecture/export', controller.exportArchitecture);
  router.get('/architecture/patterns', controller.getPatterns);
  router.get('/architecture/decisions', controller.getDecisions);
  router.get('/architecture/graph', controller.getGraph);
}
module.exports = { registerArchitectureRoutes };
