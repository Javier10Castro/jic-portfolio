class RecommendationEngine {
  constructor() {
    this.recommendations = new Map();
  }

  analyze(metrics, history) {
    const id = 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const recommendations = [];
    if (metrics.score !== undefined && metrics.score < 0.5) {
      recommendations.push({
        type: 'improvement',
        area: 'score',
        priority: 'high',
        suggestion: 'Overall score is low. Focus on improving core metrics.',
      });
    }
    if (metrics.latency && metrics.latency > 1000) {
      recommendations.push({
        type: 'optimization',
        area: 'latency',
        priority: 'medium',
        suggestion: 'High latency detected. Consider caching or parallel execution.',
      });
    }
    if (history && Array.isArray(history) && history.length > 5) {
      const recent = history.slice(-5);
      const trend = recent.filter(r => r.score >= 0.7).length / recent.length;
      if (trend < 0.4) {
        recommendations.push({
          type: 'alert',
          area: 'trend',
          priority: 'high',
          suggestion: 'Performance trend is declining. Investigate recent changes.',
        });
      }
    }
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        area: 'general',
        priority: 'low',
        suggestion: 'No significant issues detected.',
      });
    }
    const entry = {
      id,
      recommendations,
      metrics,
      createdAt: new Date(),
      applied: false,
      dismissed: false,
    };
    this.recommendations.set(id, entry);
    return entry;
  }

  getRecommendations(filter) {
    let results = Array.from(this.recommendations.values());
    if (filter) {
      if (filter.applied !== undefined) results = results.filter(r => r.applied === filter.applied);
      if (filter.dismissed !== undefined) results = results.filter(r => r.dismissed === filter.dismissed);
      if (filter.type) results = results.filter(r => r.recommendations.some(rec => rec.type === filter.type));
    }
    return results;
  }

  apply(id) {
    const entry = this.recommendations.get(id);
    if (!entry) return null;
    entry.applied = true;
    entry.appliedAt = new Date();
    return entry;
  }

  dismiss(id) {
    const entry = this.recommendations.get(id);
    if (!entry) return null;
    entry.dismissed = true;
    entry.dismissedAt = new Date();
    return entry;
  }

  getStats() {
    const all = Array.from(this.recommendations.values());
    return {
      total: all.length,
      applied: all.filter(r => r.applied).length,
      dismissed: all.filter(r => r.dismissed).length,
      pending: all.filter(r => !r.applied && !r.dismissed).length,
    };
  }

  clear() {
    this.recommendations.clear();
  }
}

module.exports = RecommendationEngine;
