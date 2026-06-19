class EventFilters {
  constructor() {
    this._filters = new Map();
  }

  register(name, filterFn) {
    if (typeof filterFn !== 'function') throw new Error('Filter must be a function');
    this._filters.set(name, filterFn);
  }

  apply(event, filterNames) {
    if (!filterNames || filterNames.length === 0) return { passed: true, event, failedFilters: [] };
    const failed = [];
    for (const name of filterNames) {
      const filterFn = this._filters.get(name);
      if (!filterFn) continue;
      const result = filterFn(event);
      if (!result) failed.push(name);
    }
    return { passed: failed.length === 0, event, failedFilters: failed };
  }

  chain(event, filterNames) {
    return filterNames.reduce((result, name) => {
      if (!result.passed) return result;
      const filterFn = this._filters.get(name);
      if (!filterFn) return result;
      const passed = filterFn(result.event);
      return { passed, event: result.event, lastFilter: passed ? null : name };
    }, { passed: true, event, lastFilter: null });
  }

  builtin() {
    return {
      highSeverity: (e) => e.severity === 'critical' || e.severity === 'error',
      infoOnly: (e) => e.severity === 'info',
      workflowOnly: (e) => e.type.startsWith('workflow.'),
      agentOnly: (e) => e.type.startsWith('agent.'),
      clusterOnly: (e) => e.type.startsWith('cluster.'),
      apiOnly: (e) => e.type.startsWith('api.'),
      aiOnly: (e) => e.type.startsWith('ai.'),
      telemetryOnly: (e) => e.type.startsWith('telemetry.'),
      noReplay: (e) => !e.metadata || !e.metadata.replay,
      hasCorrelationId: (e) => !!e.correlationId,
      recentOnly: (e) => e.timestamp > Date.now() - 60000,
    };
  }

  list() {
    return Array.from(this._filters.keys());
  }

  remove(name) {
    this._filters.delete(name);
  }

  clear() {
    this._filters.clear();
  }
}

module.exports = EventFilters;
