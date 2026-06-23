function registerEvolutionRoutes(router, controller) {
  router.get('/evolution', controller.getEvolution);
  router.post('/evolution/analyze', controller.analyze);
  router.post('/evolution/plan', controller.plan);
  router.post('/evolution/simulate', controller.simulate);
  router.post('/evolution/validate', controller.validate);
  router.post('/evolution/export', controller.exportEvolution);
  router.get('/evolution/history', controller.getHistory);
  router.get('/evolution/roadmap', controller.getRoadmap);
}

module.exports = { registerEvolutionRoutes };
