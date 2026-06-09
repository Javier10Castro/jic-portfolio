const crypto = require('crypto');

const INSTANCE_ID = crypto.randomUUID().slice(0, 8);

const RATE_LIMIT_REASON = Object.freeze({
  IP_LIMIT: 'IP_LIMIT',
  EMAIL_LIMIT: 'EMAIL_LIMIT',
  BOT: 'BOT',
  TIMING: 'TIMING',
  VALIDATION: 'VALIDATION',
});

// ─── IP-based rate limiting: token bucket ─────────────────────
const buckets = new Map();
const BUCKET_CLEANUP_MS = 300_000;

function tokenBucket(key, maxTokens, refillMs) {
  maxTokens = maxTokens || 15;
  refillMs = refillMs || 60_000;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: maxTokens - 1, lastRefill: now };
    buckets.set(key, bucket);
    return { allowed: true, remaining: bucket.tokens, limit: maxTokens, retryAfter: 0 };
  }
  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor(elapsed / refillMs);
  if (refill > 0) {
    bucket.tokens = Math.min(maxTokens, bucket.tokens + refill * maxTokens);
    bucket.lastRefill = now;
  }
  if (bucket.tokens > 0) {
    bucket.tokens--;
    return { allowed: true, remaining: bucket.tokens, limit: maxTokens, retryAfter: 0 };
  }
  const msUntilNext = refillMs - (elapsed % refillMs);
  return { allowed: false, remaining: 0, limit: maxTokens, retryAfter: Math.ceil(msUntilNext / 1000) };
}

setInterval(() => {
  const cutoff = Date.now() - BUCKET_CLEANUP_MS * 2;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.lastRefill < cutoff) buckets.delete(key);
  }
}, BUCKET_CLEANUP_MS).unref();

// ─── Email-based dedup ────────────────────────────────────────
const emailTimestamps = new Map();

function emailDedup(email, windowMs) {
  windowMs = windowMs || 60_000;
  const now = Date.now();
  const cutoff = now - windowMs;
  let timestamps = emailTimestamps.get(email);
  if (!timestamps) {
    timestamps = [];
    emailTimestamps.set(email, timestamps);
  }
  const filtered = timestamps.filter(t => t > cutoff);
  if (filtered.length > 0) {
    const retryAfter = Math.ceil((filtered[filtered.length - 1] + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, limit: 1, retryAfter };
  }
  filtered.push(now);
  emailTimestamps.set(email, filtered);
  return { allowed: true, remaining: 1, limit: 1, retryAfter: 0 };
}

// ─── Honeypot check ───────────────────────────────────────────
function honeypotCheck(body) {
  if (!body || typeof body !== 'object') return { triggered: false };
  if (body.bot || body.website || body.url || body.hp_name || body.hp_email) {
    return { triggered: true, field: Object.keys(body).find(k => ['bot','website','url','hp_name','hp_email'].includes(k)) || 'bot' };
  }
  return { triggered: false };
}

// ─── Timing check (strict: submittedAt REQUIRED) ──────────────
const MIN_FORM_TIME_MS = 3000;
const MAX_FORM_TIME_MS = 7_200_000; // 2 hours — sanity cap

function timingCheck(body) {
  if (!body || typeof body.submittedAt !== 'number') {
    return { tooFast: true, elapsedMs: null, minMs: MIN_FORM_TIME_MS, reason: 'missing_timestamp' };
  }
  const elapsed = Date.now() - body.submittedAt;
  if (elapsed < MIN_FORM_TIME_MS) {
    return { tooFast: true, elapsedMs: elapsed, minMs: MIN_FORM_TIME_MS, reason: 'too_fast' };
  }
  if (elapsed > MAX_FORM_TIME_MS) {
    return { tooFast: true, elapsedMs: elapsed, maxMs: MAX_FORM_TIME_MS, reason: 'stale_timestamp' };
  }
  return { tooFast: false, elapsedMs: elapsed, reason: 'ok' };
}

// ─── Content validation ───────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 150;
const MAX_PROMPT_LENGTH = 500_000;
const HTML_TAG_RE = /<[^>]*>/g;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 320) return false;
  return EMAIL_RE.test(email);
}

function sanitizeAndValidateName(name) {
  if (!name || typeof name !== 'string') return { valid: false, reason: 'Name is required' };
  const cleaned = name.replace(HTML_TAG_RE, '').trim();
  if (cleaned.length < 1) return { valid: false, reason: 'Name is required' };
  if (cleaned.length > MAX_NAME_LENGTH) return { valid: false, reason: `Name exceeds ${MAX_NAME_LENGTH} characters` };
  return { valid: true, value: cleaned };
}

function validatePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return { valid: false, reason: 'Prompt is required' };
  if (prompt.length > MAX_PROMPT_LENGTH) return { valid: false, reason: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters` };
  return { valid: true };
}

// ─── Rate limit response header helper ────────────────────────
function rateLimitHeaders(rlCheck) {
  return {
    'Content-Type': 'application/json',
    'Retry-After': String(rlCheck.retryAfter),
    'X-RateLimit-Limit': String(rlCheck.limit || 10),
    'X-RateLimit-Remaining': String(Math.max(0, rlCheck.remaining || 0)),
  };
}

// ─── Helpers ──────────────────────────────────────────────────
function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
}

function rateLimitKey(prefix, req) {
  return `${prefix}:${INSTANCE_ID}:${clientIp(req)}`;
}

module.exports = {
  RATE_LIMIT_REASON,
  tokenBucket,
  rateLimitKey,
  rateLimitHeaders,
  clientIp,
  emailDedup,
  honeypotCheck,
  timingCheck,
  validateEmail,
  sanitizeAndValidateName,
  validatePrompt,
  rateLimit: tokenBucket,
};
