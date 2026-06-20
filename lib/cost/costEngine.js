const CostAnalyzer = require('./costAnalyzer');
const { PricingModels } = require('./pricingModels');
const { BudgetManager } = require('./budgetManager');
const Optimizer = require('./optimizer');
const ForecastEngine = require('./forecastEngine');
const RecommendationEngine = require('./recommendationEngine');
const { QuotaManager } = require('./quotaManager');
const { PolicyEngine } = require('./policyEngine');
const { CostEvents } = require('./costEvents');

class CostEngine {
  constructor(options = {}) {
    this._pricing = options.pricingModels || new PricingModels(options.customPricing);
    this._analyzer = new CostAnalyzer({ pricingModels: this._pricing, maxSnapshots: options.maxSnapshots || 1000 });
    this._budgets = new BudgetManager({ maxAlerts: options.maxAlerts || 500, defaultBudgets: options.defaultBudgets !== false });
    this._optimizer = new Optimizer();
    this._forecaster = new ForecastEngine();
    this._recommender = new RecommendationEngine();
    this._quotas = new QuotaManager({ limits: options.quotaLimits });
    this._policies = new PolicyEngine({ defaultPolicies: options.defaultPolicies !== false });
    this._events = new CostEvents({ maxHistory: options.maxEventHistory || 500 });
    this._enabled = true;
    this._totalAnalyses = 0;
  }

  get pricing() { return this._pricing; }
  get analyzer() { return this._analyzer; }
  get budgets() { return this._budgets; }
  get optimizer() { return this._optimizer; }
  get forecaster() { return this._forecaster; }
  get recommender() { return this._recommender; }
  get quotas() { return this._quotas; }
  get policies() { return this._policies; }
  get events() { return this._events; }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }
  isEnabled() { return this._enabled; }

  analyze(sources = {}) {
    if (!this._enabled) return null;
    this._totalAnalyses++;
    const snapshot = this._analyzer.snapshot(sources.ai || [], sources.cluster || {}, sources.workflows || [], sources.deployments || [], sources.storage || [], sources.api || []);
    const budgetStatus = this._budgets.getAlerts({ limit: 10 });
    const quotaStatus = this._quotas.getQuotaStatus();
    const recommendations = this._recommender.generate(snapshot, { alerts: budgetStatus }, quotaStatus, this._policies.getPolicies());
    const forecast = this._forecaster.predict(this._analyzer.getSnapshots(30));
    const optimization = this._optimizer.optimize(snapshot);

    this._budgets.recordSpend(snapshot.totalCost, 'total');

    this._events.emitCostUpdated({ totalCost: snapshot.totalCost, breakdown: { ai: snapshot.ai.totalCost, cluster: snapshot.cluster.estimatedDailyCost, workflows: snapshot.workflows.totalCost, deployments: snapshot.deployments.totalCost, api: snapshot.api.totalCost }, timestamp: snapshot.timestamp });

    for (const alert of budgetStatus) {
      this._events.emitBudgetWarning({ budgetId: alert.budgetId, message: alert.message || `Budget alert: ${alert.currentPercent}%` });
    }
    if (quotaStatus.hasExceededQuota) {
      this._events.emitQuotaWarning({ exceeded: quotaStatus.dailyExceeded.map(q => q.key) });
    }

    return { snapshot, budgetStatus, quotaStatus, recommendations, forecast, optimization, totalCost: snapshot.totalCost, projectedCost: forecast.projected?.monthly || 0, savingsOpportunity: optimization.totalEstimatedSavings, providerBreakdown: snapshot.ai.breakdown || [], quotaUsage: quotaStatus, timestamp: Date.now() };
  }

  optimize(sources = {}) {
    if (!this._enabled) return null;
    const analysis = this.analyze(sources);
    return analysis?.optimization || null;
  }

  forecast(snapshots) {
    return this._forecaster.predict(snapshots || this._analyzer.getSnapshots(30));
  }

  recommend() {
    if (!this._enabled) return [];
    const latest = this._analyzer.getLatestSnapshot();
    if (!latest) return [];
    return this._recommender.getRecommendations();
  }

  getReport() {
    if (!this._enabled) return null;
    const latest = this._analyzer.getLatestSnapshot();
    if (!latest) return this._emptyReport();
    const forecast = this._forecaster.getLatestForecast();
    const recommendations = this._recommender.getRecommendations({ limit: 20 });
    const quotaStatus = this._quotas.getQuotaStatus();
    const budgetAlerts = this._budgets.getAlerts({ limit: 20 });
    const optimization = this._optimizer.getHistory(1)[0] || { totalEstimatedSavings: 0 };
    return { totalCost: latest.totalCost, projectedCost: forecast?.projected?.monthly || 0, savingsOpportunity: optimization.totalEstimatedSavings || 0, providerBreakdown: latest.ai.breakdown || [], quotaUsage: quotaStatus, recommendations, alerts: budgetAlerts, budgetStatus: { daily: this._budgets.getCurrentDailySpend(), monthly: this._budgets.getCurrentMonthlySpend() }, snapshot: latest, forecast, timestamp: Date.now() };
  }

  getHealth() {
    return { enabled: this._enabled, totalAnalyses: this._totalAnalyses, snapshotCount: this._analyzer.getSnapshots(1).length, budgetCount: this._budgets.getBudgets().length, policyCount: this._policies.getPolicies().length, recommendationCount: this._recommender.getRecommendations().length, forecastAvailable: this._forecaster.getLatestForecast() !== null };
  }

  clear() {
    this._analyzer.clear();
    this._budgets.clear();
    this._optimizer.clear();
    this._forecaster.clear();
    this._recommender.clear();
    this._quotas.clear();
    this._policies.clear();
    this._events.clear();
    this._totalAnalyses = 0;
  }

  _emptyReport() {
    return { totalCost: 0, projectedCost: 0, savingsOpportunity: 0, providerBreakdown: [], quotaUsage: { daily: [], monthly: [], hasExceededQuota: false }, recommendations: [], alerts: [], budgetStatus: {}, snapshot: null, forecast: null, timestamp: Date.now() };
  }
}

module.exports = CostEngine;
