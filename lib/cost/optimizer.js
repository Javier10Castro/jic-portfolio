class Optimizer {
  constructor() {
    this._history = [];
    this._maxHistory = 500;
  }

  recommendProviderChanges(costAnalysis) {
    const ai = costAnalysis.ai || {};
    const breakdown = ai.breakdown || [];
    if (breakdown.length < 2) return [];
    const suggestions = [];
    const sorted = [...breakdown].sort((a, b) => b.cost - a.cost);
    const pricingInfo = costAnalysis._pricingInfo || {};
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const cheaper = sorted.slice(i + 1).find(c => c.cost > 0 && current.cost > c.cost * 1.5);
      if (cheaper) {
        const savings = current.cost - cheaper.cost;
        suggestions.push({ type: 'provider_change', from: `${current.provider}/${current.model}`, to: `${cheaper.provider}/${cheaper.model}`, estimatedSavings: Math.round(savings * 100) / 100, risk: 'low', confidence: 0.7, reasoning: `Switching from ${current.provider}/${current.model} to ${cheaper.provider}/${cheaper.model} could save $${savings.toFixed(2)}` });
      }
    }
    return suggestions;
  }

  recommendModelChanges(costAnalysis) {
    const ai = costAnalysis.ai || {};
    const breakdown = ai.breakdown || [];
    const suggestions = [];
    const sameProvider = {};
    for (const b of breakdown) {
      if (!sameProvider[b.provider]) sameProvider[b.provider] = [];
      sameProvider[b.provider].push(b);
    }
    for (const [provider, models] of Object.entries(sameProvider)) {
      if (models.length < 2) continue;
      const sorted = [...models].sort((a, b) => b.cost - a.cost);
      const expensive = sorted[0];
      const cheapest = sorted[sorted.length - 1];
      if (expensive.cost > cheapest.cost * 2 && expensive.count > 5) {
        suggestions.push({ type: 'model_change', provider, from: expensive.model, to: cheapest.model, estimatedSavings: Math.round((expensive.cost - cheapest.cost) * 0.5 * 100) / 100, risk: 'medium', confidence: 0.6, reasoning: `${expensive.count} requests on ${expensive.model} could use ${cheapest.model} for ~50% savings` });
      }
    }
    return suggestions;
  }

  recommendBatchExecution(costAnalysis) {
    const api = costAnalysis.api || {};
    const suggestions = [];
    if (api.totalRequests > 1000) {
      suggestions.push({ type: 'batch_execution', estimatedSavings: Math.round(api.totalCost * 0.2 * 100) / 100, risk: 'low', confidence: 0.8, reasoning: `Batching ${api.totalRequests} requests could reduce API overhead by ~20%` });
    }
    return suggestions;
  }

  recommendParallelExecution(costAnalysis) {
    const workflows = costAnalysis.workflows || {};
    const suggestions = [];
    if (workflows.totalExecutions > 50 && workflows.averageCostPerExecution > 0.005) {
      suggestions.push({ type: 'parallel_execution', estimatedSavings: Math.round(workflows.totalCost * 0.1 * 100) / 100, risk: 'medium', confidence: 0.5, reasoning: `Parallelizing workflow steps could reduce execution time and cost by ~10%` });
    }
    return suggestions;
  }

  recommendCacheUsage(costAnalysis) {
    const ai = costAnalysis.ai || {};
    const suggestions = [];
    if (ai.totalTokens > 100000) {
      const cacheSavings = Math.round(ai.totalCost * 0.15 * 100) / 100;
      suggestions.push({ type: 'cache_usage', estimatedSavings: cacheSavings, risk: 'low', confidence: 0.85, reasoning: `Caching frequent API responses could save ~$${cacheSavings.toFixed(2)} by reducing redundant token usage` });
    }
    return suggestions;
  }

  recommendWorkerAllocation(costAnalysis) {
    const cluster = costAnalysis.cluster || {};
    const suggestions = [];
    if (cluster.totalWorkers > 3 && cluster.utilizationRate < 40) {
      const suggestedWorkers = Math.max(1, Math.floor(cluster.totalWorkers * 0.6));
      const savings = cluster.estimatedMonthlyCost * 0.4;
      suggestions.push({ type: 'worker_allocation', from: cluster.totalWorkers, to: suggestedWorkers, estimatedSavings: Math.round(savings * 100) / 100, risk: 'low', confidence: 0.85, reasoning: `Reduce workers from ${cluster.totalWorkers} to ${suggestedWorkers} (utilization: ${cluster.utilizationRate}%)` });
    }
    return suggestions;
  }

  optimize(costAnalysis) {
    const result = {
      timestamp: Date.now(),
      providerChanges: this.recommendProviderChanges(costAnalysis),
      modelChanges: this.recommendModelChanges(costAnalysis),
      batchExecution: this.recommendBatchExecution(costAnalysis),
      parallelExecution: this.recommendParallelExecution(costAnalysis),
      cacheUsage: this.recommendCacheUsage(costAnalysis),
      workerAllocation: this.recommendWorkerAllocation(costAnalysis),
      totalEstimatedSavings: 0,
    };
    const allSavings = [result.providerChanges, result.modelChanges, result.batchExecution, result.parallelExecution, result.cacheUsage, result.workerAllocation].flat().map(r => r.estimatedSavings || 0);
    result.totalEstimatedSavings = Math.round(allSavings.reduce((a, b) => a + b, 0) * 100) / 100;
    this._history.push(result);
    if (this._history.length > this._maxHistory) this._history.shift();
    return result;
  }

  getHistory(limit = 10) {
    return this._history.slice(-limit);
  }

  clear() {
    this._history = [];
  }
}

module.exports = Optimizer;
