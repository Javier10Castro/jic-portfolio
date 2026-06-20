const { Router } = require('express');
const cost = require('../controllers/costController');

function createCostRoutes() {
  const router = Router();
  router.get('/summary', cost.getSummary);
  router.get('/forecast', cost.getForecast);
  router.get('/recommendations', cost.getRecommendations);
  router.get('/quotas', cost.getQuotas);
  router.get('/budgets', cost.getBudgets);
  router.get('/policies', cost.getPolicies);
  router.post('/optimize', cost.postOptimize);
  router.post('/policies', cost.postPolicies);
  router.get('/alerts', cost.getAlerts);
  router.get('/pricing', cost.getPricing);
  router.get('/events', cost.getCostEvents);
  router.get('/health', cost.getHealth);
  return router;
}

module.exports = { createCostRoutes };
