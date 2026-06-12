/**
 * tracer.js — Runtime path tracing system (v2)
 *
 * Two-tier storage:
 *   L1: In-memory Map (5min TTL, per-instance, fast)
 *   L2: Neon request_traces (persistent, cross-instance, fire-and-forget)
 *
 * Tracing is ALWAYS non-blocking. Never await trace writes.
 */

const MAX_TRACES_PER_ID = 50;
const TRACE_TTL_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

const _traces = new Map();
const _pending = [];
let _timer = null;

let _neon = null;
let _neonReady = false;
try {
  _neon = require('./db/requestTraces');
  _neonReady = true;
} catch (e) {
  console.error(JSON.stringify({ level: 'error', msg: 'tracer: failed to load neon module', error: e.message }));
}

function _ensureTimer() {
  if (_timer) return;
  _timer = setInterval(() => {
    const now = Date.now();
    for (const [key, events] of _traces) {
      const recent = events.filter(e => now - e.timestamp < TRACE_TTL_MS);
      if (recent.length === 0) {
        _traces.delete(key);
      } else if (recent.length < events.length) {
        _traces.set(key, recent);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (_timer && _timer.unref) _timer.unref();
}

const ALL_PATHS = [
  'sendBrief:methodCheck', 'sendBrief:parseBody', 'sendBrief:honeypotCheck',
  'sendBrief:timingCheck', 'sendBrief:sanitizeAndValidateName',
  'sendBrief:validateEmail', 'sendBrief:validatePrompt',
  'sendBrief:rateLimit:ip', 'sendBrief:rateLimit:email',
  'sendBrief:configCheck', 'sendBrief:queueCheck',
  'sendContact:methodCheck', 'sendContact:parseBody', 'sendContact:honeypotCheck',
  'sendContact:timingCheck', 'sendContact:sanitizeAndValidateName',
  'sendContact:validateEmail', 'sendContact:validateMessage:empty',
  'sendContact:validateMessage:tooLong', 'sendContact:rateLimit:ip',
  'sendContact:rateLimit:email',   'sendContact:configCheck', 'sendContact:queueCheck',
  'sendBrief:submitted', 'sendContact:submitted',
  'sendBrief:handlerError', 'sendContact:handlerError',
  // Lifecycle state transitions (emitted by queue worker)
  'sendBrief:processing', 'sendBrief:completed', 'sendBrief:failed',
  'sendContact:processing', 'sendContact:completed', 'sendContact:failed',
];

/**
 * Record a validation path trace event.
 * Writes to memory (fast) + Neon (async, fire-and-forget).
 */
function trace(requestId, endpoint, validationStage, pathId) {
  if (!requestId) return;
  _ensureTimer();
  if (!_traces.has(requestId)) {
    _traces.set(requestId, []);
  }
  const events = _traces.get(requestId);
  if (events.length >= MAX_TRACES_PER_ID) return;
  const event = { requestId, endpoint, validationStage, pathId, timestamp: Date.now() };
  events.push(event);
  // Neon: async fire-and-forget — never block the request
  if (_neonReady) {
    _pending.push(_neon.saveTrace({
      requestId,
      pathId,
      endpoint,
      stage: validationStage,
      timestamp: event.timestamp,
    }).catch(() => {}));
  }
}

/**
 * Drain all pending Neon trace writes.
 * Call before the handler returns to ensure traces persist on Vercel.
 */
async function drain() {
  if (_pending.length === 0) return;
  const pending = _pending.splice(0);
  await Promise.allSettled(pending);
}

/**
 * Get all trace events for a requestId (memory only).
 */
function getTraces(requestId) {
  if (!requestId) return [];
  const events = _traces.get(requestId);
  if (!events) return [];
  const now = Date.now();
  const recent = events.filter(e => now - e.timestamp < TRACE_TTL_MS);
  if (recent.length === 0) {
    _traces.delete(requestId);
    return [];
  }
  return recent;
}

/**
 * Get unique pathIds executed within the TTL window (memory only).
 */
function getExecutedPaths() {
  const now = Date.now();
  const paths = new Set();
  for (const [, events] of _traces) {
    for (const e of events) {
      if (now - e.timestamp < TRACE_TTL_MS && e.pathId) {
        paths.add(e.pathId);
      }
    }
  }
  return paths;
}

/**
 * Compute coverage from memory traces only.
 * For true coverage (memory + Neon), use getMergedCoverage() from api/traces.js.
 */
function getCoverage() {
  const executed = getExecutedPaths();
  const covered = ALL_PATHS.filter(p => executed.has(p));
  return {
    total: ALL_PATHS.length,
    executed: executed.size,
    covered: covered.length,
    coveredPaths: covered.sort(),
    missingPaths: ALL_PATHS.filter(p => !executed.has(p)).sort(),
    percentage: ALL_PATHS.length > 0 ? Math.round((covered.length / ALL_PATHS.length) * 100) : 0,
    source: 'memory',
  };
}

module.exports = { trace, drain, getTraces, getCoverage, getExecutedPaths, ALL_PATHS, get neonReady() { return _neonReady; } };
