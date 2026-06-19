const INSIGHT_RULES = [
  {
    name: 'retry_backoff_too_aggressive',
    condition: (ctx) => {
      const recent = ctx.patterns.filter(p => p.pattern === 'retry_loop_detected');
      return recent.length >= 2 ? { match: true, confidence: 0.75 } : { match: false };
    },
    generate: () => ({
      insight: 'Workflow retry loop detected across multiple workflows',
      recommendation: 'Increase retry backoff multiplier from 2x to 3x and add jitter',
      autoFixAvailable: true,
      priority: 'high',
    }),
  },
  {
    name: 'cluster_underprovisioned',
    condition: (ctx) => {
      const imbalance = ctx.patterns.filter(p => p.pattern === 'cluster_imbalance');
      return imbalance.length >= 2 ? { match: true, confidence: 0.8 } : { match: false };
    },
    generate: () => ({
      insight: 'Cluster is underprovisioned — queue depth exceeds worker capacity',
      recommendation: 'Add 2-3 additional workers or increase worker processing throughput',
      autoFixAvailable: false,
      priority: 'critical',
    }),
  },
  {
    name: 'ai_provider_degradation',
    condition: (ctx) => {
      const fallbacks = ctx.patterns.filter(p => p.pattern === 'ai_fallback_chain');
      return fallbacks.length >= 1 ? { match: true, confidence: 0.65 } : { match: false };
    },
    generate: () => ({
      insight: 'Primary AI provider may be degraded — repeated fallback chains detected',
      recommendation: 'Consider switching default provider or enabling circuit breaker',
      autoFixAvailable: true,
      priority: 'medium',
    }),
  },
  {
    name: 'error_rate_anomaly',
    condition: (ctx) => {
      const errorAnomalies = ctx.anomalies.filter(a => a.type === 'error_rate_spike');
      return errorAnomalies.length >= 1 ? { match: true, confidence: 0.85 } : { match: false };
    },
    generate: (ctx) => {
      const spike = ctx.anomalies.find(a => a.type === 'error_rate_spike');
      return {
        insight: `Error rate spike detected in ${spike?.detail?.source || 'system'} — z-score: ${spike?.detail?.zScore || 'N/A'}`,
        recommendation: 'Investigate recent deployments and check system logs for root cause',
        autoFixAvailable: false,
        priority: 'high',
      };
    },
  },
  {
    name: 'latency_degradation',
    condition: (ctx) => {
      const latencyAnomalies = ctx.anomalies.filter(a => a.type === 'latency_anomaly');
      return latencyAnomalies.length >= 2 ? { match: true, confidence: 0.7 } : { match: false };
    },
    generate: (ctx) => {
      const latencies = ctx.anomalies.filter(a => a.type === 'latency_anomaly');
      const avgLatency = latencies.reduce((s, a) => s + (a.detail?.latency || 0), 0) / latencies.length;
      return {
        insight: `System latency degradation detected — average ${Math.round(avgLatency)}ms across ${latencies.length} events`,
        recommendation: 'Review provider performance and consider scaling resources',
        autoFixAvailable: false,
        priority: 'medium',
      };
    },
  },
  {
    name: 'state_transition_error',
    condition: (ctx) => {
      const badTransitions = ctx.anomalies.filter(a => a.type === 'invalid_state_transition');
      return badTransitions.length >= 1 ? { match: true, confidence: 0.9 } : { match: false };
    },
    generate: (ctx) => {
      const bad = ctx.anomalies.find(a => a.type === 'invalid_state_transition');
      return {
        insight: `Invalid state transition detected: ${bad?.detail?.from} → ${bad?.detail?.to}`,
        recommendation: 'Check workflow state machine definition and ensure transition rules are correct',
        autoFixAvailable: true,
        priority: 'high',
      };
    },
  },
  {
    name: 'system_stable',
    condition: (ctx) => {
      const hasNoAnomalies = ctx.anomalies.length === 0;
      const hasNoPatterns = ctx.patterns.length === 0;
      return (hasNoAnomalies && hasNoPatterns) ? { match: true, confidence: 0.95 } : { match: false };
    },
    generate: () => ({
      insight: 'System operating normally — no anomalies or patterns detected',
      recommendation: 'No action required',
      autoFixAvailable: false,
      priority: 'low',
    }),
  },
];

class InsightGenerator {
  constructor() {
    this._insights = [];
    this._maxInsights = 200;
    this._lastRun = 0;
  }

  evaluate(anomalies, patterns) {
    const ctx = { anomalies, patterns };
    const newInsights = [];

    for (const rule of INSIGHT_RULES) {
      try {
        const result = rule.condition(ctx);
        if (result.match) {
          const insight = rule.generate(ctx);
          newInsights.push({
            id: 'insight-' + Math.random().toString(36).substring(2, 10),
            timestamp: Date.now(),
            rule: rule.name,
            confidence: result.confidence,
            ...insight,
          });
        }
      } catch (e) {
        continue;
      }
    }

    for (const insight of newInsights) {
      this._insights.push(insight);
      if (this._insights.length > this._maxInsights) this._insights.shift();
    }

    this._lastRun = Date.now();
    return newInsights;
  }

  getInsights(filter = {}) {
    let results = this._insights;
    if (filter.priority) results = results.filter(i => i.priority === filter.priority);
    if (filter.since) results = results.filter(i => i.timestamp >= filter.since);
    return results.slice(-50);
  }

  clear() {
    this._insights = [];
  }
}

module.exports = InsightGenerator;
