const { getSummary } = require('./pipelineMetrics');

function serialize(pipelineRun) {
  return JSON.stringify({
    runId: pipelineRun.runId,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    config: pipelineRun.config,
    state: pipelineRun.state,
    stages: pipelineRun.stages,
    metrics: getSummary(pipelineRun.metrics),
    events: pipelineRun.events?.getEventLog ? pipelineRun.events.getEventLog() : (pipelineRun.eventLog || []),
  }, null, 2);
}

function serializeTimeline(pipelineRun) {
  const stages = pipelineRun.stages || [];
  return {
    runId: pipelineRun.runId,
    startedAt: pipelineRun.state?.startedAt,
    finishedAt: pipelineRun.state?.finishedAt,
    stages: stages.map(s => ({
      name: s.name,
      status: s.status,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
      duration: s.duration,
      warnings: s.warnings?.length || 0,
      errors: s.errors?.length || 0,
    })),
  };
}

function serializePerformanceReport(pipelineRun) {
  const metrics = pipelineRun.metrics || {};
  const stages = pipelineRun.stages || [];
  const perfByStage = stages.map(s => ({
    stage: s.name,
    durationMs: s.duration,
    status: s.status,
    pctOfTotal: pipelineRun.state?.finishedAt ? Math.round((s.duration / metrics.executionTimeMs) * 100) : 0,
  }));
  return {
    runId: pipelineRun.runId,
    totalTimeMs: metrics.executionTimeMs,
    stageBreakdown: perfByStage,
    cacheHitRate: metrics.cacheHitRate || '0%',
    tokensProcessed: metrics.tokensProcessed,
    aiCalls: metrics.aiCalls,
  };
}

module.exports = { serialize, serializeTimeline, serializePerformanceReport };
