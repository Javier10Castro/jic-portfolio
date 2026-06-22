class CompositionReporter {
  constructor() {
    this._reports = new Map();
    this._counter = 0;
  }

  generateReport(compositionId, execution) {
    if (!compositionId) {
      throw new Error('compositionId is required');
    }

    const duration = execution && execution.startedAt
      ? (execution.completedAt
        ? new Date(execution.completedAt) - new Date(execution.startedAt)
        : Date.now() - new Date(execution.startedAt))
      : 0;

    const report = {
      compositionId,
      status: execution ? execution.status || 'unknown' : 'unknown',
      duration,
      stages: execution ? execution.stages || [] : [],
      timestamp: new Date().toISOString(),
      summary: {
        totalStages: execution ? (execution.stages ? execution.stages.length : 0) : 0,
        completedStages: execution
          ? (execution.stages
            ? execution.stages.filter(s => s.status === 'completed').length
            : 0)
          : 0,
        failedStages: execution
          ? (execution.stages
            ? execution.stages.filter(s => s.status === 'failed').length
            : 0)
          : 0
      }
    };

    this._reports.set(compositionId, report);
    return report;
  }

  generateSummary(reports) {
    if (!Array.isArray(reports) || reports.length === 0) {
      return {
        total: 0,
        completed: 0,
        failed: 0,
        averageDuration: 0,
        totalDuration: 0,
        timestamp: new Date().toISOString()
      };
    }

    const total = reports.length;
    const completed = reports.filter(r => r.status === 'completed' || r.status === 'success').length;
    const failed = reports.filter(r => r.status === 'failed').length;
    const totalDuration = reports.reduce((sum, r) => sum + (r.duration || 0), 0);
    const averageDuration = total > 0 ? totalDuration / total : 0;

    return {
      total,
      completed,
      failed,
      averageDuration,
      totalDuration,
      timestamp: new Date().toISOString()
    };
  }

  clear() {
    this._reports.clear();
    this._counter = 0;
  }
}

module.exports = { CompositionReporter };
