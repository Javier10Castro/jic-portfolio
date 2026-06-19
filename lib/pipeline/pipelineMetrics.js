function createMetrics() {
  return {
    executionTimeMs: 0,
    tokensProcessed: 0,
    filesGenerated: 0,
    pagesGenerated: 0,
    questionsAsked: 0,
    aiCalls: 0,
    deploymentDurationMs: 0,
    cacheHitCount: 0,
    cacheMissCount: 0,
    stageMetrics: {},
    startedAt: null,
    finishedAt: null,
  };
}

function recordStageMetric(metrics, stage, durationMs, data = {}) {
  if (!metrics.stageMetrics) metrics.stageMetrics = {};
  metrics.stageMetrics[stage] = {
    durationMs,
    ...data,
    timestamp: new Date().toISOString(),
  };
  metrics.executionTimeMs += durationMs;
  if (data.tokens) metrics.tokensProcessed += data.tokens;
  if (data.files) metrics.filesGenerated += data.files;
  if (data.pages) metrics.pagesGenerated += data.pages;
  if (data.questions) metrics.questionsAsked += data.questions;
  if (data.aiCalls) metrics.aiCalls += data.aiCalls;
}

function recordCacheHit(metrics) { metrics.cacheHitCount++; }
function recordCacheMiss(metrics) { metrics.cacheMissCount++; }

function getSummary(metrics) {
  return {
    totalTimeMs: metrics.executionTimeMs,
    totalTimeFormatted: `${(metrics.executionTimeMs / 1000).toFixed(1)}s`,
    tokensProcessed: metrics.tokensProcessed,
    filesGenerated: metrics.filesGenerated,
    pagesGenerated: metrics.pagesGenerated,
    questionsAsked: metrics.questionsAsked,
    aiCalls: metrics.aiCalls,
    cacheHitRate: metrics.cacheHitCount + metrics.cacheMissCount > 0
      ? `${Math.round((metrics.cacheHitCount / (metrics.cacheHitCount + metrics.cacheMissCount)) * 100)}%`
      : '0%',
    stagesCompleted: Object.keys(metrics.stageMetrics).length,
  };
}

module.exports = { createMetrics, recordStageMetric, recordCacheHit, recordCacheMiss, getSummary };
