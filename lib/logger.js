const crypto = require('crypto');

function requestId(req) {
  if (!req) return null;
  if (req.requestId) return req.requestId;
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  return req.requestId;
}

function info(req, message, data) {
  const entry = {
    level: 'info',
    timestamp: new Date().toISOString(),
    requestId: requestId(req),
    message,
    ...data,
  };
  console.log(JSON.stringify(entry));
}

function warn(req, message, data) {
  const entry = {
    level: 'warn',
    timestamp: new Date().toISOString(),
    requestId: requestId(req),
    message,
    ...data,
  };
  console.warn(JSON.stringify(entry));
}

function error(req, message, err, data) {
  const entry = {
    level: 'error',
    timestamp: new Date().toISOString(),
    requestId: requestId(req),
    message,
    error: err ? { message: err.message, code: err.code, statusCode: err.statusCode } : undefined,
    ...data,
  };
  console.error(JSON.stringify(entry));
}

module.exports = { info, warn, error, requestId };
