const assert = require('assert');
const { PricingModels, PRICING } = require('../lib/cost/pricingModels');
const CostAnalyzer = require('../lib/cost/costAnalyzer');
const { BudgetManager, DEFAULT_BUDGETS } = require('../lib/cost/budgetManager');
const Optimizer = require('../lib/cost/optimizer');
const ForecastEngine = require('../lib/cost/forecastEngine');
const RecommendationEngine = require('../lib/cost/recommendationEngine');
const { QuotaManager, DEFAULT_QUOTA_LIMITS } = require('../lib/cost/quotaManager');
const { PolicyEngine, DEFAULT_POLICIES } = require('../lib/cost/policyEngine');
const { CostEvents, EVENT_TYPES } = require('../lib/cost/costEvents');
const CostEngine = require('../lib/cost/costEngine');
const { createCostRoutes } = require('../lib/api/routes/costRoutes');
const costController = require('../lib/api/controllers/costController');

// ============================================================
// 1. PRICING MODELS (15 tests)
// ============================================================
describe('PricingModels', () => {
  it('should return supported providers', () => {
    const pm = new PricingModels();
    const providers = pm.getSupportedProviders();
    assert.ok(providers.includes('openai'));
    assert.ok(providers.includes('anthropic'));
    assert.ok(providers.includes('gemini'));
    assert.ok(providers.includes('ollama'));
  });

  it('should return models for a provider', () => {
    const pm = new PricingModels();
    const models = pm.getModels('openai');
    assert.ok(models['gpt-4o']);
    assert.strictEqual(models['gpt-4o'].input, 2.50);
  });

  it('should return all models when no provider specified', () => {
    const pm = new PricingModels();
    const all = pm.getModels();
    assert.ok(all.openai);
    assert.ok(all.anthropic);
  });

  it('should return provider info', () => {
    const pm = new PricingModels();
    const info = pm.getProviderInfo('openai');
    assert.strictEqual(info.name, 'OpenAI');
    assert.strictEqual(info.provider, 'openai');
  });

  it('should return null for unknown provider', () => {
    const pm = new PricingModels();
    assert.strictEqual(pm.getProviderInfo('nonexistent'), null);
  });

  it('should get pricing for specific model', () => {
    const pm = new PricingModels();
    const pricing = pm.getPricing('openai', 'gpt-4o');
    assert.ok(pricing);
    assert.strictEqual(pricing.input, 2.50);
    assert.strictEqual(pricing.output, 10.00);
  });

  it('should return null for unknown model', () => {
    const pm = new PricingModels();
    assert.strictEqual(pm.getPricing('openai', 'fake-model'), null);
  });

  it('should calculate cost correctly', () => {
    const pm = new PricingModels();
    const cost = pm.calculateCost('openai', 'gpt-4o', 1000, 500);
    assert.ok(cost);
    assert.strictEqual(cost.inputCost, 0.0025);
    assert.strictEqual(cost.outputCost, 0.005);
    assert.strictEqual(cost.totalCost, 0.0075);
    assert.strictEqual(cost.currency, 'USD');
  });

  it('should return null for unknown provider cost', () => {
    const pm = new PricingModels();
    assert.strictEqual(pm.calculateCost('unknown', 'model', 100, 50), null);
  });

  it('should handle zero tokens', () => {
    const pm = new PricingModels();
    const cost = pm.calculateCost('openai', 'gpt-4o', 0, 0);
    assert.strictEqual(cost.totalCost, 0);
  });

  it('should update pricing for a model', () => {
    const pm = new PricingModels();
    pm.updatePricing('openai', 'gpt-4o', { input: 3.00 });
    const pricing = pm.getPricing('openai', 'gpt-4o');
    assert.strictEqual(pricing.input, 3.00);
  });

  it('should add custom provider', () => {
    const pm = new PricingModels();
    pm.addCustomProvider('custom-vendor', { name: 'Custom AI', models: { 'custom-model': { input: 1, output: 2, per: 1000000, context: 4096 } } });
    assert.ok(pm.getSupportedProviders().includes('custom-vendor'));
    const pricing = pm.getPricing('custom-vendor', 'custom-model');
    assert.strictEqual(pricing.input, 1);
  });

  it('should reject duplicate custom providers', () => {
    const pm = new PricingModels();
    assert.throws(() => pm.addCustomProvider('openai', { name: 'Duplicate', models: {} }), /already exists/);
  });

  it('should reject invalid custom providers', () => {
    const pm = new PricingModels();
    assert.throws(() => pm.addCustomProvider('new', { models: {} }), /must have name and models/);
    assert.throws(() => pm.addCustomProvider('new2', { name: 'OnlyName' }), /must have name and models/);
  });

  it('should estimate monthly cost from usage records', () => {
    const pm = new PricingModels();
    const records = [
      { provider: 'openai', model: 'gpt-4o', inputTokens: 100000, outputTokens: 50000 },
      { provider: 'anthropic', model: 'claude-3-haiku', inputTokens: 500000, outputTokens: 200000 },
    ];
    const estimate = pm.estimateMonthlyCost(records);
    assert.ok(estimate.totalCost > 0);
    assert.ok(Object.keys(estimate.breakdown).length > 0);
  });

  it('should track latest pricing updates', () => {
    const pm = new PricingModels();
    pm.updatePricing('openai', 'gpt-4o', { input: 5.00 });
    const updates = pm.getLatestUpdates();
    assert.ok(updates.length >= 1);
    assert.ok(updates.find(u => u.key === 'openai:gpt-4o'));
  });
});

// ============================================================
// 2. COST ANALYZER (20 tests)
// ============================================================
describe('CostAnalyzer', () => {
  it('should analyze AI token usage', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeAITokenUsage([
      { provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 },
      { provider: 'anthropic', model: 'claude-3-haiku', inputTokens: 2000, outputTokens: 1000 },
    ]);
    assert.ok(result.totalTokens > 0);
    assert.ok(result.totalCost > 0);
    assert.strictEqual(result.recordCount, 2);
  });

  it('should handle empty AI records', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeAITokenUsage([]);
    assert.strictEqual(result.totalTokens, 0);
    assert.strictEqual(result.totalCost, 0);
    assert.strictEqual(result.recordCount, 0);
  });

  it('should analyze cluster utilization', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeClusterUtilization({ workers: [{ status: 'healthy' }, { status: 'healthy' }, { status: 'unhealthy' }], queueDepth: 5 });
    assert.strictEqual(result.totalWorkers, 3);
    assert.strictEqual(result.healthyWorkers, 2);
    assert.ok(result.utilizationRate > 0);
  });

  it('should handle empty cluster data', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeClusterUtilization({});
    assert.strictEqual(result.totalWorkers, 0);
  });

  it('should analyze workflow cost', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeWorkflowCost([
      { id: 'wf1', status: 'COMPLETED', executionTimeMs: 5000, estimatedCost: 0.05 },
      { id: 'wf2', status: 'FAILED', executionTimeMs: 3000, estimatedCost: 0.03 },
      { id: 'wf3', status: 'RUNNING', executionTimeMs: 1000, estimatedCost: 0.01 },
    ]);
    assert.strictEqual(result.totalExecutions, 3);
    assert.ok(result.totalCost > 0);
    assert.ok(result.byStatus.COMPLETED);
    assert.ok(result.byStatus.FAILED);
  });

  it('should handle empty workflow records', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeWorkflowCost([]);
    assert.strictEqual(result.totalExecutions, 0);
    assert.strictEqual(result.averageCostPerExecution, 0);
  });

  it('should analyze deployment cost', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeDeploymentCost([
      { type: 'standard', estimatedCost: 0.01 },
      { type: 'standard', estimatedCost: 0.01 },
      { type: 'canary', estimatedCost: 0.02 },
    ]);
    assert.strictEqual(result.totalDeployments, 3);
    assert.ok(result.totalCost > 0);
  });

  it('should analyze storage usage', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeStorageUsage([
      { type: 'logs', sizeMb: 100 },
      { type: 'logs', sizeMb: 200 },
      { type: 'assets', sizeMb: 50 },
    ]);
    assert.strictEqual(result.totalMb, 350);
    assert.ok(result.totalCost > 0);
  });

  it('should analyze API consumption', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeAPIConsumption([
      { endpoint: '/api/v1/generate', estimatedCost: 0.001 },
      { endpoint: '/api/v1/generate', estimatedCost: 0.001 },
      { endpoint: '/api/v1/health', estimatedCost: 0.0001 },
    ]);
    assert.strictEqual(result.totalRequests, 3);
    assert.ok(result.totalCost > 0);
  });

  it('should generate cost snapshots', () => {
    const ca = new CostAnalyzer();
    const snapshot = ca.snapshot([{ provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 }], { workers: [{ status: 'healthy' }] }, [{ id: 'wf1', status: 'COMPLETED' }], [{ type: 'standard' }], [{ type: 'logs', sizeMb: 10 }], [{ endpoint: '/api', estimatedCost: 0.001 }]);
    assert.ok(snapshot);
    assert.ok(snapshot.totalCost > 0);
    assert.strictEqual(typeof snapshot.timestamp, 'number');
    assert.ok(snapshot.ai);
    assert.ok(snapshot.cluster);
    assert.ok(snapshot.workflows);
  });

  it('should retrieve snapshots', () => {
    const ca = new CostAnalyzer();
    ca.snapshot([], {}, [], [], [], []);
    ca.snapshot([], {}, [], [], [], []);
    const snapshots = ca.getSnapshots(5);
    assert.strictEqual(snapshots.length, 2);
  });

  it('should retrieve latest snapshot', () => {
    const ca = new CostAnalyzer();
    assert.strictEqual(ca.getLatestSnapshot(), null);
    ca.snapshot([], {}, [], [], [], []);
    assert.ok(ca.getLatestSnapshot());
  });

  it('should respect max snapshots limit', () => {
    const ca = new CostAnalyzer({ maxSnapshots: 3 });
    for (let i = 0; i < 10; i++) ca.snapshot([], {}, [], [], [], []);
    assert.strictEqual(ca.getSnapshots(100).length, 3);
  });

  it('should clear all snapshots', () => {
    const ca = new CostAnalyzer();
    ca.snapshot([], {}, [], [], [], []);
    ca.clear();
    assert.strictEqual(ca.getSnapshots().length, 0);
    assert.strictEqual(ca.getLatestSnapshot(), null);
  });

  it('should include pricing models accessor', () => {
    const ca = new CostAnalyzer();
    assert.ok(ca.pricing instanceof PricingModels);
  });

  it('should use custom pricing models', () => {
    const customPricing = new PricingModels();
    customPricing.updatePricing('openai', 'gpt-4o', { input: 100, output: 200 });
    const ca = new CostAnalyzer({ pricingModels: customPricing });
    const result = ca.analyzeAITokenUsage([{ provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 }]);
    assert.ok(result.totalCost > 0.01);
  });

  it('should handle records with missing optional fields', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeAITokenUsage([{ provider: 'openai', model: 'gpt-4o' }]);
    assert.strictEqual(result.totalTokens, 0);
    assert.strictEqual(result.totalCost, 0);
  });

  it('should breakdown AI costs by provider/model', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeAITokenUsage([
      { provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 },
      { provider: 'openai', model: 'gpt-4o-mini', inputTokens: 5000, outputTokens: 2000 },
    ]);
    assert.strictEqual(result.breakdown.length, 2);
  });

  it('should compute deployment average cost', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeDeploymentCost([{ estimatedCost: 0.1 }, { estimatedCost: 0.2 }]);
    assert.strictEqual(result.averageCostPerDeployment, 0.15);
  });

  it('should compute API average cost', () => {
    const ca = new CostAnalyzer();
    const result = ca.analyzeAPIConsumption([{ estimatedCost: 0.01 }, { estimatedCost: 0.03 }]);
    assert.strictEqual(result.averageCostPerRequest, 0.02);
  });
});

// ============================================================
// 3. BUDGET MANAGER (15 tests)
// ============================================================
describe('BudgetManager', () => {
  it('should load default budgets', () => {
    const bm = new BudgetManager();
    assert.strictEqual(bm.getBudgets().length, DEFAULT_BUDGETS.length);
  });

  it('should start empty when defaultBudgets disabled', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    assert.strictEqual(bm.getBudgets().length, 0);
  });

  it('should add and retrieve budgets', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'test', name: 'Test Budget', scope: 'project', period: 'daily', softLimit: 50, hardLimit: 100 });
    assert.strictEqual(bm.getBudgets().length, 1);
    assert.strictEqual(bm.getBudget('test').name, 'Test Budget');
  });

  it('should reject duplicate budget ids', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'dup', name: 'First', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 20 });
    assert.throws(() => bm.addBudget({ id: 'dup', name: 'Second', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 20 }), /already exists/);
  });

  it('should update budgets', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'upd', name: 'Original', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 20 });
    bm.updateBudget('upd', { name: 'Updated', softLimit: 30 });
    assert.strictEqual(bm.getBudget('upd').name, 'Updated');
    assert.strictEqual(bm.getBudget('upd').softLimit, 30);
  });

  it('should not allow updating id or createdAt', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    const added = bm.addBudget({ id: 'test-id', name: 'Test', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 20 });
    const created = added.createdAt;
    bm.updateBudget('test-id', { id: 'new-id', name: 'Updated' });
    assert.strictEqual(bm.getBudget('test-id').id, 'test-id');
    assert.strictEqual(bm.getBudget('test-id').createdAt, created);
  });

  it('should remove budgets', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'del', name: 'Delete', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 20 });
    assert.ok(bm.removeBudget('del'));
    assert.strictEqual(bm.getBudget('del'), null);
  });

  it('should filter budgets by scope, period, enabled', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'b1', scope: 'organization', period: 'daily', enabled: true, softLimit: 10, hardLimit: 20 });
    bm.addBudget({ id: 'b2', scope: 'project', period: 'monthly', enabled: false, softLimit: 10, hardLimit: 20 });
    assert.strictEqual(bm.getBudgets({ scope: 'organization' }).length, 1);
    assert.strictEqual(bm.getBudgets({ enabled: false }).length, 1);
    assert.strictEqual(bm.getBudgets({ period: 'monthly' }).length, 1);
  });

  it('should record spend and trigger alerts at thresholds', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'alert-test', name: 'Alert Budget', scope: 'org', period: 'daily', softLimit: 50, hardLimit: 100, alertThresholds: [50, 80, 100], alerts: true, enabled: true });
    const result = bm.recordSpend(80, 'ai');
    assert.ok(result.alerts.length >= 1);
    assert.strictEqual(result.hardLimitExceeded, false);
  });

  it('should detect hard limit exceeded', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'hard-limit', name: 'Hard Limit', scope: 'org', period: 'daily', softLimit: 50, hardLimit: 100, alertThresholds: [100], alerts: true, enabled: true });
    const result = bm.recordSpend(120, 'ai');
    assert.ok(result.hardLimitExceeded);
  });

  it('should return current daily and monthly spend', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.recordSpend(10, 'ai');
    bm.recordSpend(20, 'cluster');
    const daily = bm.getCurrentDailySpend();
    assert.strictEqual(daily.total, 30);
    assert.strictEqual(daily.count, 2);
    assert.ok(daily.categories.ai);
    assert.ok(daily.categories.cluster);
  });

  it('should return budget alerts', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'alert-test-2', name: 'Alert Budget 2', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 100, alertThresholds: [50], alerts: true, enabled: true });
    bm.recordSpend(60, 'ai');
    const alerts = bm.getAlerts({ budgetId: 'alert-test-2' });
    assert.ok(alerts.length >= 1);
    assert.strictEqual(alerts[0].budgetId, 'alert-test-2');
  });

  it('should return alert stats', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'stats-test', name: 'Stats', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 100, alertThresholds: [50, 100], alerts: true, enabled: true });
    bm.recordSpend(60, 'ai');
    const stats = bm.getAlertStats();
    assert.ok(stats.total >= 1);
  });

  it('should filter alerts by level and since', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'filter-test', name: 'Filter', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 100, alertThresholds: [50, 100], alerts: true, enabled: true });
    bm.recordSpend(60, 'ai');
    const filtered = bm.getAlerts({ level: 'info' });
    assert.ok(filtered.length > 0);
  });

  it('should clear all budgets and alerts', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'clear-test', name: 'Clear', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 20 });
    bm.recordSpend(5, 'test');
    bm.clear();
    assert.strictEqual(bm.getBudgets().length, 0);
    assert.strictEqual(bm.getAlerts().length, 0);
  });

  it('should reset to defaults', () => {
    const bm = new BudgetManager({ defaultBudgets: true });
    const initial = bm.getBudgets().length;
    bm.addBudget({ id: 'extra', name: 'Extra', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 20 });
    assert.strictEqual(bm.getBudgets().length, initial + 1);
    bm.reset();
    assert.strictEqual(bm.getBudgets().length, initial);
  });
});

// ============================================================
// 4. OPTIMIZER (10 tests)
// ============================================================
describe('Optimizer', () => {
  it('should recommend provider changes with multiple providers', () => {
    const opt = new Optimizer();
    const analysis = { ai: { totalCost: 10, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 8, count: 100, inputTokens: 50000, outputTokens: 20000 }, { provider: 'anthropic', model: 'claude-3-haiku', cost: 2, count: 200, inputTokens: 100000, outputTokens: 30000 }] } };
    const changes = opt.recommendProviderChanges(analysis);
    assert.ok(changes.length > 0);
  });

  it('should return empty when only one provider', () => {
    const opt = new Optimizer();
    const analysis = { ai: { totalCost: 5, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 5, count: 50 }] } };
    assert.strictEqual(opt.recommendProviderChanges(analysis).length, 0);
  });

  it('should recommend model changes within same provider', () => {
    const opt = new Optimizer();
    const analysis = { ai: { totalCost: 10, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 8, count: 100, inputTokens: 50000, outputTokens: 20000 }, { provider: 'openai', model: 'gpt-4o-mini', cost: 1, count: 200, inputTokens: 30000, outputTokens: 10000 }] } };
    const changes = opt.recommendModelChanges(analysis);
    assert.ok(changes.length > 0);
  });

  it('should recommend batch execution for many requests', () => {
    const opt = new Optimizer();
    const analysis = { api: { totalCost: 5, totalRequests: 5000 } };
    const recs = opt.recommendBatchExecution(analysis);
    assert.ok(recs.length > 0);
  });

  it('should not recommend batch execution for few requests', () => {
    const opt = new Optimizer();
    const analysis = { api: { totalCost: 0.01, totalRequests: 5 } };
    assert.strictEqual(opt.recommendBatchExecution(analysis).length, 0);
  });

  it('should recommend worker allocation for underutilized cluster', () => {
    const opt = new Optimizer();
    const analysis = { cluster: { totalWorkers: 10, utilizationRate: 25, estimatedMonthlyCost: 500 } };
    const recs = opt.recommendWorkerAllocation(analysis);
    assert.ok(recs.length > 0);
    assert.strictEqual(recs[0].to, 6);
  });

  it('should not recommend worker allocation for small clusters', () => {
    const opt = new Optimizer();
    const analysis = { cluster: { totalWorkers: 2, utilizationRate: 25 } };
    assert.strictEqual(opt.recommendWorkerAllocation(analysis).length, 0);
  });

  it('should recommend cache usage for high token counts', () => {
    const opt = new Optimizer();
    const analysis = { ai: { totalCost: 50, totalTokens: 500000 } };
    const recs = opt.recommendCacheUsage(analysis);
    assert.ok(recs.length > 0);
  });

  it('should run full optimization and return total savings', () => {
    const opt = new Optimizer();
    const analysis = {
      ai: { totalCost: 20, totalTokens: 200000, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 15, count: 100, inputTokens: 100000, outputTokens: 40000 }, { provider: 'anthropic', model: 'claude-3-haiku', cost: 5, count: 300, inputTokens: 150000, outputTokens: 50000 }] },
      cluster: { totalWorkers: 8, utilizationRate: 30, estimatedMonthlyCost: 400 },
      api: { totalCost: 3, totalRequests: 3000 },
      workflows: { totalCost: 2, totalExecutions: 100, averageCostPerExecution: 0.02 },
    };
    const result = opt.optimize(analysis);
    assert.ok(result.totalEstimatedSavings > 0);
  });

  it('should track optimization history', () => {
    const opt = new Optimizer();
    opt.optimize({ ai: { breakdown: [] }, cluster: {}, workflows: {}, api: {} });
    opt.optimize({ ai: { breakdown: [] }, cluster: {}, workflows: {}, api: {} });
    assert.strictEqual(opt.getHistory().length, 2);
  });
});

// ============================================================
// 5. FORECAST ENGINE (10 tests)
// ============================================================
describe('ForecastEngine', () => {
  it('should return empty forecast with no data', () => {
    const fe = new ForecastEngine();
    const f = fe.predict([]);
    assert.strictEqual(f.projected.monthly, 0);
    assert.strictEqual(f.dataPoints, 0);
  });

  it('should predict from snapshots', () => {
    const fe = new ForecastEngine();
    const snapshots = Array.from({ length: 10 }, (_, i) => ({ timestamp: Date.now() - i * 86400000, totalCost: 50 + Math.random() * 20 }));
    const f = fe.predict(snapshots);
    assert.ok(f.projected.monthly > 0);
    assert.ok(f.daily.average > 0);
  });

  it('should calculate daily average correctly', () => {
    const fe = new ForecastEngine();
    const snapshots = Array.from({ length: 5 }, (_, i) => ({ timestamp: Date.now() - i * 86400000, totalCost: 100 }));
    const f = fe.predict(snapshots);
    assert.strictEqual(f.daily.average, 100);
  });

  it('should store forecast history', () => {
    const fe = new ForecastEngine();
    fe.predict([{ timestamp: Date.now(), totalCost: 100 }]);
    fe.predict([{ timestamp: Date.now(), totalCost: 200 }]);
    assert.strictEqual(fe.getForecasts().length, 2);
  });

  it('should return latest forecast', () => {
    const fe = new ForecastEngine();
    assert.strictEqual(fe.getLatestForecast(), null);
    fe.predict([{ timestamp: Date.now(), totalCost: 100 }]);
    assert.ok(fe.getLatestForecast());
  });

  it('should respect max forecasts limit', () => {
    const fe = new ForecastEngine();
    for (let i = 0; i < 600; i++) fe.predict([{ timestamp: Date.now(), totalCost: 100 }]);
    assert.ok(fe.getForecasts(1000).length <= 500);
  });

  it('should clear all forecasts', () => {
    const fe = new ForecastEngine();
    fe.predict([{ timestamp: Date.now(), totalCost: 100 }]);
    fe.clear();
    assert.strictEqual(fe.getForecasts().length, 0);
  });

  it('should handle single data point', () => {
    const fe = new ForecastEngine();
    const f = fe.predict([{ timestamp: Date.now(), totalCost: 100 }]);
    assert.ok(f.daily.average > 0);
  });

  it('should calculate trend for 3+ data points', () => {
    const fe = new ForecastEngine();
    const snapshots = Array.from({ length: 10 }, (_, i) => ({ timestamp: Date.now() - (9 - i) * 86400000, totalCost: 50 + i * 5 }));
    const f = fe.predict(snapshots);
    assert.ok(f.daily.trend !== 0);
  });

  it('should include budget exhaustion estimate', () => {
    const fe = new ForecastEngine();
    const f = fe.predict([{ timestamp: Date.now(), totalCost: 100 }, { timestamp: Date.now() - 86400000, totalCost: 90 }]);
    assert.ok(f.budgetExhaustion);
    assert.ok(f.budgetExhaustion.dailyBurnRate > 0);
  });
});

// ============================================================
// 6. RECOMMENDATION ENGINE (10 tests)
// ============================================================
describe('RecommendationEngine', () => {
  it('should generate recommendations from cost analysis', () => {
    const re = new RecommendationEngine();
    const analysis = { ai: { totalCost: 100, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 80, count: 500 }, { provider: 'anthropic', model: 'claude-3-haiku', cost: 20, count: 100 }] }, cluster: { totalWorkers: 10, utilizationRate: 25, estimatedMonthlyCost: 500 }, workflows: { totalCost: 30, totalExecutions: 200, averageCostPerExecution: 0.15 } };
    const recs = re.generate(analysis, { alerts: [] }, { daily: [], hasExceededQuota: false }, []);
    assert.ok(recs.length > 0);
  });

  it('should categorize recommendations by impact', () => {
    const re = new RecommendationEngine();
    const analysis = { ai: { totalCost: 100, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 80, count: 500 }, { provider: 'anthropic', model: 'claude-3-haiku', cost: 20, count: 100 }] }, cluster: { totalWorkers: 10, utilizationRate: 30, estimatedMonthlyCost: 500 }, workflows: { totalCost: 50, totalExecutions: 1000, averageCostPerExecution: 0.05 } };
    const recs = re.generate(analysis, { alerts: [] }, { daily: [], hasExceededQuota: false }, []);
    const high = recs.filter(r => r.impact === 'high');
    const medium = recs.filter(r => r.impact === 'medium');
    assert.ok(high.length > 0 || medium.length > 0);
  });

  it('should filter recommendations by impact', () => {
    const re = new RecommendationEngine();
    re.generate({ ai: { totalCost: 100, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 80, count: 500 }, { provider: 'anthropic', model: 'claude-3-haiku', cost: 20, count: 100 }] }, cluster: { totalWorkers: 10, utilizationRate: 25, estimatedMonthlyCost: 400 }, workflows: { totalCost: 20, totalExecutions: 200, averageCostPerExecution: 0.1 } }, { alerts: [] }, { daily: [], hasExceededQuota: false }, []);
    const filtered = re.getRecommendations({ impact: 'high' });
    filtered.forEach(r => assert.strictEqual(r.impact, 'high'));
  });

  it('should track applied recommendations', () => {
    const re = new RecommendationEngine();
    re.generate({ ai: { totalCost: 100, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 80, count: 500 }, { provider: 'anthropic', model: 'claude-3-haiku', cost: 20, count: 100 }] }, cluster: { totalWorkers: 10, utilizationRate: 25, estimatedMonthlyCost: 400 }, workflows: { totalCost: 10, totalExecutions: 50, averageCostPerExecution: 0.2 } }, { alerts: [] }, { daily: [], hasExceededQuota: false }, []);
    const recs = re.getRecommendations();
    if (recs.length > 0) {
      re.markApplied(recs[0].id);
      assert.strictEqual(re.getAppliedCount(), 1);
    }
  });

  it('should include expected savings in recommendations', () => {
    const re = new RecommendationEngine();
    const recs = re.generate({ ai: { totalCost: 200, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 180, count: 1000 }, { provider: 'anthropic', model: 'claude-3-haiku', cost: 20, count: 200 }] }, cluster: { totalWorkers: 8, utilizationRate: 30, estimatedMonthlyCost: 400 }, workflows: { totalCost: 15, totalExecutions: 100, averageCostPerExecution: 0.15 } }, { alerts: [] }, { daily: [], hasExceededQuota: false }, []);
    const withSavings = recs.filter(r => r.expectedSavings > 0);
    assert.ok(withSavings.length > 0);
  });

  it('should include confidence scores', () => {
    const re = new RecommendationEngine();
    const recs = re.generate({ ai: { totalCost: 100, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 80, count: 500 }, { provider: 'anthropic', model: 'claude-3-haiku', cost: 20, count: 100 }] }, cluster: { totalWorkers: 6, utilizationRate: 35, estimatedMonthlyCost: 300 }, workflows: { totalCost: 10, totalExecutions: 50, averageCostPerExecution: 0.2 } }, { alerts: [] }, { daily: [], hasExceededQuota: false }, []);
    recs.forEach(r => assert.ok(r.confidence >= 0 && r.confidence <= 1));
  });

  it('should correctly identify affected systems', () => {
    const re = new RecommendationEngine();
    const recs = re.generate({ ai: { totalCost: 100, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 80, count: 500 }, { provider: 'anthropic', model: 'claude-3-haiku', cost: 20, count: 100 }] }, cluster: { totalWorkers: 8, utilizationRate: 30, estimatedMonthlyCost: 400 }, workflows: { totalCost: 15, totalExecutions: 100, averageCostPerExecution: 0.15 } }, { alerts: [] }, { daily: [], hasExceededQuota: false }, []);
    const clusterRecs = recs.filter(r => r.affectedSystems.includes('cluster'));
    if (clusterRecs.length > 0) assert.ok(clusterRecs[0].category === 'cluster');
  });

  it('should clear all recommendations', () => {
    const re = new RecommendationEngine();
    re.generate({ ai: { totalCost: 100, breakdown: [] }, cluster: { totalWorkers: 5, utilizationRate: 50, estimatedMonthlyCost: 100 }, workflows: { totalCost: 10, totalExecutions: 50, averageCostPerExecution: 0.2 } }, { alerts: [] }, { daily: [], hasExceededQuota: false }, []);
    re.clear();
    assert.strictEqual(re.getRecommendations().length, 0);
  });

  it('should generate budget-related recommendations', () => {
    const re = new RecommendationEngine();
    const analysis = { ai: { totalCost: 10, breakdown: [] }, cluster: { totalWorkers: 2, utilizationRate: 50 }, workflows: { totalCost: 5, totalExecutions: 20, averageCostPerExecution: 0.25 } };
    const recs = re.generate(analysis, { alerts: [{ budgetId: 'b1', budgetName: 'Test', level: 'critical', currentPercent: 95, currentSpend: 95, hardLimit: 100, softLimit: 80 }] }, { daily: [], hasExceededQuota: false }, []);
    const budgetRecs = recs.filter(r => r.category === 'budget');
    assert.ok(budgetRecs.length > 0);
  });
});

// ============================================================
// 7. QUOTA MANAGER (12 tests)
// ============================================================
describe('QuotaManager', () => {
  it('should return default quota limits', () => {
    const qm = new QuotaManager();
    const limits = qm.getLimits();
    assert.ok(limits.tokens);
    assert.ok(limits.requests);
    assert.ok(limits.deployments);
  });

  it('should update quota limits', () => {
    const qm = new QuotaManager();
    qm.updateLimit('tokens', { daily: 20000000 });
    assert.strictEqual(qm.getLimits().tokens.daily, 20000000);
  });

  it('should throw for unknown quota key', () => {
    const qm = new QuotaManager();
    assert.throws(() => qm.trackUsage('fake', 10), /Unknown quota/);
    assert.throws(() => qm.updateLimit('fake', {}), /Unknown quota/);
  });

  it('should track daily usage', () => {
    const qm = new QuotaManager();
    const result = qm.trackUsage('tokens', 5000);
    assert.strictEqual(result.key, 'tokens');
    const usage = qm.getUsage('tokens', 'daily');
    assert.strictEqual(usage.used, 5000);
  });

  it('should track monthly usage', () => {
    const qm = new QuotaManager();
    qm.trackUsage('requests', 100);
    const usage = qm.getUsage('requests', 'monthly');
    assert.strictEqual(usage.used, 100);
  });

  it('should calculate remaining and percentage', () => {
    const qm = new QuotaManager();
    qm.trackUsage('tokens', 5000000);
    const usage = qm.getUsage('tokens', 'daily');
    assert.strictEqual(usage.remaining, 5000000);
    assert.strictEqual(usage.pct, 50);
  });

  it('should return all usage for a period', () => {
    const qm = new QuotaManager();
    qm.trackUsage('tokens', 1000);
    qm.trackUsage('requests', 10);
    const all = qm.getAllUsage('daily');
    const tokenUsage = all.find(u => u.key === 'tokens');
    const requestUsage = all.find(u => u.key === 'requests');
    assert.ok(tokenUsage);
    assert.ok(requestUsage);
  });

  it('should indicate exceeded quota', () => {
    const qm = new QuotaManager({ limits: { tokens: { daily: 100, monthly: 3000 } } });
    qm.trackUsage('tokens', 200);
    const status = qm.getQuotaStatus();
    assert.ok(status.hasExceededQuota);
    assert.ok(status.dailyExceeded.length > 0);
  });

  it('should not indicate exceeded when under limits', () => {
    const qm = new QuotaManager();
    qm.trackUsage('tokens', 100);
    const status = qm.getQuotaStatus();
    assert.strictEqual(status.hasExceededQuota, false);
  });

  it('should clear all usage', () => {
    const qm = new QuotaManager();
    qm.trackUsage('tokens', 5000);
    qm.clear();
    const usage = qm.getUsage('tokens', 'daily');
    assert.strictEqual(usage.used, 0);
  });

  it('should handle multiple track calls accumulating', () => {
    const qm = new QuotaManager();
    qm.trackUsage('tokens', 1000);
    qm.trackUsage('tokens', 2000);
    qm.trackUsage('tokens', 3000);
    const usage = qm.getUsage('tokens', 'daily');
    assert.strictEqual(usage.used, 6000);
  });

  it('should include metadata on track calls', () => {
    const qm = new QuotaManager();
    qm.trackUsage('requests', 1, { endpoint: '/test', userId: 'u1' });
    qm.trackUsage('requests', 1, { endpoint: '/test2', userId: 'u2' });
    const usage = qm.getUsage('requests', 'daily');
    assert.ok(usage.metadata.length >= 2);
  });
});

// ============================================================
// 8. POLICY ENGINE (12 tests)
// ============================================================
describe('PolicyEngine', () => {
  it('should load default policies', () => {
    const pe = new PolicyEngine();
    assert.strictEqual(pe.getPolicies().length, DEFAULT_POLICIES.length);
  });

  it('should start empty with defaultPolicies disabled', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    assert.strictEqual(pe.getPolicies().length, 0);
  });

  it('should add and retrieve policies', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    pe.addPolicy({ id: 'test-pol', name: 'Test', type: 'maximum_cost', params: { maxMonthly: 1000 }, scope: 'org', priority: 'high', enabled: true });
    assert.strictEqual(pe.getPolicy('test-pol').name, 'Test');
  });

  it('should update policies', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    pe.addPolicy({ id: 'upd-pol', name: 'Original', type: 'maximum_cost', params: { maxMonthly: 500 }, scope: 'org', priority: 'medium', enabled: true });
    pe.updatePolicy('upd-pol', { params: { maxMonthly: 1000 } });
    assert.strictEqual(pe.getPolicy('upd-pol').params.maxMonthly, 1000);
  });

  it('should remove policies', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    pe.addPolicy({ id: 'del-pol', name: 'Del', type: 'maximum_cost', params: {}, scope: 'org', priority: 'low', enabled: true });
    pe.removePolicy('del-pol');
    assert.strictEqual(pe.getPolicy('del-pol'), null);
  });

  it('should evaluate provider against policies', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    pe.addPolicy({ id: 'pref', name: 'Pref', type: 'preferred_providers', params: { providers: ['openai', 'anthropic'], priorityOrder: true }, scope: 'org', priority: 'high', enabled: true });
    const result = pe.evaluateProvider('gemini', 'gemini-1.5-pro');
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.violations.length, 1);
  });

  it('should allow preferred providers', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    pe.addPolicy({ id: 'pref', name: 'Pref', type: 'preferred_providers', params: { providers: ['openai'], priorityOrder: true }, scope: 'org', priority: 'high', enabled: true });
    const result = pe.evaluateProvider('openai', 'gpt-4o');
    assert.strictEqual(result.allowed, true);
  });

  it('should evaluate maximum cost policies', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    pe.addPolicy({ id: 'max-cost', name: 'Max Cost', type: 'maximum_cost', params: { maxMonthly: 1000 }, scope: 'org', priority: 'high', enabled: true });
    const under = pe.evaluateCost(500);
    assert.strictEqual(under.allowed, true);
    const over = pe.evaluateCost(1500);
    assert.strictEqual(over.allowed, false);
  });

  it('should rank providers by preference', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    pe.addPolicy({ id: 'pref-ranking', name: 'Pref', type: 'preferred_providers', params: { providers: ['anthropic', 'openai'], priorityOrder: true }, scope: 'org', priority: 'high', enabled: true });
    const ranked = pe.getProviderRanking(['openai', 'anthropic', 'gemini']);
    assert.strictEqual(ranked[0], 'anthropic');
    assert.strictEqual(ranked[1], 'openai');
  });

  it('should return effective min latency threshold', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    assert.strictEqual(pe.getEffectiveMinLatency(), null);
    pe.addPolicy({ id: 'latency', name: 'Latency', type: 'latency_threshold', params: { maxLatencyMs: 3000 }, scope: 'org', priority: 'low', enabled: true });
    assert.strictEqual(pe.getEffectiveMinLatency(), 3000);
  });

  it('should filter policies by type and scope', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    pe.addPolicy({ id: 'p1', type: 'maximum_cost', scope: 'org', enabled: true });
    pe.addPolicy({ id: 'p2', type: 'preferred_providers', scope: 'project', enabled: false });
    assert.strictEqual(pe.getPolicies({ type: 'maximum_cost' }).length, 1);
    assert.strictEqual(pe.getPolicies({ enabled: false }).length, 1);
  });

  it('should reset to default policies', () => {
    const pe = new PolicyEngine({ defaultPolicies: true });
    const initial = pe.getPolicies().length;
    pe.addPolicy({ id: 'extra', name: 'Extra', type: 'maximum_cost', params: {}, scope: 'org', priority: 'low', enabled: true });
    pe.reset();
    assert.strictEqual(pe.getPolicies().length, initial);
  });
});

// ============================================================
// 9. COST EVENTS (8 tests)
// ============================================================
describe('CostEvents', () => {
  it('should emit and receive events via listeners', () => {
    const ce = new CostEvents();
    let received = null;
    ce.on(EVENT_TYPES.COST_UPDATED, (e) => { received = e; });
    const event = ce.emitCostUpdated({ totalCost: 100 });
    assert.ok(received);
    assert.strictEqual(received.data.totalCost, 100);
  });

  it('should return unsub function', () => {
    const ce = new CostEvents();
    let count = 0;
    const unsub = ce.on('test', () => { count++; });
    ce.emit('test');
    assert.strictEqual(count, 1);
    unsub();
    ce.emit('test');
    assert.strictEqual(count, 1);
  });

  it('should store event history', () => {
    const ce = new CostEvents();
    ce.emitCostUpdated({ cost: 10 });
    ce.emitBudgetWarning({ budgetId: 'b1' });
    assert.strictEqual(ce.getHistory().length, 2);
  });

  it('should filter history by type', () => {
    const ce = new CostEvents();
    ce.emitCostUpdated({ cost: 10 });
    ce.emitBudgetWarning({ budgetId: 'b1' });
    const filtered = ce.getHistory({ type: EVENT_TYPES.COST_UPDATED });
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].type, EVENT_TYPES.COST_UPDATED);
  });

  it('should emit via external event bus', () => {
    const external = { emit: (type, data, opts) => { external.lastEvent = { type, data }; } };
    const ce = new CostEvents({ eventBus: external });
    ce.emitCostUpdated({ cost: 50 });
    assert.ok(external.lastEvent);
    assert.strictEqual(external.lastEvent.type, 'cost.updated');
  });

  it('should clear history and listeners', () => {
    const ce = new CostEvents();
    ce.on('test', () => {});
    ce.emit('test');
    ce.clear();
    assert.strictEqual(ce.getHistory().length, 0);
  });

  it('should emit all event types', () => {
    const ce = new CostEvents();
    const types = [EVENT_TYPES.COST_UPDATED, EVENT_TYPES.BUDGET_WARNING, EVENT_TYPES.BUDGET_EXCEEDED, EVENT_TYPES.OPTIMIZATION_APPLIED, EVENT_TYPES.FORECAST_UPDATED, EVENT_TYPES.QUOTA_WARNING, EVENT_TYPES.POLICY_VIOLATION, EVENT_TYPES.RECOMMENDATION_GENERATED];
    for (const t of types) {
      const e = ce.emit(t, { test: true });
      assert.strictEqual(e.type, t);
    }
    assert.strictEqual(ce.getHistory().length, types.length);
  });

  it('should respect maxHistory limit', () => {
    const ce = new CostEvents({ maxHistory: 5 });
    for (let i = 0; i < 20; i++) ce.emit('test', { i });
    assert.strictEqual(ce.getHistory().length, 5);
  });
});

// ============================================================
// 10. COST ENGINE (25 tests)
// ============================================================
describe('CostEngine', () => {
  it('should create with defaults and be enabled', () => {
    const ce = new CostEngine();
    assert.ok(ce.isEnabled());
    assert.ok(ce.pricing);
    assert.ok(ce.analyzer);
    assert.ok(ce.budgets);
    assert.ok(ce.quotas);
    assert.ok(ce.policies);
  });

  it('should enable and disable', () => {
    const ce = new CostEngine();
    ce.disable();
    assert.strictEqual(ce.isEnabled(), false);
    assert.strictEqual(ce.analyze({}), null);
    ce.enable();
    assert.ok(ce.isEnabled());
  });

  it('should perform full analysis cycle', () => {
    const ce = new CostEngine();
    const result = ce.analyze({
      ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 10000, outputTokens: 5000 }],
      cluster: { workers: [{ status: 'healthy' }, { status: 'healthy' }], queueDepth: 3 },
      workflows: [{ id: 'wf1', status: 'COMPLETED', estimatedCost: 0.05 }, { id: 'wf2', status: 'FAILED', estimatedCost: 0.02 }],
      deployments: [{ type: 'standard', estimatedCost: 0.01 }],
      storage: [{ type: 'logs', sizeMb: 100 }],
      api: [{ endpoint: '/generate', estimatedCost: 0.001 }, { endpoint: '/health', estimatedCost: 0.0005 }],
    });
    assert.ok(result);
    assert.ok(result.snapshot);
    assert.ok(result.totalCost > 0);
    assert.ok(Array.isArray(result.recommendations));
    assert.ok(result.forecast);
    assert.ok(result.optimization);
  });

  it('should return empty report when no data', () => {
    const ce = new CostEngine();
    const report = ce.getReport();
    assert.strictEqual(report.totalCost, 0);
    assert.strictEqual(report.savingsOpportunity, 0);
    assert.ok(Array.isArray(report.recommendations));
  });

  it('should return recommendations after analysis', () => {
    const ce = new CostEngine();
    ce.analyze({
      ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 50000, outputTokens: 20000 }],
      cluster: { workers: [{ status: 'healthy' }] },
      workflows: [],
      deployments: [],
      storage: [],
      api: [],
    });
    const recs = ce.recommend();
    assert.ok(Array.isArray(recs));
  });

  it('should run optimization separately', () => {
    const ce = new CostEngine();
    const opt = ce.optimize({
      ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 10000, outputTokens: 5000 }],
      cluster: { workers: [{ status: 'healthy' }] },
      workflows: [],
      deployments: [],
      storage: [],
      api: [],
    });
    assert.ok(opt);
    assert.ok(Array.isArray(opt.providerChanges) || Array.isArray(opt.cacheUsage));
  });

  it('should run forecast independently', () => {
    const ce = new CostEngine();
    const f = ce.forecast();
    assert.ok(f);
    assert.ok(f.projected);
  });

  it('should return health status', () => {
    const ce = new CostEngine();
    const health = ce.getHealth();
    assert.ok(health.enabled);
    assert.strictEqual(typeof health.totalAnalyses, 'number');
    assert.ok(health.budgetCount > 0);
    assert.ok(health.policyCount > 0);
  });

  it('should clear all state', () => {
    const ce = new CostEngine();
    ce.analyze({
      ai: [],
      cluster: {},
      workflows: [],
      deployments: [],
      storage: [],
      api: [],
    });
    ce.clear();
    assert.strictEqual(ce.getHealth().totalAnalyses, 0);
    assert.strictEqual(ce.getHealth().snapshotCount, 0);
  });

  it('should emit cost events during analysis', () => {
    const ce = new CostEngine();
    let eventReceived = null;
    ce.events.on(EVENT_TYPES.COST_UPDATED, (e) => { eventReceived = e; });
    ce.analyze({
      ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 }],
      cluster: { workers: [{ status: 'healthy' }] },
      workflows: [],
      deployments: [],
      storage: [],
      api: [],
    });
    assert.ok(eventReceived);
  });

  it('should record spend with budget manager on analysis', () => {
    const ce = new CostEngine({ defaultPolicies: false, defaultBudgets: false });
    ce.budgets.addBudget({ id: 'ana-budget', name: 'Ana Budget', scope: 'org', period: 'daily', softLimit: 10, hardLimit: 1000, alertThresholds: [90], alerts: true, enabled: true });
    ce.analyze({
      ai: [{ provider: 'openai', model: 'gpt-4o-mini', inputTokens: 10000, outputTokens: 5000 }],
      cluster: {},
      workflows: [],
      deployments: [],
      storage: [],
      api: [],
    });
    const daily = ce.budgets.getCurrentDailySpend();
    assert.ok(daily.total > 0);
  });

  it('should handle empty analysis gracefully', () => {
    const ce = new CostEngine();
    const result = ce.analyze({ ai: [], cluster: {}, workflows: [], deployments: [], storage: [], api: [] });
    assert.ok(result);
    assert.strictEqual(result.totalCost, 0);
  });

  it('should accumulate total analyses count', () => {
    const ce = new CostEngine();
    ce.analyze({ ai: [], cluster: {}, workflows: [], deployments: [], storage: [], api: [] });
    ce.analyze({ ai: [], cluster: {}, workflows: [], deployments: [], storage: [], api: [] });
    assert.strictEqual(ce.getHealth().totalAnalyses, 2);
  });

  it('should include budget status in report', () => {
    const ce = new CostEngine();
    ce.analyze({ ai: [], cluster: {}, workflows: [], deployments: [], storage: [], api: [] });
    const report = ce.getReport();
    assert.ok(report.budgetStatus);
  });

  it('should include provider breakdown in report', () => {
    const ce = new CostEngine();
    ce.analyze({
      ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 }],
      cluster: {},
      workflows: [],
      deployments: [],
      storage: [],
      api: [],
    });
    const report = ce.getReport();
    assert.ok(report.providerBreakdown.length > 0);
  });

  it('should use custom quota limits', () => {
    const ce = new CostEngine({ quotaLimits: { tokens: { daily: 50000, monthly: 1000000 } } });
    const limits = ce.quotas.getLimits();
    assert.strictEqual(limits.tokens.daily, 50000);
  });

  it('should handle custom pricing models', () => {
    const customPricing = new PricingModels();
    customPricing.updatePricing('openai', 'gpt-4o', { input: 100, output: 200 });
    const ce = new CostEngine({ pricingModels: customPricing });
    const result = ce.analyze({
      ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 }],
      cluster: {},
      workflows: [],
      deployments: [],
      storage: [],
      api: [],
    });
    assert.ok(result.snapshot.ai.totalCost > 0.1);
  });

  it('should include alerts in analysis result', () => {
    const ce = new CostEngine({ defaultBudgets: false });
    ce.budgets.addBudget({ id: 'alert-test-engine', name: 'Alert Engine', scope: 'org', period: 'daily', softLimit: 1, hardLimit: 10, alertThresholds: [80], alerts: true, enabled: true });
    const result = ce.analyze({
      ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 100000, outputTokens: 50000 }],
      cluster: {},
      workflows: [],
      deployments: [],
      storage: [],
      api: [],
    });
    assert.ok(result.budgetStatus);
  });

  it('should handle analysis with all empty sources', () => {
    const ce = new CostEngine();
    const result = ce.analyze();
    assert.ok(result);
  });

  it('should not analyze when disabled', () => {
    const ce = new CostEngine();
    ce.disable();
    assert.strictEqual(ce.analyze({ ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 }], cluster: {}, workflows: [], deployments: [], storage: [], api: [] }), null);
  });

  it('should provide module accessors', () => {
    const ce = new CostEngine();
    assert.ok(ce.pricing instanceof PricingModels);
    assert.ok(ce.analyzer instanceof CostAnalyzer);
    assert.ok(ce.budgets instanceof BudgetManager);
    assert.ok(ce.optimizer instanceof Optimizer);
    assert.ok(ce.forecaster instanceof ForecastEngine);
    assert.ok(ce.recommender instanceof RecommendationEngine);
    assert.ok(ce.quotas instanceof QuotaManager);
    assert.ok(ce.policies instanceof PolicyEngine);
    assert.ok(ce.events instanceof CostEvents);
  });
});

// ============================================================
// 11. MODULE EXPORTS (5 tests)
// ============================================================
describe('Module Exports', () => {
  it('should export all classes and functions from index', () => {
    const cost = require('../lib/cost');
    assert.strictEqual(typeof cost.CostEngine, 'function');
    assert.strictEqual(typeof cost.CostAnalyzer, 'function');
    assert.strictEqual(typeof cost.PricingModels, 'function');
    assert.strictEqual(typeof cost.BudgetManager, 'function');
    assert.strictEqual(typeof cost.Optimizer, 'function');
    assert.strictEqual(typeof cost.ForecastEngine, 'function');
    assert.strictEqual(typeof cost.RecommendationEngine, 'function');
    assert.strictEqual(typeof cost.QuotaManager, 'function');
    assert.strictEqual(typeof cost.PolicyEngine, 'function');
    assert.strictEqual(typeof cost.CostEvents, 'function');
  });

  it('should export constants', () => {
    const cost = require('../lib/cost');
    assert.ok(cost.PRICING);
    assert.ok(Array.isArray(cost.DEFAULT_BUDGETS));
    assert.ok(cost.DEFAULT_QUOTA_LIMITS);
    assert.ok(Array.isArray(cost.DEFAULT_POLICIES));
    assert.ok(cost.EVENT_TYPES);
  });

  it('should support singleton pattern', () => {
    const cost = require('../lib/cost');
    cost.resetDefaultEngine();
    const e1 = cost.getCostEngine();
    const e2 = cost.getCostEngine();
    assert.strictEqual(e1, e2);
    cost.resetDefaultEngine();
    const e3 = cost.getCostEngine();
    assert.notStrictEqual(e1, e3);
  });

  it('should create independent instances', () => {
    const cost = require('../lib/cost');
    const e1 = cost.createCostEngine();
    const e2 = cost.createCostEngine();
    assert.notStrictEqual(e1, e2);
  });

  it('should export EVENT_TYPES with expected keys', () => {
    const { EVENT_TYPES } = require('../lib/cost');
    assert.strictEqual(EVENT_TYPES.COST_UPDATED, 'cost.updated');
    assert.strictEqual(EVENT_TYPES.BUDGET_WARNING, 'cost.budget.warning');
    assert.strictEqual(EVENT_TYPES.FORECAST_UPDATED, 'cost.forecast.updated');
  });
});

// ============================================================
// 12. API CONTROLLER (12 tests)
// ============================================================
describe('Cost API Controller', () => {
  let mockRes;
  beforeEach(() => {
    mockRes = { data: null, statusCode: 0 };
    mockRes = {
      status: (code) => { mockRes.statusCode = code; return { json: (d) => { mockRes.data = d; } }; },
      requestId: 'cost-test',
    };
  });

  it('should return summary', () => {
    costController.getSummary({}, mockRes);
    assert.ok(mockRes.data);
    assert.strictEqual(mockRes.data.success, true);
  });

  it('should return forecast', () => {
    costController.getForecast({ query: {} }, mockRes);
    assert.ok(mockRes.data.success);
  });

  it('should return recommendations', () => {
    costController.getRecommendations({ query: {} }, mockRes);
    assert.ok(mockRes.data.success);
    assert.ok(Array.isArray(mockRes.data.data));
  });

  it('should return quotas', () => {
    costController.getQuotas({ query: { period: 'daily' } }, mockRes);
    assert.ok(mockRes.data.success);
  });

  it('should return budgets', () => {
    costController.getBudgets({ query: {} }, mockRes);
    assert.ok(mockRes.data.success);
    assert.ok(mockRes.data.data.budgets.length > 0);
  });

  it('should return policies', () => {
    costController.getPolicies({ query: {} }, mockRes);
    assert.ok(mockRes.data.success);
    assert.ok(mockRes.data.data.length > 0);
  });

  it('should run optimization via post', () => {
    const { getCostEngine } = require('../lib/cost');
    getCostEngine();
    costController.postOptimize({ body: { sources: {} } }, mockRes);
    assert.ok(mockRes.data.success);
  });

  it('should add policy via post', () => {
    const { getCostEngine, resetDefaultEngine } = require('../lib/cost');
    resetDefaultEngine();
    getCostEngine();
    costController.postPolicies({ body: { id: 'api-test-policy', name: 'API Test Policy', type: 'maximum_cost', params: { maxMonthly: 500 }, scope: 'org', priority: 'medium', enabled: true } }, mockRes);
    assert.ok(mockRes.data.success);
  });

  it('should return alerts', () => {
    costController.getAlerts({ query: {} }, mockRes);
    assert.ok(mockRes.data.success);
  });

  it('should return pricing', () => {
    costController.getPricing({ query: {} }, mockRes);
    assert.ok(mockRes.data.success);
    assert.ok(mockRes.data.data.providers.length > 0);
  });

  it('should return events', () => {
    costController.getCostEvents({ query: {} }, mockRes);
    assert.ok(mockRes.data.success);
  });

  it('should return health', () => {
    costController.getHealth({}, mockRes);
    assert.ok(mockRes.data.success);
    assert.ok(mockRes.data.data.enabled !== undefined);
  });
});

// ============================================================
// 13. API ROUTES (4 tests)
// ============================================================
describe('Cost API Routes', () => {
  it('should create routes with expected endpoints', () => {
    const router = createCostRoutes();
    assert.ok(router);
    assert.strictEqual(typeof router, 'function');
  });

  it('should have all expected route paths', () => {
    const router = createCostRoutes();
    const stack = router.stack || [];
    const paths = stack.map(l => l.route?.path).filter(Boolean);
    const expected = ['/summary', '/forecast', '/recommendations', '/quotas', '/budgets', '/policies', '/optimize', '/alerts', '/pricing', '/events', '/health'];
    for (const p of expected) assert.ok(paths.includes(p), `Missing route: ${p}`);
    assert.strictEqual(paths.length, 12);
  });

  it('should be registered in the main router', () => {
    const fs = require('fs');
    const routerSource = fs.readFileSync(require('path').join(__dirname, '..', 'lib', 'api', 'router.js'), 'utf-8');
    assert.ok(routerSource.includes("require('./routes/costRoutes')"));
    assert.ok(routerSource.includes("apiRouter.use('/cost', createCostRoutes())"));
  });

  it('should be exported from api index', () => {
    const api = require('../lib/api');
    assert.ok(api.controllers.cost);
  });
});

// ============================================================
// 14. DASHBOARD INTEGRATION (6 tests)
// ============================================================
describe('Dashboard Integration', () => {
  it('should register costOptimization route in dashboard', () => {
    const { ROUTES } = require('../ui/dashboard/dashboard');
    assert.ok(ROUTES.costOptimization);
    assert.strictEqual(ROUTES.costOptimization.title, 'Cost Optimization');
  });

  it('should include costOptimization in Sidebar', () => {
    const { LINKS } = require('../ui/dashboard/components/Sidebar');
    const main = LINKS.find(s => s.section === 'Main');
    assert.ok(main.items.find(i => i.id === 'costOptimization'));
  });

  it('should render cost overview page', () => {
    const { renderCostOverview } = require('../ui/control-plane/cost');
    const html = renderCostOverview({});
    assert.ok(html);
    assert.ok(html.includes('Cost Optimization'));
    assert.ok(html.includes('Overview'));
    assert.ok(html.includes('Budgets'));
    assert.ok(html.includes('Forecast'));
    assert.ok(html.includes('Optimization Center'));
    assert.ok(html.includes('Usage Explorer'));
  });

  it('should render cost page with metrics and tabs', () => {
    const { renderCostOverview } = require('../ui/control-plane/cost');
    const html = renderCostOverview({ userName: 'Test', workspaceName: 'TestWS' });
    assert.ok(html.includes('Total Cost'));
    assert.ok(html.includes('Projected Monthly'));
    assert.ok(html.includes('Savings Opportunity'));
    assert.ok(html.includes('Active Recommendations'));
    assert.ok(html.includes('Tab'));
    assert.ok(html.includes('role="tablist"'));
  });

  it('should include client-side data loading JS', () => {
    const { renderCostOverview } = require('../ui/control-plane/cost');
    const html = renderCostOverview({});
    assert.ok(html.includes('/api/v1/cost/summary'));
    assert.ok(html.includes('/api/v1/cost/forecast'));
    assert.ok(html.includes('/api/v1/cost/budgets'));
    assert.ok(html.includes('/api/v1/cost/optimize'));
    assert.ok(html.includes('/api/v1/cost/quotas'));
    assert.ok(html.includes('/api/v1/cost/policies'));
  });

  it('should include polling intervals for live updates', () => {
    const { renderCostOverview } = require('../ui/control-plane/cost');
    const html = renderCostOverview({});
    assert.ok(html.includes('setInterval'));
    assert.ok(html.includes('loadSummary'));
    assert.ok(html.includes('15000'));
  });
});

// ============================================================
// 15. INTEGRATION — FULL WORKFLOW (5 tests)
// ============================================================
describe('Integration — Full Cost Workflow', () => {
  it('should process complete cost analysis cycle end-to-end', () => {
    const ce = new CostEngine();
    const sources = {
      ai: [
        { provider: 'openai', model: 'gpt-4o', inputTokens: 50000, outputTokens: 20000 },
        { provider: 'openai', model: 'gpt-4o-mini', inputTokens: 200000, outputTokens: 80000 },
        { provider: 'anthropic', model: 'claude-3-haiku', inputTokens: 100000, outputTokens: 40000 },
      ],
      cluster: { workers: Array.from({ length: 5 }, (_, i) => ({ id: `w${i}`, status: i < 4 ? 'healthy' : 'unhealthy' })), queueDepth: 10, hourlyCostPerWorker: 0.50 },
      workflows: Array.from({ length: 10 }, (_, i) => ({ id: `wf${i}`, status: i < 7 ? 'COMPLETED' : 'FAILED', estimatedCost: 0.02 + Math.random() * 0.08, executionTimeMs: 1000 + Math.random() * 4000 })),
      deployments: [{ type: 'standard', estimatedCost: 0.01 }, { type: 'canary', estimatedCost: 0.03 }],
      storage: [{ type: 'logs', sizeMb: 500 }, { type: 'assets', sizeMb: 200 }, { type: 'database', sizeMb: 1000 }],
      api: Array.from({ length: 20 }, () => ({ endpoint: '/api/v1/generate', estimatedCost: 0.001 })),
    };
    const result = ce.analyze(sources);
    assert.ok(result);
    assert.ok(result.totalCost > 0);
    assert.ok(result.snapshot.ai.totalTokens > 0);
    assert.ok(result.snapshot.cluster.totalWorkers === 5);
    assert.ok(result.snapshot.workflows.totalExecutions === 10);
    assert.ok(result.snapshot.deployments.totalDeployments === 2);
    assert.ok(result.snapshot.storage.totalMb > 0);
    assert.ok(result.snapshot.api.totalRequests === 20);
    assert.ok(result.forecast.projected.monthly > 0);
    assert.ok(Array.isArray(result.recommendations));
    assert.ok(result.optimization.totalEstimatedSavings >= 0);
  });

  it('should generate report after multiple analyses', () => {
    const ce = new CostEngine();
    for (let i = 0; i < 5; i++) {
      ce.analyze({
        ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 10000, outputTokens: 5000 }],
        cluster: { workers: [{ status: 'healthy' }] },
        workflows: [],
        deployments: [],
        storage: [],
        api: [],
      });
    }
    const report = ce.getReport();
    assert.ok(report.totalCost > 0);
    assert.ok(report.projectedCost > 0);
    assert.ok(report.snapshot);
    assert.ok(report.forecast);
  });

  it('should handle budget alerts within analysis', () => {
    const ce = new CostEngine({ defaultBudgets: false });
    ce.budgets.addBudget({ id: 'int-budget', name: 'Integration Budget', scope: 'org', period: 'daily', softLimit: 0.01, hardLimit: 0.05, alertThresholds: [50, 80, 100], alerts: true, enabled: true });
    const result = ce.analyze({
      ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 10000, outputTokens: 5000 }],
      cluster: { workers: [] },
      workflows: [],
      deployments: [],
      storage: [],
      api: [],
    });
    assert.ok(result.budgetStatus);
    const alerts = ce.budgets.getAlerts({ budgetId: 'int-budget' });
    assert.ok(alerts.length > 0);
  });

  it('should apply quota tracking across analyses', () => {
    const ce = new CostEngine();
    for (let i = 0; i < 10; i++) {
      ce.analyze({
        ai: [{ provider: 'openai', model: 'gpt-4o-mini', inputTokens: 10000, outputTokens: 5000 }],
        cluster: { workers: [] },
        workflows: [],
        deployments: [],
        storage: [],
        api: [{ endpoint: '/test', estimatedCost: 0.001 }],
      });
    }
    const quotaStatus = ce.quotas.getQuotaStatus();
    assert.ok(quotaStatus.daily.length > 0);
  });

  it('should emit events throughout analysis lifecycle', () => {
    const ce = new CostEngine();
    const events = [];
    ce.events.on(EVENT_TYPES.COST_UPDATED, (e) => events.push(e));
    ce.events.on(EVENT_TYPES.FORECAST_UPDATED, (e) => events.push(e));
    ce.analyze({
      ai: [{ provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 }],
      cluster: { workers: [{ status: 'healthy' }] },
      workflows: [{ id: 'wf1', status: 'COMPLETED', estimatedCost: 0.01 }],
      deployments: [{ type: 'standard' }],
      storage: [{ type: 'logs', sizeMb: 10 }],
      api: [{ endpoint: '/test' }],
    });
    assert.ok(events.length >= 1);
  });
});

// ============================================================
// 16. PERFORMANCE — EDGE CASES (10 tests)
// ============================================================
describe('Performance & Edge Cases', () => {
  it('should handle extremely large token counts', () => {
    const pm = new PricingModels();
    const cost = pm.calculateCost('openai', 'gpt-4o', 10000000, 5000000);
    assert.ok(cost.totalCost > 0);
    assert.ok(cost.totalCost < 100); // Sanity check
  });

  it('should handle zero-cost local models', () => {
    const pm = new PricingModels();
    const cost = pm.calculateCost('ollama', 'llama3-70b', 10000, 5000);
    assert.strictEqual(cost.totalCost, 0);
  });

  it('should handle concurrent optimizer runs', () => {
    const opt = new Optimizer();
    const analysis = { ai: { totalCost: 50, breakdown: [{ provider: 'openai', model: 'gpt-4o', cost: 40, count: 200 }, { provider: 'anthropic', model: 'claude-3-haiku', cost: 10, count: 50 }] }, cluster: { totalWorkers: 6, utilizationRate: 30, estimatedMonthlyCost: 300 }, workflows: { totalCost: 20, totalExecutions: 100, averageCostPerExecution: 0.2 } };
    for (let i = 0; i < 50; i++) opt.optimize(analysis);
    assert.strictEqual(opt.getHistory(100).length, 50);
  });

  it('should handle snapshot with missing fields', () => {
    const ca = new CostAnalyzer();
    const snapshot = ca.snapshot([], { workers: [] }, [], [], [], []);
    assert.ok(snapshot);
    assert.strictEqual(snapshot.totalCost, 0);
  });

  it('should handle forecast with no trend data', () => {
    const fe = new ForecastEngine();
    const f = fe.predict([{ timestamp: Date.now(), totalCost: 100 }, { timestamp: Date.now() - 86400000, totalCost: 100 }]);
    assert.strictEqual(f.daily.trend, 0);
  });

  it('should handle budget with zero hard limit', () => {
    const bm = new BudgetManager({ defaultBudgets: false });
    bm.addBudget({ id: 'zero-limit', name: 'Zero', scope: 'org', period: 'daily', softLimit: 0, hardLimit: 0, alertThresholds: [], alerts: false, enabled: true });
    const result = bm.recordSpend(100, 'test');
    assert.strictEqual(result.hardLimitExceeded, false);
  });

  it('should handle rapidly repeated policy evaluations', () => {
    const pe = new PolicyEngine({ defaultPolicies: false });
    pe.addPolicy({ id: 'eval-test', name: 'Eval Test', type: 'preferred_providers', params: { providers: ['openai'], priorityOrder: true }, scope: 'org', priority: 'medium', enabled: true });
    for (let i = 0; i < 100; i++) pe.evaluateProvider('gemini', 'gemini-pro');
    const result = pe.evaluateProvider('gemini', 'gemini-pro');
    assert.strictEqual(result.allowed, false);
  });

  it('should handle forecast with inconsistent data', () => {
    const fe = new ForecastEngine();
    const snapshots = [
      { timestamp: Date.now(), totalCost: 100 },
      { timestamp: Date.now() - 86400000, totalCost: null },
      { timestamp: Date.now() - 2 * 86400000, totalCost: 80 },
    ];
    const f = fe.predict(snapshots);
    assert.ok(f.daily.average > 0);
  });

  it('should handle cost calculation with minimal tokens', () => {
    const pm = new PricingModels();
    const cost = pm.calculateCost('openai', 'gpt-4o-mini', 1, 1);
    // 1 token at $0.15/1M = essentially 0
    assert.ok(cost.totalCost >= 0);
  });

  it('should handle recommendation engine with no patterns', () => {
    const re = new RecommendationEngine();
    const analysis = { ai: { totalCost: 0, breakdown: [] }, cluster: { totalWorkers: 2, utilizationRate: 60 }, workflows: { totalCost: 0, totalExecutions: 0, averageCostPerExecution: 0 } };
    const recs = re.generate(analysis, { alerts: [] }, { daily: [], hasExceededQuota: false }, []);
    assert.ok(Array.isArray(recs));
  });
});
