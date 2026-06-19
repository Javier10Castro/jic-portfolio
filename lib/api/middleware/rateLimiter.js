const { RateLimitError } = require('../errors');
const { logger } = require('./logging');

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

const stores = new Map();

function getKey(req) {
  if (req.apiKeyRecord) return `apikey:${req.apiKeyRecord.id}`;
  if (req.user) return `user:${req.user.id}`;
  return `ip:${req.ip || req.connection?.remoteAddress || 'unknown'}`;
}

function rateLimiter(options = {}) {
  const windowMs = options.windowMs || WINDOW_MS;
  const maxRequests = options.maxRequests || MAX_REQUESTS;
  const perApiKey = options.perApiKey || {};

  return function rateLimitMiddleware(req, res, next) {
    const key = getKey(req);

    const apiKeyLimit = req.apiKeyRecord && perApiKey[req.apiKeyRecord.id];
    const limit = apiKeyLimit || maxRequests;

    const now = Date.now();
    if (!stores.has(key)) {
      stores.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', limit - 1);
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      return next();
    }

    const record = stores.get(key);
    if (now > record.resetAt) {
      stores.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', limit - 1);
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      return next();
    }

    if (record.count >= limit) {
      logger.warn({ message: 'Rate limit exceeded', key, limit, requestId: req.requestId });
      return next(new RateLimitError('Rate limit exceeded. Try again later.', {
        limit,
        resetAt: new Date(record.resetAt).toISOString(),
        retryAfterMs: record.resetAt - now,
      }));
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - record.count);
    res.setHeader('X-RateLimit-Reset', new Date(record.resetAt).toISOString());
    next();
  };
}

module.exports = rateLimiter;
