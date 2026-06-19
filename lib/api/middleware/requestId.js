const crypto = require('crypto');

function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || `req-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  req.requestId = id;
  res.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}

module.exports = requestId;
