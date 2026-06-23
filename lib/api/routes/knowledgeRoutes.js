function registerKnowledgeRoutes(router, controller) {
  router.get('/knowledge', controller.getKnowledge);
  router.post('/knowledge/ingest', controller.ingest);
  router.post('/knowledge/query', controller.query);
  router.post('/knowledge/recommend', controller.recommend);
  router.get('/knowledge/graph', controller.getGraph);
  router.get('/knowledge/patterns', controller.getPatterns);
  router.get('/knowledge/lessons', controller.getLessons);
  router.post('/knowledge/similar-projects', controller.getSimilarProjects);
}

module.exports = { registerKnowledgeRoutes };
