const { success, error } = require('../responses');

function _getEngine() {
  try { return require('../../cost').getCostEngine(); } catch (e) { return null; }
}

function getSummary(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, getEmptyReport());
  const report = engine.getReport();
  return success(res, report);
}

function getForecast(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, { forecast: null });
  const snapshots = engine.analyzer.getSnapshots(parseInt(req.query.snapshots) || 30);
  const forecast = engine.forecast(snapshots);
  return success(res, { forecast, snapshots: snapshots.slice(-7) });
}

function getRecommendations(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, []);
  const filter = {};
  if (req.query.impact) filter.impact = req.query.impact;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.limit) filter.limit = parseInt(req.query.limit);
  return success(res, engine.recommender.getRecommendations(filter));
}

function getQuotas(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, {});
  const period = req.query.period || 'daily';
  const quotas = engine.quotas.getAllUsage(period);
  return success(res, { quotas, status: engine.quotas.getQuotaStatus() });
}

function getBudgets(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, []);
  const filter = {};
  if (req.query.scope) filter.scope = req.query.scope;
  if (req.query.enabled !== undefined) filter.enabled = req.query.enabled === 'true';
  return success(res, { budgets: engine.budgets.getBudgets(filter), alerts: engine.budgets.getAlerts({ limit: 50 }) });
}

function getPolicies(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, []);
  return success(res, engine.policies.getPolicies(req.query));
}

function postOptimize(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, { optimized: false, error: 'Engine not available' });
  const sources = req.body?.sources || {};
  const result = engine.analyze(sources);
  return success(res, { optimized: true, recommendations: result?.recommendations || [], savingsOpportunity: result?.savingsOpportunity || 0 });
}

function postPolicies(req, res) {
  const engine = _getEngine();
  if (!engine) return error(res, { message: 'Engine not available', statusCode: 500 });
  try {
    const body = req.body;
    if (body.id) {
      const existing = engine.policies.getPolicy(body.id);
      if (existing) {
        const updated = engine.policies.updatePolicy(body.id, body);
        return success(res, updated);
      }
    }
    const added = engine.policies.addPolicy(body);
    return success(res, added);
  } catch (e) {
    return error(res, { message: e.message, statusCode: 400 });
  }
}

function getAlerts(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, []);
  const filter = {};
  if (req.query.budgetId) filter.budgetId = req.query.budgetId;
  if (req.query.level) filter.level = req.query.level;
  if (req.query.limit) filter.limit = parseInt(req.query.limit);
  return success(res, engine.budgets.getAlerts(filter));
}

function getPricing(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, {});
  const provider = req.query.provider;
  return success(res, { providers: engine.pricing.getSupportedProviders(), models: engine.pricing.getModels(provider), pricing: provider ? engine.pricing.getModels(provider) : engine.pricing.getModels() });
}

function getCostEvents(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, []);
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.limit) filter.limit = parseInt(req.query.limit);
  return success(res, engine.events.getHistory(filter));
}

function getHealth(req, res) {
  const engine = _getEngine();
  if (!engine) return success(res, { available: false });
  return success(res, engine.getHealth());
}

function getEmptyReport() {
  return { totalCost: 0, projectedCost: 0, savingsOpportunity: 0, providerBreakdown: [], quotaUsage: { daily: [], monthly: [], hasExceededQuota: false }, recommendations: [], alerts: [], budgetStatus: {}, snapshot: null, forecast: null, timestamp: Date.now() };
}

module.exports = { getSummary, getForecast, getRecommendations, getQuotas, getBudgets, getPolicies, postOptimize, postPolicies, getAlerts, getPricing, getCostEvents, getHealth };
