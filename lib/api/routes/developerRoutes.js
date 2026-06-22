function registerDeveloperRoutes(router, controller) {
  const { generateSdk, generateOpenApi, getSchema, generatePostman, generateTerraform, generateGitHubAction, generateClient, getStatus, getPortal, getAnalytics } = controller;

  router.get('/developer', (req, res) => res.json({ success: true, message: 'Developer Platform API', version: '4.5.0' }));
  router.get('/developer/status', (req, res) => res.json(getStatus(req)));
  router.get('/developer/portal', (req, res) => res.json(getPortal(req)));
  router.get('/developer/sdk', (req, res) => res.json(generateSdk(req)));
  router.get('/developer/openapi', (req, res) => res.json(generateOpenApi(req)));
  router.get('/developer/schema', (req, res) => res.json(getSchema(req)));
  router.get('/developer/schema/:domain', (req, res) => res.json(getSchema(req)));
  router.get('/developer/postman', (req, res) => res.json(generatePostman(req)));
  router.get('/developer/terraform', (req, res) => res.json(generateTerraform(req)));
  router.get('/developer/github-action', (req, res) => res.json(generateGitHubAction(req)));
  router.get('/developer/analytics', (req, res) => res.json(getAnalytics(req)));
  router.post('/developer/client/generate', (req, res) => res.json(generateClient(req)));
  router.post('/developer/sdk/generate', (req, res) => res.json(generateSdk(req)));
}

module.exports = { registerDeveloperRoutes };
