function registerGovernanceRoutes(router, controller) {
  router.get('/governance', controller.getOverview);
  router.get('/governance/policies', controller.getPolicies);
  router.get('/governance/policies/:id', controller.getPolicyById);
  router.get('/governance/compliance', controller.getCompliance);
  router.get('/governance/audit', controller.getAudit);
  router.get('/governance/approvals', controller.getApprovals);
  router.get('/governance/reports', controller.getReports);
  router.get('/governance/compliance/reports', controller.getComplianceReports);
  router.post('/governance/policies', controller.createPolicy);
  router.put('/governance/policies/:id', controller.updatePolicy);
  router.delete('/governance/policies/:id', controller.deletePolicy);
  router.post('/governance/simulate', controller.simulatePolicy);
  router.post('/governance/evaluate', controller.evaluatePolicy);
  router.post('/governance/approve', controller.approveRequest);
  router.post('/governance/rollback', controller.rollbackPolicy);
  router.post('/governance/compliance/scan', controller.runComplianceScan);
}

module.exports = { registerGovernanceRoutes };
