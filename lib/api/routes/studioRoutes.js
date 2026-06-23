function registerStudioRoutes(router, controller) {
  router.get('/studio/health', controller.health);
  router.get('/studio', controller.getStatus);
  router.post('/studio/project', controller.createProject);
  router.get('/studio/project/:projectId', controller.getProject);
  router.get('/studio/project/:projectId/build', controller.getBuildStatus);
  router.get('/studio/project/:projectId/workspace', controller.getWorkspace);
  router.get('/studio/projects', controller.listProjects);
  router.post('/studio/pipeline/advance', controller.advanceStage);
  router.post('/studio/pipeline/complete', controller.completeStage);
}

module.exports = { registerStudioRoutes };
