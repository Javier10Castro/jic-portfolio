const crypto = require('crypto');
const requestCounts = new Map();
const CLEANUP_INTERVAL = 300000;
const INSTANCE_ID = crypto.randomUUID().slice(0, 8);

setInterval(() => {
  const cutoff = Date.now() - CLEANUP_INTERVAL * 2;
  for (const [key, timestamps] of requestCounts.entries()) {
    const filtered = timestamps.filter(t => t > cutoff);
    if (filtered.length === 0) requestCounts.delete(key);
    else requestCounts.set(key, filtered);
  }
}, CLEANUP_INTERVAL).unref();

function rateLimit(key, maxReqs, windowMs) {
  maxReqs = maxReqs || 15;
  windowMs = windowMs || 60000;
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = requestCounts.get(key) || [];
  const filtered = timestamps.filter(t => t > windowStart);

  if (filtered.length >= maxReqs) {
    return { allowed: false, retryAfter: Math.ceil((filtered[0] + windowMs - now) / 1000) };
  }

  filtered.push(now);
  requestCounts.set(key, filtered);
  return { allowed: true };
}

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
}

function rateLimitKey(prefix, req) {
  return `${prefix}:${INSTANCE_ID}:${clientIp(req)}`;
}

module.exports = { rateLimit, clientIp, rateLimitKey };
