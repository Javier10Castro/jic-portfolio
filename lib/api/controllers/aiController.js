const ai = require('../../ai');
const { success } = require('../responses');
const { ValidationError } = require('../errors');

function listProviders(req, res) {
  return success(res, ai.listProviders());
}

async function generate(req, res) {
  const { prompt, options } = req.body;
  if (!prompt) throw new ValidationError('prompt is required');

  try {
    const result = await ai.generate(prompt, options || {});
    return success(res, result);
  } catch (err) {
    res.status(500).json({
      success: false, data: null,
      errors: [{ code: 'AIGenerationError', message: err.message, details: {} }],
      meta: { timestamp: new Date().toISOString() },
      requestId: req.requestId,
    });
  }
}

async function streamHandler(req, res) {
  const { prompt, options } = req.body;
  if (!prompt) throw new ValidationError('prompt is required');

  try {
    const result = await ai.stream(prompt, options || {});
    return success(res, result);
  } catch (err) {
    res.status(500).json({
      success: false, data: null,
      errors: [{ code: 'AIStreamError', message: err.message, details: {} }],
      meta: { timestamp: new Date().toISOString() },
      requestId: req.requestId,
    });
  }
}

async function health(req, res) {
  const healthResults = await ai.healthCheck();
  return success(res, healthResults);
}

function metrics(req, res) {
  return success(res, ai.getMetrics());
}

module.exports = { listProviders, generate, streamHandler, health, metrics };
