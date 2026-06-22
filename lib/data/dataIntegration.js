class DataIntegration {
  constructor(platform) {
    this._platform = platform;
    this._enabled = true;
    this._integrationLog = [];
  }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }
  isEnabled() { return this._enabled; }

  integrateConversation(context) { return this._log('conversation', context); }
  integrateEvaluation(context) { return this._log('evaluation', context); }
  integrateWorkflow(context) { return this._log('workflow', context); }
  integrateAI(context) { return this._log('ai', context); }
  integrateAgent(context) { return this._log('agent', context); }
  integratePlugin(context) { return this._log('plugin', context); }
  integrateBilling(context) { return this._log('billing', context); }
  integrateSecurity(context) { return this._log('security', context); }
  integrateGovernance(context) { return this._log('governance', context); }
  integrateTelemetry(context) { return this._log('telemetry', context); }

  _log(source, context) {
    if (!this._enabled) return null;
    const entry = { source, context, timestamp: Date.now() };
    this._integrationLog.push(entry);
    if (this._integrationLog.length > 1000) this._integrationLog.shift();
    if (this._platform && this._platform.events) {
      this._platform.events.emit('data:integration', entry);
    }
    return entry;
  }

  getLog(filters) {
    let log = this._integrationLog;
    if (filters?.source) log = log.filter(e => e.source === filters.source);
    if (filters?.since) log = log.filter(e => e.timestamp >= filters.since);
    if (filters?.limit) log = log.slice(0, filters.limit);
    return log;
  }

  getStats() {
    const bySource = {};
    for (const e of this._integrationLog) {
      bySource[e.source] = (bySource[e.source] || 0) + 1;
    }
    return { total: this._integrationLog.length, bySource };
  }

  clear() { this._integrationLog = []; }
}
module.exports = { DataIntegration };
