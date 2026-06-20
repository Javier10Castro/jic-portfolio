const CostEngine = require('./costEngine');
const CostAnalyzer = require('./costAnalyzer');
const { PricingModels, PRICING } = require('./pricingModels');
const { BudgetManager, DEFAULT_BUDGETS } = require('./budgetManager');
const Optimizer = require('./optimizer');
const ForecastEngine = require('./forecastEngine');
const RecommendationEngine = require('./recommendationEngine');
const { QuotaManager, DEFAULT_QUOTA_LIMITS } = require('./quotaManager');
const { PolicyEngine, DEFAULT_POLICIES } = require('./policyEngine');
const { CostEvents, EVENT_TYPES } = require('./costEvents');

let _defaultEngine = null;

function createCostEngine(options = {}) {
  return new CostEngine(options);
}

function getCostEngine() {
  if (!_defaultEngine) _defaultEngine = createCostEngine();
  return _defaultEngine;
}

function resetDefaultEngine() {
  _defaultEngine = null;
}

module.exports = {
  CostEngine,
  CostAnalyzer,
  PricingModels,
  BudgetManager,
  Optimizer,
  ForecastEngine,
  RecommendationEngine,
  QuotaManager,
  PolicyEngine,
  CostEvents,
  PRICING,
  DEFAULT_BUDGETS,
  DEFAULT_QUOTA_LIMITS,
  DEFAULT_POLICIES,
  EVENT_TYPES,
  createCostEngine,
  getCostEngine,
  resetDefaultEngine,
};
