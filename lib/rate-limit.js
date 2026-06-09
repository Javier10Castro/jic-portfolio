const crypto = require('crypto');
const log = require('./logger');

const INSTANCE_ID = crypto.randomUUID().slice(0, 8);

const RATE_LIMIT_REASON = Object.freeze({
  IP_BURST: 'RATE_LIMIT_IP_BURST',
  EMAIL_DUP: 'RATE_LIMIT_EMAIL_DUP',
  SMTP_CONGESTION: 'RATE_LIMIT_SMTP_CONGESTION',
  SMTP_CIRCUIT_BREAKER: 'RATE_LIMIT_SMTP_CIRCUIT_BREAKER',
  HONEYPOT: 'RATE_LIMIT_HONEYPOT',
  TIMING: 'TIMING',
  VALIDATION: 'VALIDATION',
});

// ────────────────────────────────────────────────────────────────
// LAYER 1: EDGE PROTECTION — sliding window log (IP-based)
// ────────────────────────────────────────────────────────────────
// Two thresholds: soft (warn + headers) and hard (429 block).
// Human users doing 1-2 submits in quick succession pass easily.
const ipLog = new Map();

const EDGE_SOFT_LIMIT = parseInt(process.env.RL_EDGE_SOFT || '20');
const EDGE_HARD_LIMIT = parseInt(process.env.RL_EDGE_HARD || '40');
const EDGE_WINDOW_MS = parseInt(process.env.RL_EDGE_WINDOW_MS || '60000');

setInterval(() => {
  const cutoff = Date.now() - EDGE_WINDOW_MS * 2;
  for (const [key, log] of ipLog.entries()) {
    const last = log[log.length - 1];
    if (!last || last < cutoff) ipLog.delete(key);
  }
}, 300_000).unref();

function slidingWindow(key, maxReqs, windowMs) {
  const now = Date.now();
  const cutoff = now - windowMs;
  let log = ipLog.get(key);
  if (!log) {
    log = [];
    ipLog.set(key, log);
  }
  while (log.length > 0 && log[0] < cutoff) log.shift();
  if (log.length >= maxReqs) {
    const oldest = log[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, limit: maxReqs, retryAfter };
  }
  log.push(now);
  return { allowed: true, remaining: maxReqs - log.length, limit: maxReqs, retryAfter: 0 };
}

function edgeCheck(key) {
  const soft = slidingWindow(key, EDGE_SOFT_LIMIT, EDGE_WINDOW_MS);
  const hard = slidingWindow(key, EDGE_HARD_LIMIT, EDGE_WINDOW_MS);

  if (!soft.allowed) {
    log.debugLog(null, 'edgeCheck:SOFT_BURST', { key, remaining: soft.remaining, limit: EDGE_SOFT_LIMIT, retryAfter: soft.retryAfter });
    return {
      allowed: hard.allowed,
      remaining: hard.remaining,
      limit: EDGE_HARD_LIMIT,
      retryAfter: hard.allowed ? soft.retryAfter : hard.retryAfter,
      soft: !soft.allowed,
      reason: hard.allowed ? RATE_LIMIT_REASON.IP_BURST : RATE_LIMIT_REASON.IP_BURST,
    };
  }
  if (!hard.allowed) {
    log.debugLog(null, 'edgeCheck:HARD_BLOCK', { key, remaining: 0, limit: EDGE_HARD_LIMIT, retryAfter: hard.retryAfter });
  } else {
    log.debugLog(null, 'edgeCheck:ALLOW', { key, remaining: hard.remaining, limit: EDGE_HARD_LIMIT });
  }
  return {
    allowed: hard.allowed,
    remaining: hard.remaining,
    limit: EDGE_HARD_LIMIT,
    retryAfter: hard.retryAfter,
    soft: !soft.allowed,
    reason: hard.allowed ? null : RATE_LIMIT_REASON.IP_BURST,
  };
}

// ────────────────────────────────────────────────────────────────
// LAYER 2: ABUSE PROTECTION — email dedup, honeypot, timing
// ────────────────────────────────────────────────────────────────

const emailTimestamps = new Map();
const EMAIL_DEDUP_WINDOW_MS = parseInt(process.env.RL_EMAIL_DEDUP_MS || '300000');

function emailDedup(email, windowMs) {
  windowMs = windowMs || EMAIL_DEDUP_WINDOW_MS;
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
    log.debugLog(null, 'emailDedup:BLOCK', { email: maskEmail(email), count: filtered.length, retryAfter });
    return { allowed: false, remaining: 0, limit: 1, retryAfter };
  }
  filtered.push(now);
  emailTimestamps.set(email, filtered);
  log.debugLog(null, 'emailDedup:ALLOW', { email: maskEmail(email) });
  return { allowed: true, remaining: 1, limit: 1, retryAfter: 0 };
}

function honeypotCheck(body) {
  if (!body || typeof body !== 'object') return { triggered: false };
  const hpFields = ['bot', 'website', 'url', 'hp_name', 'hp_email'];
  const triggeredField = hpFields.find(k => body[k]);
  if (triggeredField) {
    log.debugLog(null, 'honeypotCheck:TRIGGERED', { field: triggeredField });
    return { triggered: true, field: triggeredField };
  }
  return { triggered: false };
}

const MIN_FORM_TIME_MS = 3000;
const MAX_FORM_TIME_MS = 7_200_000;

function timingCheck(body) {
  if (!body || typeof body.submittedAt !== 'number') {
    log.debugLog(null, 'timingCheck:BLOCK', { reason: 'missing_timestamp' });
    return { tooFast: true, elapsedMs: null, minMs: MIN_FORM_TIME_MS, reason: 'missing_timestamp' };
  }
  const elapsed = Date.now() - body.submittedAt;
  if (elapsed < MIN_FORM_TIME_MS) {
    log.debugLog(null, 'timingCheck:BLOCK', { reason: 'too_fast', elapsedMs: elapsed, minMs: MIN_FORM_TIME_MS });
    return { tooFast: true, elapsedMs: elapsed, minMs: MIN_FORM_TIME_MS, reason: 'too_fast' };
  }
  if (elapsed > MAX_FORM_TIME_MS) {
    log.debugLog(null, 'timingCheck:BLOCK', { reason: 'stale_timestamp', elapsedMs: elapsed, maxMs: MAX_FORM_TIME_MS });
    return { tooFast: true, elapsedMs: elapsed, maxMs: MAX_FORM_TIME_MS, reason: 'stale_timestamp' };
  }
  return { tooFast: false, elapsedMs: elapsed, reason: 'ok' };
}

// ────────────────────────────────────────────────────────────────
// LAYER 3: RESOURCE PROTECTION — SMTP concurrency + circuit breaker
// ────────────────────────────────────────────────────────────────

let activeSmtpSends = 0;
let smtpWaitQueue = [];
let smtpCircuitBreaker = { open: false, until: 0, failures: 0 };
let smtpLatencies = [];

const MAX_CONCURRENT_SMTP = parseInt(process.env.RL_MAX_CONCURRENT_SMTP || '2');
const SMTP_ACQUIRE_TIMEOUT_MS = parseInt(process.env.RL_SMTP_ACQUIRE_MS || '3000');
const CIRCUIT_BREAKER_THRESHOLD = parseInt(process.env.RL_CIRCUIT_BREAKER || '3');
const CIRCUIT_BREAKER_RESET_MS = parseInt(process.env.RL_CIRCUIT_RESET_MS || '30000');
const SMTP_HIGH_LATENCY_MS = parseInt(process.env.RL_SMTP_HIGH_LATENCY_MS || '3000');

function getAdaptiveConcurrency() {
  if (smtpLatencies.length < 3) return MAX_CONCURRENT_SMTP;
  const recent = smtpLatencies.slice(-5);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const result = avg > SMTP_HIGH_LATENCY_MS ? 1 : MAX_CONCURRENT_SMTP;
  log.debugLog(null, 'adaptiveConcurrency', { smtpAvgLatencyMs: Math.round(avg), concurrency: result });
  return result;
}

function acquireSmtpSlot(req) {
  if (smtpCircuitBreaker.open) {
    if (Date.now() > smtpCircuitBreaker.until) {
      smtpCircuitBreaker.open = false;
      smtpCircuitBreaker.failures = 0;
      log.warn(req, 'Circuit breaker reset');
    } else {
      const remaining = Math.ceil((smtpCircuitBreaker.until - Date.now()) / 1000);
      log.warn(req, 'Circuit breaker open', { remainingSec: remaining, reason: RATE_LIMIT_REASON.SMTP_CIRCUIT_BREAKER });
      return { acquired: false, reason: RATE_LIMIT_REASON.SMTP_CIRCUIT_BREAKER, retryAfter: remaining };
    }
  }

  const adaptiveMax = getAdaptiveConcurrency();
  if (activeSmtpSends < adaptiveMax) {
    activeSmtpSends++;
    log.debugLog(req, 'acquireSmtpSlot:ACQUIRED', { active: activeSmtpSends, adaptiveMax });
    return { acquired: true };
  }

  log.warn(req, 'SMTP congestion', { active: activeSmtpSends, adaptiveMax, reason: RATE_LIMIT_REASON.SMTP_CONGESTION });
  return { acquired: false, reason: RATE_LIMIT_REASON.SMTP_CONGESTION, retryAfter: 5 };
}

async function waitForSmtpSlot(req, timeoutMs) {
  const immediate = acquireSmtpSlot(req);
  if (immediate.acquired) return { acquired: true };

  log.debugLog(req, 'waiting for SMTP slot', { timeoutMs, active: activeSmtpSends });
  const acquired = await new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    smtpWaitQueue.push(() => {
      clearTimeout(timer);
      activeSmtpSends++;
      resolve(true);
    });
  });

  if (acquired) {
    log.debugLog(req, 'SMTP slot acquired after wait', { active: activeSmtpSends });
  } else {
    log.warn(req, 'SMTP slot acquire timed out', { timeoutMs, reason: RATE_LIMIT_REASON.SMTP_CONGESTION });
  }
  return { acquired, reason: acquired ? null : RATE_LIMIT_REASON.SMTP_CONGESTION, retryAfter: 5 };
}

function releaseSmtpSlot(durationMs, success) {
  activeSmtpSends--;

  if (success) {
    smtpLatencies.push(durationMs);
    if (smtpLatencies.length > 20) smtpLatencies.shift();
  } else {
    smtpCircuitBreaker.failures++;
    log.warn(null, 'SMTP failure recorded', { failures: smtpCircuitBreaker.failures, threshold: CIRCUIT_BREAKER_THRESHOLD });
    if (smtpCircuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      smtpCircuitBreaker.open = true;
      smtpCircuitBreaker.until = Date.now() + CIRCUIT_BREAKER_RESET_MS;
      smtpCircuitBreaker.failures = 0;
      log.warn(null, 'Circuit breaker opened', { resetMs: CIRCUIT_BREAKER_RESET_MS });
    }
  }

  if (smtpWaitQueue.length > 0) {
    const next = smtpWaitQueue.shift();
    setImmediate(next);
  }
}

// ────────────────────────────────────────────────────────────────
// CONTENT VALIDATION (unchanged)
// ────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────
// HEADERS
// ────────────────────────────────────────────────────────────────

function rateLimitHeaders(rlCheck) {
  return {
    'Content-Type': 'application/json',
    'Retry-After': String(Math.max(1, rlCheck.retryAfter || 1)),
    'X-RateLimit-Limit': String(rlCheck.limit || 40),
    'X-RateLimit-Remaining': String(Math.max(0, rlCheck.remaining || 0)),
  };
}

function softLimitHeaders(rlCheck) {
  return {
    'Content-Type': 'application/json',
    'Retry-After': String(Math.max(1, rlCheck.retryAfter || 1)),
    'X-RateLimit-Limit': String(rlCheck.limit || 40),
    'X-RateLimit-Remaining': String(Math.max(0, rlCheck.remaining || 0)),
    'X-RateLimit-Soft': '1',
  };
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
}

function rateLimitKey(prefix, req) {
  return `${prefix}:${INSTANCE_ID}:${clientIp(req)}`;
}

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '(no email)';
  const at = email.indexOf('@');
  if (at < 2) return email.slice(0, 1) + '***' + email.slice(at);
  return email.slice(0, 2) + '***' + email.slice(at);
}

module.exports = {
  RATE_LIMIT_REASON,
  edgeCheck,
  slidingWindow,
  rateLimitKey,
  rateLimitHeaders,
  softLimitHeaders,
  clientIp,
  maskEmail,
  emailDedup,
  honeypotCheck,
  timingCheck,
  validateEmail,
  sanitizeAndValidateName,
  validatePrompt,
  acquireSmtpSlot,
  waitForSmtpSlot,
  releaseSmtpSlot,
  getAdaptiveConcurrency,
  // Backward compat aliases
  tokenBucket: slidingWindow,
  rateLimit: slidingWindow,
};
