function registerIntegrationRoutes(router, controller) {
  const { listIntegrations, listInstalled, listProviders, getProvider, connectIntegration, disconnectIntegration, syncIntegration, processWebhook, getHealth, getEvents, getStatus } = controller;

  router.get('/integrations', listIntegrations);
  router.get('/integrations/installed', listInstalled);
  router.get('/integrations/providers', listProviders);
  router.get('/integrations/status', getStatus);
  router.get('/integrations/:provider', getProvider);
  router.post('/integrations/connect', connectIntegration);
  router.post('/integrations/disconnect', disconnectIntegration);
  router.post('/integrations/sync', syncIntegration);
  router.post('/integrations/webhook', processWebhook);
  router.get('/integrations/health', getHealth);
  router.get('/integrations/events', getEvents);
}
module.exports = { registerIntegrationRoutes };
