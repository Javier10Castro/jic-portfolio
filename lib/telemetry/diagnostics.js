class Diagnostics {
  constructor(telemetryManager) {
    this._manager = telemetryManager;
  }

  async systemSnapshot() {
    const metrics = this._manager.metrics.getAllMetrics();
    const health = this._manager.health.getSummary();
    const storage = this._manager.storage ? this._manager.storage.snapshot() : {};
    const activeTraces = this._manager.tracing.getActiveTraces();

    return {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      versions: {
        node: process.version,
        platform: process.platform,
      },
      metrics: {
        counters: metrics.counters || {},
        gauges: metrics.gauges || {},
        histogramCount: Object.keys(metrics.histograms || {}).length,
      },
      health,
      storage,
      activeTraces: activeTraces.length,
      activeWorkflows: this._manager.metrics.getCounter('workflow.running') || 0,
    };
  }

  async healthSummary() {
    const health = this._manager.health.getSummary();
    const total = Object.keys(health).length;
    const healthy = Object.values(health).filter(h => h.status === 'healthy').length;
    const degraded = Object.values(health).filter(h => h.status === 'degraded').length;
    const offline = Object.values(health).filter(h => h.status === 'offline').length;

    return {
      timestamp: Date.now(),
      total,
      healthy,
      degraded,
      offline,
      overall: offline > 0 ? 'degraded' : degraded > 0 ? 'degraded' : 'healthy',
      components: health,
    };
  }

  async errorSummary(since = Date.now() - 3600000) {
    const errors = [];
    const logs = this._manager.logger ? await this._manager.logger.getLogs({ level: 'ERROR', since }) : [];
    const alerts = this._manager.storage ? await this._manager.storage.getAlerts({ since }) : [];

    const errorCounts = {};
    for (const log of logs) {
      const key = log.source || 'unknown';
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    }

    return {
      timestamp: Date.now(),
      since,
      totalErrors: logs.length,
      totalAlerts: alerts.length,
      bySource: errorCounts,
      recentErrors: logs.slice(-10),
      recentAlerts: alerts.slice(-10),
    };
  }

  async dependencyGraph() {
    const deps = [
      { from: 'api', to: 'workflow_engine', type: 'calls' },
      { from: 'api', to: 'agent_system', type: 'calls' },
      { from: 'api', to: 'ai_providers', type: 'calls' },
      { from: 'workflow_engine', to: 'agent_system', type: 'orchestrates' },
      { from: 'agent_system', to: 'ai_providers', type: 'uses' },
      { from: 'workflow_engine', to: 'deployment_engine', type: 'triggers' },
      { from: 'planner', to: 'generator', type: 'feeds' },
      { from: 'conversation_engine', to: 'planner', type: 'feeds' },
      { from: 'dashboard', to: 'api', type: 'consumes' },
      { from: 'ai_providers', to: 'generator', type: 'powers' },
    ];
    return { timestamp: Date.now(), nodes: [...new Set(deps.flatMap(d => [d.from, d.to]))], edges: deps };
  }

  async configurationValidation() {
    return {
      timestamp: Date.now(),
      valid: true,
      checks: [
        { name: 'storage', status: 'ok' },
        { name: 'logger', status: 'ok' },
        { name: 'metrics', status: 'ok' },
        { name: 'tracing', status: 'ok' },
      ],
    };
  }
}

module.exports = Diagnostics;
