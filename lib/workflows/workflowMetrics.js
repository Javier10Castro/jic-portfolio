class WorkflowMetrics {
  constructor() {
    this._executions = [];
    this._maxHistory = 500;
  }

  recordExecution(workflowId, data) {
    const entry = {
      workflowId,
      timestamp: Date.now(),
      ...data,
    };
    this._executions.push(entry);
    if (this._executions.length > this._maxHistory) this._executions.shift();
    return entry;
  }

  getAggregates() {
    const total = this._executions.length;
    if (total === 0) return { totalExecutions: 0, avgDuration: 0, totalFailures: 0, failureRate: 0, avgRetries: 0, avgProviderLatency: 0, queueWaitAvg: 0 };

    const durations = this._executions.filter(e => e.duration != null).map(e => e.duration);
    const failures = this._executions.filter(e => e.status === 'failed' || e.status === 'FAILED');
    const retries = this._executions.filter(e => e.retries != null).map(e => e.retries);
    const providerLatency = this._executions.filter(e => e.aiLatency != null).map(e => e.aiLatency);
    const queueWaits = this._executions.filter(e => e.queueWait != null).map(e => e.queueWait);

    return {
      totalExecutions: total,
      avgDuration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      totalFailures: failures.length,
      failureRate: total ? failures.length / total : 0,
      avgRetries: retries.length ? retries.reduce((a, b) => a + b, 0) / retries.length : 0,
      avgProviderLatency: providerLatency.length ? providerLatency.reduce((a, b) => a + b, 0) / providerLatency.length : 0,
      queueWaitAvg: queueWaits.length ? queueWaits.reduce((a, b) => a + b, 0) / queueWaits.length : 0,
    };
  }

  getWorkflowMetrics(workflowId) {
    const entries = this._executions.filter(e => e.workflowId === workflowId);
    return {
      executions: entries.length,
      entries: entries.slice(-10),
      ...this._aggregateEntries(entries),
    };
  }

  getStepMetrics(stepId) {
    const entries = this._executions.filter(e => e.stepId === stepId);
    return {
      executions: entries.length,
      entries: entries.slice(-10),
      ...this._aggregateEntries(entries),
    };
  }

  _aggregateEntries(entries) {
    if (entries.length === 0) return { avgDuration: 0, avgRetries: 0 };
    const durations = entries.filter(e => e.duration != null).map(e => e.duration);
    const retries = entries.filter(e => e.retries != null).map(e => e.retries);
    return {
      avgDuration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      avgRetries: retries.length ? retries.reduce((a, b) => a + b, 0) / retries.length : 0,
    };
  }

  reset() {
    this._executions = [];
  }
}

module.exports = WorkflowMetrics;
