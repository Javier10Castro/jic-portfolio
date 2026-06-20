const { PricingModels } = require('./pricingModels');

class CostAnalyzer {
  constructor(options = {}) {
    this._pricing = options.pricingModels || new PricingModels();
    this._snapshots = [];
    this._maxSnapshots = options.maxSnapshots || 1000;
  }

  get pricing() { return this._pricing; }

  analyzeAITokenUsage(usageRecords = []) {
    let totalTokens = 0;
    let totalCost = 0;
    const breakdown = {};
    for (const r of usageRecords) {
      const input = r.inputTokens || 0;
      const output = r.outputTokens || 0;
      totalTokens += input + output;
      const cost = this._pricing.calculateCost(r.provider, r.model, input, output);
      if (cost) {
        totalCost += cost.totalCost;
        const key = `${r.provider}:${r.model}`;
        if (!breakdown[key]) breakdown[key] = { provider: r.provider, model: r.model, inputTokens: 0, outputTokens: 0, cost: 0, count: 0 };
        breakdown[key].inputTokens += input;
        breakdown[key].outputTokens += output;
        breakdown[key].cost += cost.totalCost;
        breakdown[key].count++;
      }
    }
    return { totalTokens, totalCost: Math.round(totalCost * 1000000) / 1000000, breakdown: Object.values(breakdown), recordCount: usageRecords.length };
  }

  analyzeClusterUtilization(clusterData = {}) {
    const workers = clusterData.workers || [];
    const healthy = workers.filter(w => w.status === 'healthy').length;
    const total = workers.length;
    const utilizationRate = total > 0 ? Math.round((healthy / total) * 10000) / 100 : 0;
    const estimatedCost = total * (clusterData.hourlyCostPerWorker || 0.50);
    return { totalWorkers: total, healthyWorkers: healthy, utilizationRate, queueDepth: clusterData.queueDepth || 0, estimatedHourlyCost: estimatedCost, estimatedDailyCost: estimatedCost * 24, estimatedMonthlyCost: estimatedCost * 24 * 30 };
  }

  analyzeWorkflowCost(workflowRecords = []) {
    let totalCost = 0;
    let totalExecutions = 0;
    const byStatus = {};
    for (const wf of workflowRecords) {
      totalExecutions++;
      const cost = wf.estimatedCost || (wf.executionTimeMs || 0) * 0.000001;
      totalCost += cost;
      const status = wf.status || 'unknown';
      if (!byStatus[status]) byStatus[status] = { count: 0, cost: 0 };
      byStatus[status].count++;
      byStatus[status].cost += cost;
    }
    return { totalCost: Math.round(totalCost * 1000000) / 1000000, totalExecutions, byStatus, averageCostPerExecution: totalExecutions > 0 ? Math.round((totalCost / totalExecutions) * 1000000) / 1000000 : 0 };
  }

  analyzeDeploymentCost(deploymentRecords = []) {
    let totalCost = 0;
    let totalDeployments = deploymentRecords.length;
    const byType = {};
    for (const d of deploymentRecords) {
      const cost = d.estimatedCost || 0.01;
      totalCost += cost;
      const type = d.type || 'standard';
      if (!byType[type]) byType[type] = { count: 0, cost: 0 };
      byType[type].count++;
      byType[type].cost += cost;
    }
    return { totalCost: Math.round(totalCost * 1000000) / 1000000, totalDeployments, byType, averageCostPerDeployment: totalDeployments > 0 ? Math.round((totalCost / totalDeployments) * 1000000) / 1000000 : 0 };
  }

  analyzeStorageUsage(storageRecords = []) {
    const totalMb = storageRecords.reduce((s, r) => s + (r.sizeMb || 0), 0);
    const totalCost = totalMb * 0.01;
    const byType = {};
    for (const r of storageRecords) {
      const type = r.type || 'general';
      if (!byType[type]) byType[type] = { mb: 0, cost: 0 };
      byType[type].mb += r.sizeMb || 0;
      byType[type].cost += (r.sizeMb || 0) * 0.01;
    }
    return { totalMb: Math.round(totalMb * 1000000) / 1000000, totalCost: Math.round(totalCost * 1000000) / 1000000, byType: Object.entries(byType).map(([k, v]) => ({ type: k, ...v })) };
  }

  analyzeAPIConsumption(apiRecords = []) {
    let totalRequests = 0;
    let totalCost = 0;
    const byEndpoint = {};
    for (const r of apiRecords) {
      totalRequests++;
      const cost = r.estimatedCost || 0.0001;
      totalCost += cost;
      const endpoint = r.endpoint || r.path || 'unknown';
      if (!byEndpoint[endpoint]) byEndpoint[endpoint] = { count: 0, cost: 0 };
      byEndpoint[endpoint].count++;
      byEndpoint[endpoint].cost += cost;
    }
    return { totalRequests, totalCost: Math.round(totalCost * 1000000) / 1000000, byEndpoint: Object.entries(byEndpoint).map(([k, v]) => ({ endpoint: k, ...v })), averageCostPerRequest: totalRequests > 0 ? Math.round((totalCost / totalRequests) * 1000000) / 1000000 : 0 };
  }

  snapshot(ai, cluster, workflows, deployments, storage, api) {
    const entry = { timestamp: Date.now(), ai: this.analyzeAITokenUsage(ai), cluster: this.analyzeClusterUtilization(cluster), workflows: this.analyzeWorkflowCost(workflows), deployments: this.analyzeDeploymentCost(deployments), storage: this.analyzeStorageUsage(storage), api: this.analyzeAPIConsumption(api) };
    entry.totalCost = Math.round((entry.ai.totalCost + entry.workflows.totalCost + entry.deployments.totalCost + entry.storage.totalCost + entry.api.totalCost) * 1000000) / 1000000;
    this._snapshots.push(entry);
    if (this._snapshots.length > this._maxSnapshots) this._snapshots.shift();
    return entry;
  }

  getSnapshots(limit = 10) {
    return this._snapshots.slice(-limit);
  }

  getLatestSnapshot() {
    return this._snapshots.length > 0 ? this._snapshots[this._snapshots.length - 1] : null;
  }

  clear() {
    this._snapshots = [];
  }
}

module.exports = CostAnalyzer;
