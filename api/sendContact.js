const nodemailer = require('nodemailer');
const emailQueue = require('../lib/queue');
const { parseBody, deployInfo } = require('../lib/safeBodyParser');
const {
  RATE_LIMIT_REASON,
  edgeCheck, rateLimitKey,
  rateLimitHeaders, softLimitHeaders,
  emailDedup, honeypotCheck, timingCheck,
  validateEmail, sanitizeAndValidateName, clientIp, maskEmail,
} = require('../lib/rate-limit');
const log = require('../lib/logger');
const registry = require('../lib/request-registry');
const tracer = require('../lib/tracer');

const VALID_TEST_MODES = ['validation', 'rate-limit', 'queue', 'load'];

function json(status, headers, payload) {
  return res => { res.writeHead(status, headers).end(JSON.stringify(payload)); };
}

function debugHeaders(rlCheck, reason) {
  if (process.env.DEBUG_RATE_LIMIT !== 'true' && process.env.DEBUG_API !== 'true') return {};
  return {
    'X-Debug-RateLimit': `${rlCheck.allowed ? 'ALLOW' : 'BLOCK'}`,
    'X-Debug-Reason': reason,
  };
}

const EMAIL_TIMEOUT_MS = 5000;

function stage(req, label) {
  log.logStage(req, label);
}

function withSoftHeaders(req, baseHeaders) {
  if (!req._edgeSoft) return baseHeaders;
  return { ...baseHeaders, ...softLimitHeaders(req._edgeSoft) };
}

function deployHeaders(req) {
  const info = deployInfo();
  return {
    'X-Deploy-SHA': info.sha,
    'X-Deploy-Env': info.env,
    'X-Body-Parse-Method': req._bodyParseMethod || 'unknown',
  };
}

function reqHeaders(req) {
  const rid = log.requestId(req);
  return { 'X-Request-Id': rid };
}

function resPayload(req, extra) {
  const now = Date.now();
  const elapsedMs = req._lifecycle ? Math.round(now - req._lifecycle.startTime) : 0;
  const payload = {
    requestId: log.requestId(req),
    processingStage: log.getProcessingStage(req),
    timestamp: new Date().toISOString(),
    totalRequestTimeMs: elapsedMs,
    queueWaitTimeMs: 0,
    processingTimeMs: elapsedMs,
    ...extra,
  };
  if (req._testMode) payload.testMode = req._testMode;
  if (req._debugMode) {
    payload.lifecycle = log.getTraceWithDeltas(req);
    if (req._testMode) payload.testMode = req._testMode;
  }
  return payload;
}

async function sendWithTimeout(transporter, mailOptions, timeoutMs, req, label) {
  const sendStart = Date.now();
  log.structured(req, { stage: `smtp.start.${label}`, status: 'ok', elapsedMs: 0 });
  try {
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('send_timeout'), { timedOut: true })), timeoutMs)),
    ]);
    const elapsed = Date.now() - sendStart;
    log.structured(req, { stage: `smtp.complete.${label}`, status: 'ok', elapsedMs: elapsed });
    return true;
  } catch (err) {
    const elapsed = Date.now() - sendStart;
    if (err.timedOut) {
      log.warn(req, `Email send timed out`, { label, timeout_ms: timeoutMs, elapsed_ms: elapsed });
      log.structured(req, { stage: `smtp.timeout.${label}`, status: 'timeout', elapsedMs: elapsed, timeoutMs });
      return false;
    }
    log.structured(req, { stage: `smtp.error.${label}`, status: 'error', elapsedMs: elapsed, error: err.message });
    throw err;
  }
}

async function handleStatusLookup(req, res) {
  const rid = ((req.url || '').match(/[?&]id=([^&]+)/) || [])[1] || '';
  if (!rid) {
    return json(400, { 'Content-Type': 'application/json' }, { error: 'INVALID_REQUEST', message: 'id query parameter is required' })(res);
  }
  const entry = await registry.lookupRequest(rid);
  if (!entry) {
    return json(404, { 'Content-Type': 'application/json' }, { error: 'NOT_FOUND', message: 'No lifecycle data found for this requestId', requestId: rid })(res);
  }
  return json(200, { 'Content-Type': 'application/json' }, entry)(res);
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') return handleStatusLookup(req, res);

  const start = Date.now();
  const ip = clientIp(req);
  req._debugEndpoint = 'sendContact';
  req._debugMode = /[?&]debug=true(&|$)/.test(req.url || '');
  log.requestId(req);
  log.initTrace(req);
  log.addTrace(req, 'request.received', 'ok', 0);

  const rawTestMode = (req.headers['x-test-mode'] || '').trim().toLowerCase();
  req._testMode = VALID_TEST_MODES.includes(rawTestMode) ? rawTestMode : null;

  log.structured(req, { stage: 'request.received', status: 'ok', durationMs: 0, method: req.method, ip, testMode: req._testMode });
  log.event('request.start', req, { ip, method: req.method, endpoint: 'sendContact', testMode: req._testMode });
  stage(req, 'start');
  const di = deployInfo();
  log.info(req, 'deploy_context', { sha: di.sha, env: di.env, region: di.region });

  if (req.method !== 'POST') {
    log.warn(req, 'Method not allowed', { ip, method: req.method, reason: RATE_LIMIT_REASON.VALIDATION });
    log.addTrace(req, 'validation', 'fail');
    log.structured(req, { stage: 'validation', status: 'fail', reason: 'method_not_allowed' });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'validation', validationStage: 'methodCheck', validationField: 'method', validationReason: 'not_allowed', receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'methodCheck', 'sendContact:methodCheck');
    await registry.persistImmediate(log.requestId(req));
    return json(405, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'rejected', error: 'Method Not Allowed', queuePosition: 0, queueDepth: 0 }))(res);
  }

  const bt = log.bodyType(req);

  const parsed = await parseBody(req);
  if (!parsed) {
    log.event('body_parse.fail', req, { bodyType: bt, parseMethod: req._bodyParseMethod || 'unknown' });
    log.addTrace(req, 'body.parse', 'fail');
    log.structured(req, { stage: 'body.parse', status: 'fail', bodyType: bt, parseMethod: req._bodyParseMethod });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'bad_request', validationStage: 'parseBody', validationField: 'body', validationReason: 'parse_failed', receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'parseBody', 'sendContact:parseBody');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'rejected', error: 'INVALID_BODY', queuePosition: 0, queueDepth: 0 }))(res);
  }
  log.event('body_parse.ok', req, { bodyType: bt, parseMethod: req._bodyParseMethod || 'unknown' });
  log.addTrace(req, 'body.parse', 'ok');
  log.structured(req, { stage: 'body.parse', status: 'ok', bodyType: bt, parseMethod: req._bodyParseMethod });

  const hp = honeypotCheck(parsed);
  if (hp.triggered) {
    log.warn(req, 'Honeypot triggered', { ip, field: hp.field, reason: RATE_LIMIT_REASON.BOT });
    log.event('honeypot.triggered', req, { field: hp.field });
    log.addTrace(req, 'validation', 'blocked');
    log.structured(req, { stage: 'validation', status: 'blocked', reason: 'honeypot', field: hp.field });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'validation', validationStage: 'honeypotCheck', validationField: hp.field, validationReason: 'bot_detected', receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'honeypotCheck', 'sendContact:honeypotCheck');
    await registry.persistImmediate(log.requestId(req));
    return json(200, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req), ...debugHeaders({ allowed: false }, RATE_LIMIT_REASON.BOT) }, resPayload(req, { success: true, status: 'processed', queuePosition: 0, queueDepth: 0 }))(res);
  }

  const tc = timingCheck(parsed);
  if (tc.blocked) {
    log.warn(req, 'Timing check failed', { ip, reason: tc.reason });
    log.event('timing_check.blocked', req, { reason: tc.reason });
    log.addTrace(req, 'validation', 'blocked');
    log.structured(req, { stage: 'validation', status: 'blocked', reason: 'timing', detail: tc.reason });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'validation', validationStage: 'timingCheck', validationField: 'submittedAt', validationReason: tc.reason, receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'timingCheck', 'sendContact:timingCheck');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'rejected', error: 'INVALID_REQUEST', queuePosition: 0, queueDepth: 0 }))(res);
  }
  log.event('timing_check.ok', req, { elapsedMs: tc.elapsedMs });

  const { name: rawName, email, company, project, message, lang } = parsed;

  const nameCheck = sanitizeAndValidateName(rawName);
  if (!nameCheck.valid) {
    log.debugLog(req, 'Name validation failed', { ip, reason: nameCheck.reason });
    log.event('validation.fail', req, { field: 'name', reason: nameCheck.reason });
    log.addTrace(req, 'validation', 'fail');
    log.structured(req, { stage: 'validation', status: 'fail', field: 'name', reason: nameCheck.reason });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'validation', validationStage: 'sanitizeAndValidateName', validationField: 'name', validationReason: nameCheck.reason, receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'sanitizeAndValidateName', 'sendContact:sanitizeAndValidateName');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'rejected', error: 'INVALID_REQUEST', queuePosition: 0, queueDepth: 0 }))(res);
  }
  const safeName = nameCheck.value;

  if (!validateEmail(email)) {
    log.warn(req, 'Invalid email', { ip, email: maskEmail(email), reason: RATE_LIMIT_REASON.VALIDATION });
    log.event('validation.fail', req, { field: 'email' });
    log.addTrace(req, 'validation', 'fail');
    log.structured(req, { stage: 'validation', status: 'fail', field: 'email' });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'validation', validationStage: 'validateEmail', validationField: 'email', validationReason: 'invalid_format', receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'validateEmail', 'sendContact:validateEmail');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'rejected', error: 'INVALID_REQUEST', queuePosition: 0, queueDepth: 0 }))(res);
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    log.debugLog(req, 'Message missing', { ip });
    log.event('validation.fail', req, { field: 'message', reason: 'empty' });
    log.addTrace(req, 'validation', 'fail');
    log.structured(req, { stage: 'validation', status: 'fail', field: 'message', reason: 'empty' });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'validation', validationStage: 'validateMessage', validationField: 'message', validationReason: 'empty', receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'validateMessage:empty', 'sendContact:validateMessage:empty');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'rejected', error: 'INVALID_REQUEST', queuePosition: 0, queueDepth: 0 }))(res);
  }
  if (message.length > 100000) {
    log.debugLog(req, 'Message too long', { ip, length: message.length });
    log.event('validation.fail', req, { field: 'message', reason: 'too_long', length: message.length });
    log.addTrace(req, 'validation', 'fail');
    log.structured(req, { stage: 'validation', status: 'fail', field: 'message', reason: 'too_long', length: message.length });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'validation', validationStage: 'validateMessage', validationField: 'message', validationReason: 'too_long', receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'validateMessage:tooLong', 'sendContact:validateMessage:tooLong');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'rejected', error: 'INVALID_REQUEST', queuePosition: 0, queueDepth: 0 }))(res);
  }
  log.addTrace(req, 'validation', 'ok');
  log.structured(req, { stage: 'validation', status: 'ok' });

  const rlKey = rateLimitKey('contact', req);
  const edge = edgeCheck(rlKey);
  if (edge.soft) req._edgeSoft = edge;
  if (!edge.allowed) {
    log.warn(req, 'Edge blocked', { ip, retryAfter: edge.retryAfter, reason: RATE_LIMIT_REASON.IP_BURST });
    log.event('rate_limit.blocked', req, { layer: 'edge', reason: RATE_LIMIT_REASON.IP_BURST, retryAfter: edge.retryAfter, remaining: edge.remaining });
    log.addTrace(req, 'rateLimit', 'blocked');
    log.structured(req, { stage: 'rateLimit', status: 'blocked', layer: 'edge', retryAfter: edge.retryAfter, limit: edge.limit });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'rate_limit', validationStage: 'rateLimit', validationField: 'ip', validationReason: 'burst', receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'rateLimit:ip', 'sendContact:rateLimit:ip');
    await registry.persistImmediate(log.requestId(req));
    const nowMs = Date.now();
    return json(429, { ...deployHeaders(req), ...reqHeaders(req), ...rateLimitHeaders(edge), ...debugHeaders(edge, RATE_LIMIT_REASON.IP_BURST) }, resPayload(req, { success: false, status: 'rate_limited', error: 'RATE_LIMITED', retryAfterMs: Math.max(1, edge.retryAfter) * 1000, retryAfterSeconds: Math.max(1, edge.retryAfter), resetTime: new Date(nowMs + Math.max(1, edge.retryAfter) * 1000).toISOString(), limitType: 'ip', currentUsage: edge.currentUsage, limitThreshold: edge.limit, queuePosition: 0, queueDepth: 0 }))(res);
  }

  const dedupCheck = emailDedup(email);
  if (!dedupCheck.allowed) {
    log.warn(req, 'Email dedup blocked', { email: maskEmail(email), retryAfter: dedupCheck.retryAfter, reason: RATE_LIMIT_REASON.EMAIL_DUP });
    log.event('rate_limit.blocked', req, { layer: 'dedup', reason: RATE_LIMIT_REASON.EMAIL_DUP, retryAfter: dedupCheck.retryAfter, email: maskEmail(email) });
    log.addTrace(req, 'rateLimit', 'blocked');
    log.structured(req, { stage: 'rateLimit', status: 'blocked', layer: 'dedup', retryAfter: dedupCheck.retryAfter, limit: dedupCheck.limit });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'rate_limit', validationStage: 'rateLimit', validationField: 'email', validationReason: 'duplicate', receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'rateLimit:email', 'sendContact:rateLimit:email');
    await registry.persistImmediate(log.requestId(req));
    const nowMs = Date.now();
    return json(429, { ...deployHeaders(req), ...reqHeaders(req), ...rateLimitHeaders(dedupCheck), ...debugHeaders(dedupCheck, RATE_LIMIT_REASON.EMAIL_DUP) }, resPayload(req, { success: false, status: 'rate_limited', error: 'RATE_LIMITED', retryAfterMs: Math.max(1, dedupCheck.retryAfter) * 1000, retryAfterSeconds: Math.max(1, dedupCheck.retryAfter), resetTime: new Date(nowMs + Math.max(1, dedupCheck.retryAfter) * 1000).toISOString(), limitType: 'email', currentUsage: dedupCheck.currentUsage, limitThreshold: dedupCheck.limit, queuePosition: 0, queueDepth: 0 }))(res);
  }

  log.event('rate_limit.ok', req, { edgeRemaining: edge.remaining });
  log.addTrace(req, 'rateLimit', 'ok');
  log.structured(req, { stage: 'rateLimit', status: 'ok', remaining: edge.remaining });
  stage(req, 'after_validation');

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    log.error(req, 'Missing GMAIL_USER or GMAIL_APP_PASSWORD', null, { ip });
    log.event('smtp.misconfigured', req, { ip });
    log.addTrace(req, 'smtp', 'fail');
    log.structured(req, { stage: 'smtp', status: 'fail', reason: 'missing_credentials' });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'bad_request', validationStage: 'configCheck', validationField: 'smtp', validationReason: 'missing_credentials', receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'configCheck', 'sendContact:configCheck');
    await registry.persistImmediate(log.requestId(req));
    return json(500, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'rejected', error: 'Email service misconfigured', queuePosition: 0, queueDepth: 0 }))(res);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    connectionTimeout: 3000,
    greetingTimeout: 3000,
    socketTimeout: 5000,
  });

  const verifyStart = Date.now();
  log.structured(req, { stage: 'transporter.verify.start', status: 'ok', elapsedMs: 0 });
  try {
    await transporter.verify();
    log.structured(req, { stage: 'transporter.verify.complete', status: 'ok', elapsedMs: Date.now() - verifyStart });
  } catch (verifyErr) {
    log.structured(req, { stage: 'transporter.verify.error', status: 'error', elapsedMs: Date.now() - verifyStart, error: verifyErr.message });
    log.error(req, 'Transporter verify failed', verifyErr, { name: safeName, email });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'smtp_failure', validationStage: 'transporterVerify', validationField: 'smtp', validationReason: verifyErr.message, receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'transporterVerify', 'sendContact:transporterVerify');
    await registry.persistImmediate(log.requestId(req));
    return json(500, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'rejected', error: 'Email service unavailable', queuePosition: 0, queueDepth: 0 }))(res);
  }

  const isES = lang === 'es';
  const now = new Date();
  const dateStr = isES
    ? now.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const templateData = { name: safeName, email, company, project, message, dateStr, lang: isES ? 'es' : 'en' };

  stage(req, 'before_email_send');
  const queueResult = emailQueue.enqueue({
    handler: async () => {
      log.addTrace(req, 'queue.waitEnd', 'ok');
      log.structured(req, { stage: 'queue.waitEnd', status: 'ok', queueDepthAtStart: depth });

      const rid = log.requestId(req);

      stage(req, 'before_email_send');
      log.addTrace(req, 'email.admin.start', 'ok');
      log.addTrace(req, 'email.client.start', 'ok');
      log.structured(req, { stage: 'email.admin.start', status: 'ok' });
      log.structured(req, { stage: 'email.client.start', status: 'ok' });
      
      const [adminOk, clientOk] = await Promise.all([
        sendWithTimeout(transporter, {
          from: `"Javier Ibrahim — Portfolio" <${GMAIL_USER}>`,
          to: GMAIL_USER,
          replyTo: email,
          subject: isES
            ? `Nuevo mensaje de ${safeName}${company ? ` — ${company}` : ''}`
            : `New message from ${safeName}${company ? ` — ${company}` : ''}`,
          html: buildContactHTML(templateData, 'admin'),
        }, EMAIL_TIMEOUT_MS, req, 'admin'),
        
        sendWithTimeout(transporter, {
          from: `"Javier Ibrahim" <${GMAIL_USER}>`,
          to: [email, GMAIL_USER],
          replyTo: GMAIL_USER,
          subject: isES ? 'Hemos recibido tu mensaje ✅' : 'We received your message ✅',
          html: buildContactHTML(templateData, 'client'),
        }, EMAIL_TIMEOUT_MS, req, 'client')
      ]);
      
      log.addTrace(req, 'email.admin.complete', adminOk ? 'ok' : 'timeout');
      log.addTrace(req, 'email.client.complete', clientOk ? 'ok' : 'timeout');
      log.structured(req, { stage: 'email.admin.complete', status: adminOk ? 'ok' : 'timeout' });
      log.structured(req, { stage: 'email.client.complete', status: clientOk ? 'ok' : 'timeout' });

      stage(req, 'after_email_send');
      const sendStatus = adminOk && clientOk ? 'ok' : 'partial';
      const finalLifecycleStatus = adminOk && clientOk ? 'completed' : 'failed';
      const executionFinishedAt = Date.now();

      registry.registerLifecycle(rid, { endpoint: 'sendContact', status: finalLifecycleStatus, executionFinishedAt });

      log.addTrace(req, 'email.sendEnd', sendStatus);
      log.structured(req, { stage: 'email.sendEnd', status: sendStatus });
      log.info(req, 'Contact emails sent', { name: safeName, email: maskEmail(email), adminOk, clientOk });
    },
    req,
    label: 'sendContact',
  });

  if (!queueResult) {
    log.warn(req, 'Queue overflow', { ip });
    log.event('queue.overflow', req, { ip, endpoint: 'sendContact' });
    log.addTrace(req, 'queue.assign', 'overflow');
    log.structured(req, { stage: 'queue.assign', status: 'overflow' });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'rejected', reason: 'bad_request', validationStage: 'queueCheck', validationField: 'queue', validationReason: 'overflow', receivedAt: req._lifecycle.startTime });
    tracer.trace(log.requestId(req), 'sendContact', 'queueCheck', 'sendContact:queueCheck');
    await registry.persistImmediate(log.requestId(req));
    return json(503, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'rejected', error: 'QUEUE_OVERFLOW', queuePosition: 0, queueDepth: 0 }))(res);
  }

  const { queueId, position, depth } = queueResult;
  const queuedAt = Date.now();
  req._lifecycle.queuedAt = queuedAt;
  req._lifecycle.queuePosition = position;
  req._lifecycle.queueDepth = depth;
  registry.registerLifecycle(log.requestId(req), { endpoint: 'sendContact', status: 'queued',
    receivedAt: req._lifecycle.startTime,
    queuedAt,
    queuePosition: position,
    queueDepth: depth,
  });
  log.event('queue.queued', req, { queueId, position, depth, endpoint: 'sendContact' });
  log.debugLog(req, 'Emails queued', { queueId, position, depth });
  log.addTrace(req, 'queue.assign', 'ok');
  log.structured(req, { stage: 'queue.assign', status: 'ok', queueId, position, depth });
  log.addTrace(req, 'queue.waitStart', 'ok');
  log.structured(req, { stage: 'queue.waitStart', status: 'ok', position, depth });
  tracer.trace(log.requestId(req), 'sendContact', 'submitted', 'sendContact:submitted');
  return json(202, withSoftHeaders(req, {
    'Content-Type': 'application/json',
    ...deployHeaders(req),
    ...reqHeaders(req),
    'X-Queue-Id': String(queueId),
    'X-Queue-Depth': String(depth),
    'X-Queue-Position': String(position),
    'X-Processing-Mode': depth > 0 ? 'queued' : 'immediate',
    'X-RateLimit-Limit': String(edge.limit),
    'X-RateLimit-Remaining': String(Math.max(0, edge.remaining)),
  }), resPayload(req, { success: true, status: 'queued', queued: true, position, depth, queuePosition: position, queueDepth: depth }))(res);
} catch (err) {
    const rid = log.requestId(req);
    tracer.trace(rid, 'sendContact', 'handlerError', 'sendContact:handlerError');
    log.error(req, 'Unexpected error in sendContact', { error: err.message });
    return json(500, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, status: 'error', error: 'INTERNAL_ERROR' }))(res);
  } finally {
    emailQueue.waitUntilEmpty().catch(() => {});
    await tracer.drain();
  }
};

function buildContactHTML({ name, email, company, project, message, dateStr, lang }, type) {
  const isES = lang === 'es';
  const t = (es, en) => (isES ? es : en);
  const label = (es, en) => `<tr><td style="padding:6px 16px 6px 0;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:13px">${t(es, en)}</td><td style="padding:6px 0;color:#222;font-size:13px">`;

  const headerTitle = type === 'client'
    ? t('Hemos recibido tu mensaje', 'We received your message')
    : t('Nuevo mensaje recibido', 'New message received');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,#00D4FF,#00FFC8);padding:24px 32px">
        <h1 style="margin:0;color:#0B0F19;font-size:20px;font-weight:700">Javier Ibrahim</h1>
        <p style="margin:4px 0 0;color:#0B0F19;font-size:13px;opacity:0.8">${headerTitle}</p>
      </td></tr>
      <tr><td style="padding:24px 32px 8px">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${label('Nombre', 'Name')}${escapeHTML(name)}</td></tr>
          ${label('Email', 'Email')}${escapeHTML(email)}</td></tr>
          ${company ? `${label('Empresa', 'Company')}${escapeHTML(company)}</td></tr>` : ''}
          ${project ? `${label('Proyecto', 'Project')}${escapeHTML(project)}</td></tr>` : ''}
          ${label('Enviado', 'Sent')}${escapeHTML(dateStr)}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 32px 24px">
        <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#333;text-transform:uppercase;letter-spacing:0.04em">${isES ? 'Mensaje' : 'Message'}</h2>
        <div style="background:#f8f9fb;border-radius:6px;padding:20px;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#333;white-space:pre-wrap;word-break:break-word">${escapeHTML(message)}</div>
      </td></tr>
      <tr><td style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #eee">
        <p style="margin:0;font-size:11px;color:#999">Javier Ibrahim — javieribrahim.dev</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

function escapeHTML(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
