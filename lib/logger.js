const crypto = require('crypto');

function requestId(req) {
  if (!req) return null;
  if (Object.prototype.hasOwnProperty.call(req, 'requestId')) return req.requestId;
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  Object.defineProperty(req, 'requestId', { value: id, writable: false, enumerable: true });
  return id;
}

function bodyType(req) {
  if (!req || req._bodyParseMethod) return req._bodyParseMethod || 'unknown';
  if (req.body === null || req.body === undefined) return 'null';
  if (typeof req.body === 'object') return 'object';
  if (typeof req.body === 'string') return 'string';
  return typeof req.body;
}

function isDebugEnabled() {
  return process.env.DEBUG_API === 'true' || process.env.DEBUG_RATE_LIMIT === 'true';
}

function entry(level, req, message, data) {
  const e = { level, timestamp: new Date().toISOString(), requestId: requestId(req), message, ...data };
  return e;
}

function event(eventType, req, details) {
  const e = {
    type: 'observability',
    event: eventType,
    timestamp: new Date().toISOString(),
    requestId: requestId(req),
    ...details,
  };
  if (req && req._testMode) e.testMode = req._testMode;
  console.log(JSON.stringify(e));
}

function error(req, message, err, data) {
  const e = entry('error', req, message, {
    error: err ? { message: err.message, code: err.code, statusCode: err.statusCode } : undefined,
    ...data,
  });
  console.error(JSON.stringify(e));
}

function info(req, message, data) {
  if (!isDebugEnabled()) return;
  console.log(JSON.stringify(entry('info', req, message, data)));
}

function warn(req, message, data) {
  if (!isDebugEnabled()) return;
  console.warn(JSON.stringify(entry('warn', req, message, data)));
}

function debugLog(req, message, data) {
  if (!isDebugEnabled()) return;
  console.log(JSON.stringify(entry('debug', req, message, data)));
}

function logStage(req, stageName) {
  if (!isDebugEnabled()) return;
  if (!req) return;
  if (!req._debugStart) req._debugStart = Date.now();
  const e = {
    type: 'stage',
    endpoint: req._debugEndpoint || 'unknown',
    stage: stageName,
    elapsed_ms: Date.now() - req._debugStart,
    request_id: requestId(req),
  };
  console.log(JSON.stringify(e));
}

function initTrace(req) {
  if (!req) return;
  if (!req._lifecycle) req._lifecycle = { trace: [], startTime: Date.now() };
}
function addTrace(req, step, status, elapsedMs) {
  if (!req) return;
  initTrace(req);
  const ms = elapsedMs !== undefined ? elapsedMs : Date.now() - req._lifecycle.startTime;
  req._lifecycle.trace.push({ step, status, ms: Math.round(ms) });
}
function getProcessingStage(req) {
  if (!req || !req._lifecycle || req._lifecycle.trace.length === 0) return 'none';
  return req._lifecycle.trace[req._lifecycle.trace.length - 1].step;
}
function getTrace(req) {
  if (!req || !req._lifecycle) return [];
  return req._lifecycle.trace;
}

function structured(req, { stage, status, durationMs, ...extra }) {
  const now = Date.now();
  const entry = {
    timestamp: new Date().toISOString(),
    requestId: requestId(req),
    stage,
    status,
    durationMs: durationMs != null ? durationMs : (req && req._lifecycle ? Math.round(now - req._lifecycle.startTime) : 0),
    ...extra,
  };
  if (req && req._testMode) entry.testMode = req._testMode;
  console.log(JSON.stringify(entry));
  return entry;
}

function getTraceWithDeltas(req) {
  if (!req || !req._lifecycle) return [];
  const trace = req._lifecycle.trace;
  if (trace.length === 0) return [];
  const result = [];
  for (let i = 0; i < trace.length; i++) {
    const prevMs = i > 0 ? trace[i - 1].ms : 0;
    result.push({
      step: trace[i].step,
      status: trace[i].status,
      ms: trace[i].ms,
      deltaMs: trace[i].ms - prevMs,
    });
  }
  return result;
}

module.exports = { info, warn, error, requestId, bodyType, event, debugLog, isDebugEnabled, logStage, initTrace, addTrace, getProcessingStage, getTrace, getTraceWithDeltas, structured };
