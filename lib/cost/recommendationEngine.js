const IMPACT_WEIGHTS = { high: 3, medium: 2, low: 1 };

class RecommendationEngine {
  constructor() {
    this._recommendations = [];
    this._maxRecommendations = 500;
    this._appliedRecs = new Set();
  }

  generate(costAnalysis, budgetStatus, quotaStatus, policies) {
    const recommendations = [];

    recommendations.push(...this._checkProviderOptimization(costAnalysis));
    recommendations.push(...this._checkClusterOptimization(costAnalysis));
    recommendations.push(...this._checkBudgetWarnings(budgetStatus));
    recommendations.push(...this._checkQuotaWarnings(quotaStatus));
    recommendations.push(...this._checkWorkflowOptimization(costAnalysis));

    const scored = recommendations.map(r => ({ ...r, score: this._calculateScore(r) })).sort((a, b) => b.score - a.score);

    for (const r of scored) {
      this._recommendations.push(r);
      if (this._recommendations.length > this._maxRecommendations) this._recommendations.shift();
    }
    return scored;
  }

  getRecommendations(filter = {}) {
    let results = this._recommendations;
    if (filter.impact) results = results.filter(r => r.impact === filter.impact);
    if (filter.category) results = results.filter(r => r.category === filter.category);
    if (filter.minConfidence) results = results.filter(r => r.confidence >= filter.minConfidence);
    return results.slice(-(filter.limit || 50));
  }

  markApplied(recId) {
    this._appliedRecs.add(recId);
  }

  getAppliedCount() {
    return this._appliedRecs.size;
  }

  clear() {
    this._recommendations = [];
    this._appliedRecs.clear();
  }

  _checkProviderOptimization(analysis) {
    const recs = [];
    const ai = analysis.ai || {};
    const breakdown = ai.breakdown || [];
    const expensiveProviders = breakdown.filter(b => b.cost > 0).sort((a, b) => b.cost - a.cost);
    if (expensiveProviders.length > 0) {
      const top = expensiveProviders[0];
      const totalCost = ai.totalCost || 0;
      if (totalCost > 0) {
        const pct = (top.cost / totalCost) * 100;
        if (pct > 60) {
          recs.push({ id: 'rec-' + Math.random().toString(36).substring(2, 10), category: 'ai_provider', impact: 'high', title: `Optimize ${top.provider}/${top.model} usage`, description: `${top.provider} ${top.model} accounts for ${Math.round(pct)}% of AI spend ($${top.cost.toFixed(2)}). Consider switching to a lower-cost model.`, expectedSavings: Math.round(top.cost * 0.3 * 100) / 100, risk: 'medium', confidence: 0.75, affectedSystems: ['ai', 'provider'], createdAt: Date.now() });
        }
        if (breakdown.length > 1) {
          const cheapestModel = breakdown.reduce((min, b) => b.cost < min.cost ? b : min, breakdown[0]);
          if (cheapestModel.cost >= 0 && top.cost > cheapestModel.cost * 2) {
            recs.push({ id: 'rec-' + Math.random().toString(36).substring(2, 10), category: 'ai_provider', impact: 'medium', title: `Evaluate ${cheapestModel.provider}/${cheapestModel.model} for more tasks`, description: `Cheapest model (${cheapestModel.provider}/${cheapestModel.model}) costs $${cheapestModel.cost.toFixed(2)} vs $${top.cost.toFixed(2)} for most expensive.`, expectedSavings: Math.round((top.cost - cheapestModel.cost) * 0.5 * 100) / 100, risk: 'low', confidence: 0.6, affectedSystems: ['ai', 'provider'], createdAt: Date.now() });
          }
        }
      }
    }
    return recs;
  }

  _checkClusterOptimization(analysis) {
    const recs = [];
    const cluster = analysis.cluster || {};
    const utilizationRate = cluster.utilizationRate || 0;
    if (utilizationRate < 50 && (cluster.totalWorkers || 0) > 2) {
      recs.push({ id: 'rec-' + Math.random().toString(36).substring(2, 10), category: 'cluster', impact: 'high', title: 'Downscale underutilized cluster', description: `Cluster utilization is ${utilizationRate}% with ${cluster.totalWorkers} workers. Consider reducing worker count to save ~$${(cluster.estimatedMonthlyCost || 0).toFixed(2)}/month.`, expectedSavings: Math.round((cluster.estimatedMonthlyCost || 0) * 0.4 * 100) / 100, risk: 'low', confidence: 0.85, affectedSystems: ['cluster'], createdAt: Date.now() });
    }
    if ((cluster.queueDepth || 0) > 100 && utilizationRate > 80) {
      recs.push({ id: 'rec-' + Math.random().toString(36).substring(2, 10), category: 'cluster', impact: 'high', title: 'Scale up cluster for queue depth', description: `Queue depth (${cluster.queueDepth}) is high with ${utilizationRate}% utilization. Add workers to reduce latency.`, expectedSavings: 0, risk: 'low', confidence: 0.9, affectedSystems: ['cluster'], createdAt: Date.now() });
    }
    return recs;
  }

  _checkBudgetWarnings(budgetStatus) {
    const recs = [];
    const alerts = budgetStatus?.alerts || [];
    for (const alert of alerts) {
      if (alert.level === 'critical' || alert.currentPercent >= 90) {
        recs.push({ id: 'rec-' + Math.random().toString(36).substring(2, 10), category: 'budget', impact: 'high', title: `Budget alert: ${alert.budgetName}`, description: `${alert.budgetName} is at ${alert.currentPercent}% of hard limit ($${alert.currentSpend.toFixed(2)} / $${alert.hardLimit.toFixed(2)}).`, expectedSavings: 0, risk: 'medium', confidence: 0.95, affectedSystems: ['cost', 'budget'], createdAt: Date.now() });
      }
    }
    return recs;
  }

  _checkQuotaWarnings(quotaStatus) {
    const recs = [];
    const daily = quotaStatus?.daily || [];
    for (const q of daily) {
      if (q.pct >= 80) {
        recs.push({ id: 'rec-' + Math.random().toString(36).substring(2, 10), category: 'quota', impact: 'medium', title: `Quota nearing limit: ${q.key}`, description: `${q.key} daily usage is at ${q.pct}% (${q.used} / ${q.limit}).`, expectedSavings: 0, risk: 'low', confidence: 0.9, affectedSystems: ['cost', 'quota'], createdAt: Date.now() });
      }
    }
    return recs;
  }

  _checkWorkflowOptimization(analysis) {
    const recs = [];
    const workflows = analysis.workflows || {};
    if (workflows.totalExecutions > 0 && workflows.averageCostPerExecution > 0.01) {
      recs.push({ id: 'rec-' + Math.random().toString(36).substring(2, 10), category: 'workflow', impact: 'medium', title: 'Optimize expensive workflows', description: `Average workflow execution cost is $${workflows.averageCostPerExecution.toFixed(4)}. Review and optimize high-cost workflows.`, expectedSavings: Math.round(workflows.totalCost * 0.15 * 100) / 100, risk: 'medium', confidence: 0.6, affectedSystems: ['workflows'], createdAt: Date.now() });
    }
    return recs;
  }

  _calculateScore(rec) {
    const impactWeight = IMPACT_WEIGHTS[rec.impact] || 1;
    const savings = rec.expectedSavings || 0;
    const confidence = rec.confidence || 0.5;
    const riskPenalty = rec.risk === 'high' ? 0.3 : rec.risk === 'medium' ? 0.15 : 0;
    return Math.round((impactWeight * 10 + savings * 2 + confidence * 5 - riskPenalty * 5) * 100) / 100;
  }
}

module.exports = RecommendationEngine;
