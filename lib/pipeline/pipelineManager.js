const crypto = require('crypto');
const { createPipelineState, transitionTo, createStageRecord, STATES } = require('./pipelineState');
const { pipelineEvents } = require('./pipelineEvents');
const { logRun, loadRun, listRuns } = require('./pipelineLogger');
const { createMetrics, recordStageMetric } = require('./pipelineMetrics');
const { validateRunInput, validateStageOrder } = require('./pipelineValidator');
const { getExecutor, STAGE_ORDER } = require('./pipelineExecutor');
const { saveCheckpoint, loadCheckpoint, deleteCheckpoint, shouldRetry, recoverFromFailure, computeRetryDelay } = require('./pipelineRecovery');
const { PipelineError } = require('./errors/PipelineError');
const { serialize, serializeTimeline, serializePerformanceReport } = require('./pipelineSerializer');

const RUNS = new Map();

function _createRun(config) {
  const runId = `run-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  const run = {
    runId,
    config,
    state: createPipelineState(),
    stages: STAGE_ORDER.map(s => createStageRecord(s)),
    metrics: createMetrics(),
    events: pipelineEvents,
    eventLog: [],
    getStageOutput(stageName) {
      const stage = this.stages.find(s => s.name === stageName);
      return stage?.output || null;
    },
  };
  RUNS.set(runId, run);
  return run;
}

function _persist(run) {
  logRun(run.runId, {
    runId: run.runId,
    config: run.config,
    state: run.state,
    stages: run.stages,
    metrics: run.metrics,
    eventLog: pipelineEvents.getEventLog().filter(e => e.data?.runId === run.runId),
  });
}

async function runConversationPipeline(conversationId, options = {}) {
  const config = { conversationId, ...options };
  const validationErrors = validateRunInput(config);
  if (validationErrors.length) throw validationErrors[0];

  const run = _createRun(config);
  pipelineEvents.emitPipelineStarted(run.runId, { conversationId });
  transitionTo(run.state, STATES.RUNNING);
  run.metrics.startedAt = new Date().toISOString();

  const enableCache = options.cache !== false;

  for (let i = 0; i < run.stages.length; i++) {
    const stage = run.stages[i];
    stage.status = 'running';
    stage.startedAt = new Date().toISOString();

    pipelineEvents.emitPipelineStageStarted(run.runId, stage.name, { index: i });

    try {
      if (stage.name === 'question_generator' && options.skipQuestions) {
        stage.status = 'skipped';
        stage.finishedAt = new Date().toISOString();
        stage.duration = 0;
        stage.output = { skipped: true };
        continue;
      }

      const executor = getExecutor(stage.name);
      if (!executor) throw new PipelineError(`No executor for stage "${stage.name}"`);

      const stageStart = Date.now();
      const result = await executor(run);
      stage.duration = Date.now() - stageStart;
      stage.output = result;
      stage.status = 'completed';
      stage.finishedAt = new Date().toISOString();

      recordStageMetric(run.metrics, stage.name, stage.duration, {
        tokens: result?.tokens || result?.counts?.total || 0,
        files: result?.filesGenerated || 0,
        pages: result?.meta?.pagesGenerated || result?.pages?.length || 0,
        questions: result?.counts?.total || 0,
      });

      pipelineEvents.emitPipelineStageCompleted(run.runId, stage.name, {
        duration: stage.duration,
        status: stage.status,
      });

      saveCheckpoint(run.runId, { state: run.state, stages: run.stages, metrics: run.metrics });

    } catch (err) {
      stage.status = 'failed';
      stage.finishedAt = new Date().toISOString();
      stage.errors.push(err.message);
      stage.duration = Date.now() - new Date(stage.startedAt).getTime();

      pipelineEvents.emitPipelineStageFailed(run.runId, stage.name, { error: err.message, attempt: (stage._retryCount || 0) + 1 });

      const maxRetries = options.maxRetries != null ? options.maxRetries : 3;
      let recovered = false;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        stage._retryCount = (stage._retryCount || 0) + 1;
        const delay = computeRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        try {
          stage.status = 'running';
          stage.errors = [];
          const stageStart = Date.now();
          const executor = getExecutor(stage.name);
          const result = await executor(run);
          stage.duration = Date.now() - stageStart;
          stage.output = result;
          stage.status = 'completed';
          stage.finishedAt = new Date().toISOString();
          pipelineEvents.emitPipelineStageCompleted(run.runId, stage.name, { duration: stage.duration, retry: true });
          pipelineEvents.emitPipelineRecovered(run.runId, { stage: stage.name, attempt: attempt + 1 });
          recovered = true;
          break;
        } catch (retryErr) {
          stage.errors.push(retryErr.message);
          stage.status = 'failed';
          stage.finishedAt = new Date().toISOString();
        }
      }

      if (!recovered) {
        transitionTo(run.state, STATES.FAILED);
        run.state.error = `Stage "${stage.name}" failed after retries: ${err.message}`;
        _persist(run);
        return { success: false, runId: run.runId, error: run.state.error, stage: stage.name, state: run.state, stages: run.stages };
      }
    }
  }

  transitionTo(run.state, STATES.COMPLETED);
  run.metrics.finishedAt = new Date().toISOString();
  pipelineEvents.emitPipelineCompleted(run.runId, { stages: run.stages.length, metrics: run.metrics });
  _persist(run);
  deleteCheckpoint(run.runId);

  return { success: true, runId: run.runId, state: run.state, stages: run.stages, metrics: run.metrics };
}

async function runProjectPipeline(projectId, options = {}) {
  const saas = require('../saas/index.js');
  const project = saas.projectManager.getProject(projectId);
  if (!project) return { success: false, error: `Project "${projectId}" not found` };
  return runConversationPipeline(project.conversationId || projectId, { ...options, projectId });
}

async function resumePipeline(runId) {
  const persisted = loadRun(runId);
  if (!persisted) return { success: false, error: `Run "${runId}" not found` };
  const run = _createRun(persisted.config);
  run.state = persisted.state;
  run.stages = persisted.stages;
  run.metrics = persisted.metrics;

  if (run.state.status !== STATES.PAUSED && run.state.status !== STATES.FAILED && run.state.status !== STATES.RECOVERED) {
    return { success: false, error: `Run "${runId}" is in state "${run.state.status}" and cannot be resumed` };
  }

  pipelineEvents.emitPipelineResumed(run.runId, { previousStatus: run.state.status });
  transitionTo(run.state, STATES.RUNNING);

  const lastCompletedIdx = run.stages.reduce((max, s, i) => s.status === 'completed' ? i : max, -1);
  const startIdx = Math.max(0, lastCompletedIdx + 1);

  for (let i = startIdx; i < run.stages.length; i++) {
    const stage = run.stages[i];
    stage.status = 'running';
    stage.startedAt = new Date().toISOString();
    pipelineEvents.emitPipelineStageStarted(run.runId, stage.name, { index: i, resumed: true });

    try {
      const executor = getExecutor(stage.name);
      const stageStart = Date.now();
      const result = await executor(run);
      stage.duration = Date.now() - stageStart;
      stage.output = result;
      stage.status = 'completed';
      stage.finishedAt = new Date().toISOString();
      pipelineEvents.emitPipelineStageCompleted(run.runId, stage.name, { duration: stage.duration });
    } catch (err) {
      stage.status = 'failed';
      stage.finishedAt = new Date().toISOString();
      stage.errors.push(err.message);
      pipelineEvents.emitPipelineStageFailed(run.runId, stage.name, { error: err.message });
      transitionTo(run.state, STATES.FAILED);
      _persist(run);
      return { success: false, runId, error: err.message, stage: stage.name };
    }
  }

  transitionTo(run.state, STATES.COMPLETED);
  pipelineEvents.emitPipelineCompleted(run.runId, { stages: run.stages.length });
  _persist(run);
  return { success: true, runId, state: run.state, stages: run.stages };
}

function cancelPipeline(runId) {
  const run = RUNS.get(runId) || loadRun(runId);
  if (!run) return { success: false, error: `Run "${runId}" not found` };
  if (run.state.status === STATES.COMPLETED || run.state.status === STATES.CANCELLED) {
    return { success: false, error: `Run "${runId}" is already ${run.state.status}` };
  }
  transitionTo(run.state, STATES.CANCELLED);
  pipelineEvents.emitPipelineCancelled(runId, {});
  _persist(RUNS.get(runId) || run);
  return { success: true, runId };
}

function retryFailedStage(runId) {
  const persisted = loadRun(runId);
  if (!persisted) return { success: false, error: `Run "${runId}" not found` };
  const failedStage = persisted.stages.find(s => s.status === 'failed');
  if (!failedStage) return { success: false, error: 'No failed stage to retry' };
  const recovered = recoverFromFailure(persisted, failedStage.name);
  if (!recovered) return { success: false, error: 'Could not recover from failure' };
  logRun(runId, recovered);
  return { success: true, runId, stage: failedStage.name };
}

function getPipelineStatus(runId) {
  const run = RUNS.get(runId) || loadRun(runId);
  if (!run) return null;

  const currentStage = run.stages.find(s => s.status === 'running') || run.stages.find(s => s.status === 'pending');
  const completed = run.stages.filter(s => s.status === 'completed').length;
  const failed = run.stages.filter(s => s.status === 'failed').length;

  return {
    runId,
    status: run.state.status,
    currentStage: currentStage?.name || null,
    progress: { total: run.stages.length, completed, failed, pct: Math.round((completed / run.stages.length) * 100) },
    startedAt: run.state.startedAt,
    finishedAt: run.state.finishedAt,
    error: run.state.error,
  };
}

function listPipelineRuns() {
  return listRuns();
}

module.exports = {
  runConversationPipeline,
  runProjectPipeline,
  resumePipeline,
  cancelPipeline,
  retryFailedStage,
  getPipelineStatus,
  listPipelineRuns,
};
