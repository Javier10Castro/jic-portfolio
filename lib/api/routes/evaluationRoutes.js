function registerEvaluationRoutes(router, controller) {
  router.get('/evaluation', controller.getStatus);
  router.get('/evaluation/history', controller.getHistory);
  router.get('/evaluation/reports', controller.getReports);
  router.get('/evaluation/prompts', controller.getPrompts);
  router.get('/evaluation/benchmarks', controller.getBenchmarks);
  router.get('/evaluation/experiments', controller.getExperiments);
  router.get('/evaluation/models', controller.getModels);
  router.get('/evaluation/agents', controller.getAgents);
  router.post('/evaluation/run', controller.runEvaluation);
  router.post('/evaluation/benchmark', controller.runBenchmark);
  router.post('/evaluation/experiment', controller.runExperiment);
  router.post('/evaluation/judge', controller.runJudge);
  router.post('/evaluation/compare', controller.compareModels);
  router.post('/evaluation/feedback', controller.submitFeedback);
}

module.exports = { registerEvaluationRoutes };
