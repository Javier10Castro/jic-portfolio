const { pipelineManager } = require('../../pipeline');
const { success, created } = require('../responses');
const { NotFoundError, ValidationError } = require('../errors');

function runPipeline(req, res) {
  const { conversationId, projectId, options } = req.body;
  if (!conversationId && !projectId) {
    throw new ValidationError('Either conversationId or projectId is required');
  }
  if (conversationId) {
    const resultPromise = pipelineManager.runConversationPipeline(conversationId, options || {});
    resultPromise.then(result => {
      res.json({
        success: result.success,
        data: result.success ? result : null,
        errors: result.success ? null : [{ code: 'PipelineError', message: result.error, details: { stage: result.stage } }],
        meta: { timestamp: new Date().toISOString(), runId: result.runId },
        requestId: req.requestId,
      });
    }).catch(err => {
      res.status(500).json({
        success: false, data: null,
        errors: [{ code: 'InternalServerError', message: err.message, details: {} }],
        meta: { timestamp: new Date().toISOString() },
        requestId: req.requestId,
      });
    });
  } else {
    const resultPromise = pipelineManager.runProjectPipeline(projectId, options || {});
    resultPromise.then(result => {
      res.json({
        success: result.success,
        data: result.success ? result : null,
        errors: result.success ? null : [{ code: 'PipelineError', message: result.error, details: { stage: result.stage } }],
        meta: { timestamp: new Date().toISOString(), runId: result.runId },
        requestId: req.requestId,
      });
    }).catch(err => {
      res.status(500).json({
        success: false, data: null,
        errors: [{ code: 'InternalServerError', message: err.message, details: {} }],
        meta: { timestamp: new Date().toISOString() },
        requestId: req.requestId,
      });
    });
  }
}

function runProjectPipelineHandler(req, res) {
  const { id } = req.params;
  if (!id) throw new ValidationError('Project ID is required');
  const resultPromise = pipelineManager.runProjectPipeline(id, req.body.options || {});
  resultPromise.then(result => {
    res.json({
      success: result.success,
      data: result.success ? result : null,
      errors: result.success ? null : [{ code: 'PipelineError', message: result.error, details: { stage: result.stage } }],
      meta: { timestamp: new Date().toISOString(), runId: result.runId },
      requestId: req.requestId,
    });
  }).catch(err => {
    res.status(500).json({
      success: false, data: null,
      errors: [{ code: 'InternalServerError', message: err.message, details: {} }],
      meta: { timestamp: new Date().toISOString() },
      requestId: req.requestId,
    });
  });
}

function getPipeline(req, res) {
  const run = pipelineManager.getPipelineStatus(req.params.id);
  if (!run) throw new NotFoundError(`Pipeline run "${req.params.id}" not found`);
  return success(res, run);
}

function getPipelineStatus(req, res) {
  const status = pipelineManager.getPipelineStatus(req.params.id);
  if (!status) throw new NotFoundError(`Pipeline run "${req.params.id}" not found`);
  return success(res, status);
}

function cancelPipeline(req, res) {
  const result = pipelineManager.cancelPipeline(req.params.id);
  if (!result.success) throw new NotFoundError(result.error);
  return success(res, result);
}

function resumePipeline(req, res) {
  const resultPromise = pipelineManager.resumePipeline(req.params.id);
  resultPromise.then(result => {
    res.json({
      success: result.success,
      data: result.success ? result : null,
      errors: result.success ? null : [{ code: 'PipelineError', message: result.error }],
      meta: { timestamp: new Date().toISOString() },
      requestId: req.requestId,
    });
  }).catch(err => {
    res.status(500).json({
      success: false, data: null,
      errors: [{ code: 'InternalServerError', message: err.message, details: {} }],
      meta: { timestamp: new Date().toISOString() },
      requestId: req.requestId,
    });
  });
}

function retryPipeline(req, res) {
  const result = pipelineManager.retryFailedStage(req.params.id);
  if (!result.success) throw new NotFoundError(result.error);
  return success(res, result);
}

module.exports = { runPipeline, runProjectPipelineHandler, getPipeline, getPipelineStatus, cancelPipeline, resumePipeline, retryPipeline };
