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

module.exports = { info, warn, error, requestId, bodyType, event, debugLog, isDebugEnabled, logStage };
