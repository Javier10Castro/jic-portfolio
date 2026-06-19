const { Router } = require('express');
const { authenticate } = require('../middleware');
const cp = require('../controllers/controlPlaneController');
const es = require('../controllers/eventsStreamController');

function createControlPlaneRoutes() {
  const router = Router();

  router.get('/overview', cp.getSystemOverview);
  router.get('/events', cp.getEvents);
  router.get('/insights', cp.getInsights);
  router.get('/anomalies', cp.getAnomalies);
  router.get('/patterns', cp.getPatterns);
  router.get('/remediation/history', cp.getRemediationHistory);
  router.get('/remediation/policies', cp.getRemediationPolicies);
  router.get('/remediation/approvals', cp.getRemediationPendingApprovals);
  router.get('/cluster', cp.getClusterStatus);
  router.get('/workflows', cp.getWorkflowStatus);
  router.get('/events/stream', es.streamEvents);
  router.get('/sse/clients', es.getConnectedClients);

  return router;
}

module.exports = { createControlPlaneRoutes };
