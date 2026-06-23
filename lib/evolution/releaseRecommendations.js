class ReleaseRecommendations {
  constructor() {
    this._recommendations = [];
    this._counter = 0;
  }

  generate(evolutionId, analysis) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'relrec_' + (++this._counter);
    const data = analysis || {};
    const recommendations = [];
    if (data.criticalDebt && data.criticalDebt > 0) {
      recommendations.push({ priority: 'critical', type: 'debt_resolution', description: `Resolve ${data.criticalDebt} critical debt items before next release` });
    }
    if (data.securityFindings && data.securityFindings > 0) {
      recommendations.push({ priority: 'critical', type: 'security_fix', description: `Address ${data.securityFindings} security findings` });
    }
    if (data.performanceGain && data.performanceGain > 0.2) {
      recommendations.push({ priority: 'medium', type: 'performance', description: `Potential ${Math.round(data.performanceGain * 100)}% performance improvement` });
    }
    if (data.costSavings && data.costSavings > 0) {
      recommendations.push({ priority: 'medium', type: 'cost_optimization', description: `Estimated cost savings of $${data.costSavings}` });
    }
    if (!data.criticalDebt && !data.securityFindings) {
      recommendations.push({ priority: 'low', type: 'maintenance', description: 'Regular maintenance release' });
    }
    const result = {
      id, evolutionId,
      recommendations,
      totalRecommendations: recommendations.length,
      timestamp: new Date().toISOString()
    };
    this._recommendations.push(result);
    return result;
  }

  get(id) {
    if (!id) return null;
    return this._recommendations.find(r => r.id === id) || null;
  }

  list() {
    return this._recommendations;
  }

  clear() {
    this._recommendations = [];
    this._counter = 0;
  }
}

module.exports = { ReleaseRecommendations };
