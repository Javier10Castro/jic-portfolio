const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const emailQueue = require('../lib/queue');
const { parseBody, deployInfo } = require('../lib/safeBodyParser');

const formResponses = require('../lib/db/formResponses');
const {
  RATE_LIMIT_REASON,
  edgeCheck, rateLimitKey, rateLimitHeaders, softLimitHeaders,
  emailDedup, honeypotCheck, timingCheck,
  validateEmail, sanitizeAndValidateName, validatePrompt, clientIp, maskEmail,
} = require('../lib/rate-limit');
const log = require('../lib/logger');
const registry = require('../lib/request-registry');
const tracer = require('../lib/tracer');

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
  return { requestId: log.requestId(req), ...extra };
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

// ── Upstash Redis client (optional, auto-detect) ─────────────────
let redis = null;
function getRedis() {
  if (redis !== null) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) { redis = false; return null; }
  try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({ url, token });
    return redis;
  } catch { redis = false; return null; }
}

async function redisSlidingWindow(key, maxReqs, windowMs) {
  const r = getRedis();
  if (!r) return null;
  const now = Date.now();
  const windowStart = now - windowMs;
  try {
    await r.zremrangebyscore(key, 0, windowStart);
    const count = await r.zcard(key);
    if (count >= maxReqs) {
      const oldest = await r.zrange(key, 0, 0, { withScores: true });
      const retryAfter = oldest && oldest.length >= 2
        ? Math.ceil((oldest[1] + windowMs - now) / 1000) : 60;
      return { allowed: false, remaining: 0, limit: maxReqs, retryAfter, source: 'redis' };
    }
    await r.zadd(key, { score: now, member: `${now}:${Math.random()}` });
    await r.expire(key, Math.ceil(windowMs / 1000) + 10);
    return { allowed: true, remaining: maxReqs - count - 1, limit: maxReqs, retryAfter: 0, source: 'redis' };
  } catch (err) {
    log.error(null, 'Redis rate limit error', err);
    return null;
  }
}

module.exports = async (req, res) => {
  try {
    const start = Date.now();
    const ip = clientIp(req);
  req._debugEndpoint = 'sendBrief';
  log.requestId(req);
  log.event('request.start', req, { ip, method: req.method, endpoint: 'sendBrief' });
  stage(req, 'start');
  const di = deployInfo();
  log.info(req, 'deploy_context', { sha: di.sha, env: di.env, region: di.region });

  if (req.method !== 'POST') {
    log.warn(req, 'Method not allowed', { ip, method: req.method, reason: RATE_LIMIT_REASON.VALIDATION });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'validation', validationStage: 'methodCheck', validationField: 'method', validationReason: 'not_allowed', receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'methodCheck', 'sendBrief:methodCheck');
    await registry.persistImmediate(log.requestId(req));
    return json(405, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'Method Not Allowed' }))(res);
  }

  const bt = log.bodyType(req);

  const parsed = await parseBody(req);
  if (!parsed) {
    log.event('body_parse.fail', req, { bodyType: bt, parseMethod: req._bodyParseMethod || 'unknown' });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'bad_request', validationStage: 'parseBody', validationField: 'body', validationReason: 'parse_failed', receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'parseBody', 'sendBrief:parseBody');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_BODY' }))(res);
  }
  log.event('body_parse.ok', req, { bodyType: bt, parseMethod: req._bodyParseMethod || 'unknown' });

  const hp = honeypotCheck(parsed);
  if (hp.triggered) {
    log.warn(req, 'Honeypot triggered', { ip, field: hp.field, reason: RATE_LIMIT_REASON.BOT });
    log.event('honeypot.triggered', req, { field: hp.field });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'validation', validationStage: 'honeypotCheck', validationField: hp.field, validationReason: 'bot_detected', receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'honeypotCheck', 'sendBrief:honeypotCheck');
    await registry.persistImmediate(log.requestId(req));
    return json(200, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req), ...debugHeaders({ allowed: false }, RATE_LIMIT_REASON.BOT) }, resPayload(req, { success: true }))(res);
  }

  const tc = timingCheck(parsed);
  if (tc.blocked) {
    log.event('validation.failed', req, { stage: 'timingCheck', reason: tc.reason, submittedAtType: typeof (parsed || {}).submittedAt, submittedAtValue: (parsed || {}).submittedAt, hasSubmittedAt: 'submittedAt' in (parsed || {}) });
    log.warn(req, 'Timing check failed', { ip, reason: tc.reason });
    log.event('timing_check.blocked', req, { reason: tc.reason });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'validation', validationStage: 'timingCheck', validationField: 'submittedAt', validationReason: tc.reason, receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'timingCheck', 'sendBrief:timingCheck');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_REQUEST' }))(res);
  }
  log.event('timing_check.ok', req, { elapsedMs: tc.elapsedMs });

  const { name: rawName, email, company, phone, prompt, lang, formData } = parsed;

  const nameCheck = sanitizeAndValidateName(rawName);
  if (!nameCheck.valid) {
    log.event('validation.failed', req, { stage: 'sanitizeAndValidateName', reason: nameCheck.reason, nameType: typeof rawName, nameLength: rawName ? rawName.length : 0, namePreview: rawName ? String(rawName).substring(0, 50) : null });
    log.warn(req, 'Name validation failed', { ip, reason: nameCheck.reason });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'validation', validationStage: 'sanitizeAndValidateName', validationField: 'name', validationReason: nameCheck.reason, receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'sanitizeAndValidateName', 'sendBrief:sanitizeAndValidateName');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_REQUEST' }))(res);
  }
  const safeName = nameCheck.value;
  const safeCompany = company && typeof company === 'string' ? company.replace(/<[^>]*>/g, '').trim().slice(0, 200) : '';

  if (!validateEmail(email)) {
    log.event('validation.failed', req, { stage: 'validateEmail', reason: 'invalid_format', emailType: typeof email, emailLength: email ? email.length : 0, emailPreview: email ? maskEmail(email) : null });
    log.warn(req, 'Invalid email', { ip, email: maskEmail(email), reason: RATE_LIMIT_REASON.VALIDATION });
    log.event('validation.fail', req, { field: 'email' });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'validation', validationStage: 'validateEmail', validationField: 'email', validationReason: 'invalid_format', receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'validateEmail', 'sendBrief:validateEmail');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_REQUEST' }))(res);
  }

  const promptCheck = validatePrompt(prompt);
  if (!promptCheck.valid) {
    log.event('validation.failed', req, { stage: 'validatePrompt', reason: promptCheck.reason, promptType: typeof prompt, promptLength: prompt ? prompt.length : 0, promptPreview: prompt ? String(prompt).substring(0, 200) : null });
    log.debugLog(req, 'Prompt validation failed', { ip, reason: promptCheck.reason });
    log.event('validation.fail', req, { field: 'prompt', reason: promptCheck.reason });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'validation', validationStage: 'validatePrompt', validationField: 'prompt', validationReason: promptCheck.reason, receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'validatePrompt', 'sendBrief:validatePrompt');
    await registry.persistImmediate(log.requestId(req));
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_REQUEST' }))(res);
  }

  const rlKey = rateLimitKey('brief', req);
  const edge = edgeCheck(rlKey);
  if (edge.soft) req._edgeSoft = edge;
  if (!edge.allowed) {
    log.warn(req, 'Edge blocked', { ip, retryAfter: edge.retryAfter, reason: RATE_LIMIT_REASON.IP_BURST });
    log.event('rate_limit.blocked', req, { layer: 'edge', reason: RATE_LIMIT_REASON.IP_BURST, retryAfter: edge.retryAfter, remaining: edge.remaining });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'rate_limit', validationStage: 'rateLimit', validationField: 'ip', validationReason: 'burst', receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'rateLimit:ip', 'sendBrief:rateLimit:ip');
    await registry.persistImmediate(log.requestId(req));
    return json(429, { ...deployHeaders(req), ...reqHeaders(req), ...rateLimitHeaders(edge), ...debugHeaders(edge, RATE_LIMIT_REASON.IP_BURST) }, resPayload(req, { success: false, error: 'RATE_LIMITED' }))(res);
  }

  const dedupCheck = emailDedup(email);
  if (!dedupCheck.allowed) {
    log.warn(req, 'Email dedup blocked', { email: maskEmail(email), retryAfter: dedupCheck.retryAfter, reason: RATE_LIMIT_REASON.EMAIL_DUP });
    log.event('rate_limit.blocked', req, { layer: 'dedup', reason: RATE_LIMIT_REASON.EMAIL_DUP, retryAfter: dedupCheck.retryAfter, email: maskEmail(email) });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'rate_limit', validationStage: 'rateLimit', validationField: 'email', validationReason: 'duplicate', receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'rateLimit:email', 'sendBrief:rateLimit:email');
    await registry.persistImmediate(log.requestId(req));
    return json(429, { ...deployHeaders(req), ...reqHeaders(req), ...rateLimitHeaders(dedupCheck), ...debugHeaders(dedupCheck, RATE_LIMIT_REASON.EMAIL_DUP) }, resPayload(req, { success: false, error: 'RATE_LIMITED' }))(res);
  }

  log.event('rate_limit.ok', req, { edgeRemaining: edge.remaining });
  stage(req, 'after_validation');

  // ── 7. Persist form responses (non-blocking, best-effort) ─────
  try {
    const projectId = formResponses.generateProjectId(safeName, email);
    await formResponses.saveBulkFormResponses(projectId, formData || {});
    log.info(req, 'Form responses persisted', { projectId, name: safeName, email });
  } catch (dbErr) {
    log.error(req, 'Failed to persist form responses', dbErr, { name: safeName, email });
  }

  // ── 8. Send emails ────────────────────────────────────────────
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    log.error(req, 'Missing GMAIL_USER or GMAIL_APP_PASSWORD', null, { ip });
    log.event('smtp.misconfigured', req, { ip });
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'bad_request', validationStage: 'configCheck', validationField: 'smtp', validationReason: 'missing_credentials', receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'configCheck', 'sendBrief:configCheck');
    await registry.persistImmediate(log.requestId(req));
    return json(500, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'Email service misconfigured' }))(res);
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
    registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: 'rejected', reason: 'smtp_failure', validationStage: 'transporterVerify', validationField: 'smtp', validationReason: verifyErr.message, receivedAt: Date.now() });
    tracer.trace(log.requestId(req), 'sendBrief', 'transporterVerify', 'sendBrief:transporterVerify');
    await registry.persistImmediate(log.requestId(req));
    return json(500, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'Email service unavailable' }))(res);
  }

  const isES = lang === 'es';
  const now = new Date();
  const tz = 'America/Tijuana';
  const dateStr = isES
    ? now.toLocaleDateString('es-MX', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : now.toLocaleDateString('en-US', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const bizName = (formData && formData.biz_name) || safeCompany || safeName;

  // ── 9. Generate PDF (fast, before queue) ───────────────────────
  stage(req, 'before_pdf_generation');
  const pdfBuffer = await generatePDF(prompt, safeName, bizName, isES);
  stage(req, 'after_pdf_generation');

  // ── 10. Send emails inline (diagnostic: bypass queue) ───────────
  stage(req, 'before_email_send');
  log.addTrace(req, 'email.admin.start', 'ok');
  log.addTrace(req, 'email.client.start', 'ok');
  log.structured(req, { stage: 'email.admin.start', status: 'ok' });
  log.structured(req, { stage: 'email.client.start', status: 'ok' });

  let adminOk = false, clientOk = false;
  try {
    const results = await Promise.allSettled([
      sendWithTimeout(transporter, {
        from: `"Build a Brief" <${GMAIL_USER}>`,
        to: GMAIL_USER,
        replyTo: email,
        subject: isES
          ? `Nuevo brief de ${safeName}${safeCompany ? ` — ${safeCompany}` : ''}`
          : `New brief from ${safeName}${safeCompany ? ` — ${safeCompany}` : ''}`,
        html: buildEmailHTML({ name: safeName, email, company: safeCompany, phone, prompt, dateStr, lang: isES ? 'es' : 'en', formData }),
        attachments: [{
          filename: `brief-${bizName.replace(/[^a-zA-Z0-9\\u00C0-\\u024F]/g,'_').toLowerCase()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }],
      }, EMAIL_TIMEOUT_MS, req, 'admin'),

      sendWithTimeout(transporter, {
        from: `"Build a Brief" <${GMAIL_USER}>`,
        to: [email, GMAIL_USER],
        replyTo: GMAIL_USER,
        subject: isES
          ? `Gracias por compartir tu proyecto conmigo 🚀`
          : `Thank you for sharing your project with me 🚀`,
        html: buildClientEmailHTML({ name: safeName, bizName, dateStr, lang: isES ? 'es' : 'en' }),
      }, EMAIL_TIMEOUT_MS, req, 'client'),
    ]);
    adminOk = results[0].status === 'fulfilled' ? results[0].value : false;
    clientOk = results[1].status === 'fulfilled' ? results[1].value : false;
  } catch (err) {
    log.structured(req, { stage: 'email.inline.error', status: 'error', error: err.message });
  }

  log.addTrace(req, 'email.admin.complete', adminOk ? 'ok' : 'timeout');
  log.addTrace(req, 'email.client.complete', clientOk ? 'ok' : 'timeout');
  log.structured(req, { stage: 'email.admin.complete', status: adminOk ? 'ok' : 'timeout' });
  log.structured(req, { stage: 'email.client.complete', status: clientOk ? 'ok' : 'timeout' });

  stage(req, 'after_email_send');
  const sendStatus = adminOk && clientOk ? 'ok' : 'partial';
  log.info(req, 'Brief emails sent', { name: safeName, email: maskEmail(email), adminOk, clientOk });
  registry.registerLifecycle(log.requestId(req), { endpoint: 'sendBrief', status: adminOk && clientOk ? 'completed' : 'failed', executionFinishedAt: Date.now() });
  tracer.trace(log.requestId(req), 'sendBrief', 'submitted', 'sendBrief:submitted');
  return json(200, withSoftHeaders(req, {
    'Content-Type': 'application/json',
    ...deployHeaders(req),
    ...reqHeaders(req),
    'X-Processing-Mode': 'inline',
  }), resPayload(req, { success: true, mode: 'inline', adminOk, clientOk }))(res);
} catch (err) {
    const rid = log.requestId(req);
    tracer.trace(rid, 'sendBrief', 'handlerError', 'sendBrief:handlerError');
    log.error(req, 'Unexpected error in sendBrief', { error: err.message });
    return json(500, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INTERNAL_ERROR' }))(res);
  } finally {
    emailQueue.waitUntilEmpty().catch(() => {});
    await tracer.drain();
  }
};

/* ─── Email templates (unchanged) ──────────────────────────────── */

function v(fd, key, fallback) {
  const v = fd && fd[key];
  if (v === undefined || v === null || v === '') return fallback || '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

function buildEmailHTML({ name, email, company, phone, prompt, dateStr, lang, formData }) {
  const t = (es, en) => (lang === 'es' ? es : en);
  const fd = formData || {};
  const isES = lang === 'es';

  const section = (icon, title, items) => {
    if (!items || items.length === 0) return '';
    const rows = items.map(([label, val]) =>
      val ? `<tr><td style="padding:2px 8px 2px 0;font-size:12px;color:#555;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:2px 0;font-size:12px;color:#222">${escapeHTML(val)}</td></tr>` : ''
    ).join('');
    if (!rows) return '';
    return `<tr><td style="padding:12px 0 4px;font-size:13px;font-weight:600;color:#0B0F19">${icon} ${title}</td></tr>${rows}`;
  };

  const row = (label, value) => value ? `<tr><td style="padding:4px 8px 4px 0;font-size:12px;color:#555;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:4px 0;font-size:12px;color:#222">${escapeHTML(value)}</td></tr>` : '';

  const summaryRows = [
    ['\uD83D\uDC64', t('Cliente', 'Client'), name],
    ['\uD83D\uDCE7', 'Email', email],
    ['\uD83C\uDFE2', t('Empresa', 'Company'), company],
    ['\uD83D\uDCDE', t('Teléfono', 'Phone'), phone],
    ['\uD83D\uDCC5', t('Enviado', 'Sent'), dateStr],
  ].filter(([, , v]) => v).map(([icon, label, val]) =>
    `<tr><td style="padding:4px 8px 4px 0;font-size:13px;vertical-align:top">${icon}</td><td style="padding:4px 8px 4px 0;font-size:11px;color:#888;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:4px 0;font-size:13px;color:#222">${escapeHTML(val)}</td></tr>`
  ).join('');

  const s = (key, fallback) => v(fd, key, fallback);

  const bizSection = section('\uD83C\uDFEA', isES ? 'Negocio' : 'Business', [
    [isES ? 'Empresa' : 'Name', s('biz_name')],
    [isES ? 'Eslogan' : 'Tagline', s('biz_tagline')],
    [isES ? 'Objetivo principal' : 'Main goal', s('obj_principal')],
    [isES ? 'Público ideal' : 'Target audience', s('pub_ideal')],
    [isES ? 'Servicio estrella' : 'Star service', s('serv_estrella')],
    [isES ? 'Estilo visual' : 'Visual style', s('brand_estilo')],
    [isES ? 'Colores' : 'Colors', s('brand_colores')],
    [isES ? 'Personalidad' : 'Personality', s('biz_personalidad')],
    [isES ? 'Diferenciadores' : 'Differentiators', s('biz_diferenciadores')],
    [isES ? 'CTA principal' : 'Main CTA', s('conv_cta')],
    [isES ? 'KPIs' : 'KPIs', s('obj_kpis')],
    [isES ? 'Plazo' : 'Timeline', s('obj_plazo')],
  ].filter(([_, v]) => v));

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08)">

      <!-- HEADER -->
      <tr><td style="background:linear-gradient(135deg,#00D4FF,#00FFC8);padding:24px 32px">
        <h1 style="margin:0;color:#0B0F19;font-size:20px;font-weight:700">Build a Brief</h1>
        <p style="margin:4px 0 0;color:#0B0F19;font-size:13px;opacity:0.8">${isES ? 'Nuevo brief recibido' : 'New brief received'}</p>
      </td></tr>

      <!-- CLIENT INFO -->
      <tr><td style="padding:24px 32px 8px">
        <table width="100%" cellpadding="0" cellspacing="0">${summaryRows}</table>
      </td></tr>

      <!-- SUMMARY SECTIONS -->
      <tr><td style="padding:0 32px">
        <table width="100%" cellpadding="0" cellspacing="0">${bizSection}</table>
      </td></tr>

      <!-- COPY PROMPT CALLOUT -->
      <tr><td style="padding:24px 32px 8px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4fe;border-radius:8px;border:1px solid #c8d8f0">
          <tr><td style="padding:12px 16px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:14px;vertical-align:middle">\uD83D\uDCCB</td>
                <td style="padding-left:8px;font-size:13px;font-weight:600;color:#0B0F19;vertical-align:middle">${isES ? 'Prompt maestro — cópialo abajo' : 'Master prompt — copy it below'}</td>
              </tr>
            </table>
            <div style="background:#fff;border-radius:4px;margin-top:10px;padding:14px;font-family:'Courier New',monospace;font-size:11px;line-height:1.6;color:#333;white-space:pre-wrap;word-break:break-word;border:1px solid #e0e6f0">${escapeHTML(prompt)}</div>
          </td></tr>
        </table>
      </td></tr>

      <!-- DIVIDER -->
      <tr><td style="padding:8px 32px"><hr style="border:none;border-top:1px solid #eef0f4"></td></tr>

      <!-- QUICK STATS -->
      <tr><td style="padding:0 32px 24px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:8px;background:#f8f9fb;border-radius:6px;width:33%">
              <div style="font-size:18px">\uD83D\uDCC4</div>
              <div style="font-size:11px;color:#888;margin-top:2px">${isES ? 'Brief completo' : 'Brief complete'}</div>
            </td>
            <td align="center" style="padding:8px;background:#f8f9fb;border-radius:6px;width:33%">
              <div style="font-size:18px">\uD83D\uDD0D</div>
              <div style="font-size:11px;color:#888;margin-top:2px">${isES ? '14 secciones' : '14 sections'}</div>
            </td>
            <td align="center" style="padding:8px;background:#f8f9fb;border-radius:6px;width:33%">
              <div style="font-size:18px">\uD83C\uDF10</div>
              <div style="font-size:11px;color:#888;margin-top:2px">${isES ? 'Prompt generado' : 'Prompt generated'}</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #eee">
        <p style="margin:0;font-size:11px;color:#999">Build a Brief — javieribrahim.dev</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

function buildClientEmailHTML({ name, bizName, dateStr, lang }) {
  const isES = lang === 'es';
  const esc = escapeHTML;
  const n = esc(name);
  const b = esc(bizName);

  const steps = isES ? [
    ['🔍', 'Revisar tu información', 'Leeré cada respuesta para entender tu negocio a fondo.'],
    ['💡', 'Analizar objetivos y audiencia', 'Identificaré oportunidades y puntos clave de tu proyecto.'],
    ['📝', 'Preparar observaciones iniciales', 'Tomaré notas y recomendaciones personalizadas para ti.'],
    ['📞', 'Agendaremos una llamada', 'Te contactaré para conversar sobre los siguientes pasos.'],
  ] : [
    ['🔍', 'Review your information', "I'll read every answer to understand your business deeply."],
    ['💡', 'Analyze goals & audience', "I'll identify opportunities and key points for your project."],
    ['📝', 'Prepare initial insights', "I'll take notes and personalized recommendations for you."],
    ['📞', 'We will schedule a call', "I'll reach out to talk through the next steps."],
  ];

  const stepsRows = steps.map(([icon, title, desc]) =>
    `<tr>
      <td style="padding:0 0 16px 0;vertical-align:top;width:32px;font-size:20px;line-height:1">${icon}</td>
      <td style="padding:0 0 16px 8px;vertical-align:top">
        <div style="font-size:14px;font-weight:600;color:#0B0F19;margin:0 0 2px">${title}</div>
        <div style="font-size:12px;color:#666;line-height:1.5;margin:0">${desc}</div>
      </td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  @media (prefers-color-scheme: dark) {
    .email-body { background-color:#0B0F19 !important; }
    .email-card { background-color:#131829 !important; border-color:#1e2640 !important; }
    .email-text { color:#d1d5db !important; }
    .email-text-strong { color:#f3f4f6 !important; }
    .email-muted { color:#9ca3af !important; }
    .email-border { border-color:#1e2640 !important; }
    .email-step-desc { color:#9ca3af !important; }
    .email-footer { background-color:#0d1120 !important; border-color:#1e2640 !important; }
  }
</style></head>
<body class="email-body" style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:32px 16px">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:100%">

      <!-- MAIN CARD -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">

        <!-- HEADER -->
        <tr><td bgcolor="#00D4FF" style="background:linear-gradient(135deg,#00D4FF,#00FFC8);background-color:#00D4FF;padding:28px 32px">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle">
                <div style="display:inline-block;width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#00FFC8,#00D4FF);text-align:center;line-height:36px;font-size:13px;font-weight:700;color:#0B0F19;margin-right:10px;vertical-align:middle;letter-spacing:-0.03em">JIC</div>
                <span style="font-size:18px;font-weight:700;color:#0B0F19;vertical-align:middle">Javier Ibrahim</span>
              </td>
              <td style="text-align:right;vertical-align:middle">
                <span style="font-size:11px;color:#0B0F19;opacity:0.7;font-weight:500">${isES ? 'Brief Maestro' : 'Master Brief'}</span>
              </td>
            </tr>
          </table>
          <div style="margin-top:20px;text-align:center">
            <table align="center" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="width:64px;height:64px;border-radius:50%;background:rgba(11,15,19,0.08);text-align:center;vertical-align:middle">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0B0F19" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </td></tr>
            </table>
            <h1 style="margin:12px 0 0;color:#0B0F19;font-size:22px;font-weight:700">${isES ? 'Tu proyecto ya está en mis manos 🚀' : 'Your project is in good hands 🚀'}</h1>
            <p style="margin:4px 0 0;color:#0B0F19;font-size:13px;opacity:0.75">${isES ? 'Gracias por compartir tu visión conmigo' : 'Thank you for sharing your vision with me'}</p>
          </div>
        </td></tr>

        <!-- BODY -->
        <tr><td style="padding:28px 32px;background-color:#ffffff">

          <p class="email-text" style="margin:0 0 18px;font-size:15px;color:#222;line-height:1.7">${isES
            ? `Hola <strong class="email-text-strong" style="color:#0B0F19">${n}</strong>,`
            : `Hi <strong class="email-text-strong" style="color:#0B0F19">${n}</strong>,`}</p>

          <p class="email-text" style="margin:0 0 18px;font-size:15px;color:#222;line-height:1.7">${isES
            ? `Antes que nada, gracias por tomarte el tiempo de completar el Brief Maestro para <strong class="email-text-strong" style="color:#0B0F19">${b}</strong>.`
            : `First of all, thank you for taking the time to complete the Master Brief for <strong class="email-text-strong" style="color:#0B0F19">${b}</strong>.`}</p>

          <p class="email-text" style="margin:0 0 18px;font-size:15px;color:#222;line-height:1.7">${isES
            ? 'Sé que responder todas esas preguntas requiere dedicación, pero también es una de las mejores formas de entender realmente tu negocio, tus objetivos y la visión que tienes para tu proyecto.'
            : 'I know answering all those questions takes effort, but it is also one of the best ways to truly understand your business, your goals, and the vision you have for your project.'}</p>

          <p class="email-text" style="margin:0 0 18px;font-size:15px;color:#222;line-height:1.7">${isES
            ? 'Ya recibí toda la información correctamente y comenzaré a revisarla personalmente.'
            : 'I have received all the information and will begin reviewing it personally.'}</p>

          <p class="email-text" style="margin:0 0 24px;font-size:15px;color:#222;line-height:1.7">${isES
            ? 'Ahora viene una de mis partes favoritas del proceso: conocer a fondo tu proyecto, entender qué lo hace diferente y descubrir oportunidades para construir algo que realmente aporte valor a tu negocio.'
            : 'Now comes one of my favorite parts of the process: getting to know your project deeply, understanding what makes it different, and finding opportunities to build something that truly adds value to your business.'}</p>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" style="background:#f8f9fb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:28px">
            <tr><td style="padding:14px 18px">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="email-muted" style="padding:4px 16px 4px 0;font-size:12px;color:#888;white-space:nowrap">${isES ? 'Proyecto' : 'Project'}</td>
                  <td class="email-text-strong" style="padding:4px 0;font-size:13px;color:#0B0F19;font-weight:600;text-align:right">${b}</td>
                </tr>
                <tr>
                  <td class="email-muted" style="padding:4px 16px 4px 0;font-size:12px;color:#888;white-space:nowrap">${isES ? 'Recibido' : 'Received'}</td>
                  <td class="email-text" style="padding:4px 0;font-size:13px;color:#222;text-align:right">${esc(dateStr)}</td>
                </tr>
                <tr>
                  <td class="email-muted" style="padding:4px 16px 4px 0;font-size:12px;color:#888;white-space:nowrap">${isES ? 'Estado' : 'Status'}</td>
                  <td style="padding:4px 0;font-size:13px;color:#059669;text-align:right;font-weight:600">✅ ${isES ? 'Recibido' : 'Received'}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0B0F19">${isES ? '¿Qué sucederá ahora?' : 'What happens next?'}</h2>

          <table width="100%" cellpadding="0" cellspacing="0" border="0">${stepsRows}</table>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" style="background:#f8f9fb;border-radius:8px;border:1px solid #e5e7eb;margin:20px 0 28px">
            <tr><td style="padding:16px 18px">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;width:28px;font-size:18px">⏱</td>
                  <td style="padding-left:10px;vertical-align:middle">
                    <div class="email-text-strong" style="font-size:13px;font-weight:600;color:#0B0F19;margin:0 0 2px">${isES ? 'Tiempo estimado' : 'Estimated time'}</div>
                    <div class="email-muted" style="font-size:12px;color:#666;margin:0">${isES
                      ? 'Normalmente realizo esta revisión durante las siguientes 24 a 48 horas hábiles.'
                      : 'I typically complete this review within the next 24 to 48 business hours.'}</div>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0B0F19">${isES ? '¿Quieres agregar algo más?' : 'Want to add something else?'}</h2>

          <p class="email-text" style="margin:0 0 24px;font-size:14px;color:#222;line-height:1.7">${isES
            ? 'Si después de enviar el formulario recuerdas algún detalle importante, deseas compartir referencias, fotografías, logotipos o cualquier material adicional, puedes responder directamente a este correo y lo tomaré en cuenta durante la revisión.'
            : 'If after submitting the form you remember an important detail, want to share references, photos, logos, or any additional material, feel free to reply directly to this email and I will consider it during the review.'}</p>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" style="background:linear-gradient(135deg,rgba(0,212,255,0.06),rgba(0,255,200,0.04));background-color:#f0fdfa;border-radius:8px;border:1px solid #c8f0e0;margin-bottom:28px">
            <tr><td style="padding:18px 20px">
              <h2 style="margin:0 0 10px;font-size:15px;font-weight:700;color:#0B0F19">${isES ? 'Mi compromiso' : 'My commitment'}</h2>
              <p class="email-text" style="margin:0 0 10px;font-size:14px;color:#222;line-height:1.7">${isES
                ? 'Cada proyecto que recibo es revisado de forma individual. No me interesa crear sitios web genéricos. Mi objetivo es entender qué hace único a tu negocio y ayudarte a reflejarlo de la mejor manera posible.'
                : 'Every project I receive is reviewed individually. I am not interested in creating generic websites. My goal is to understand what makes your business unique and help you reflect it in the best possible way.'}</p>
              <p class="email-text" style="margin:0;font-size:14px;color:#222;line-height:1.7">${isES
                ? 'Estoy emocionado por conocer más sobre tu proyecto y explorar juntos lo que podemos construir.'
                : 'I am excited to learn more about your project and explore together what we can build.'}</p>
            </td></tr>
          </table>

          <div style="text-align:center;margin-bottom:16px">
            <div style="display:inline-block;width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#00D4FF,#00FFC8);text-align:center;line-height:36px;font-size:13px;font-weight:700;color:#0B0F19;letter-spacing:-0.03em">JIC</div>
          </div>
          <p class="email-text" style="margin:0 0 4px;font-size:15px;color:#222;line-height:1.7">${isES ? 'Un abrazo,' : 'Best regards,'}</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#0B0F19;line-height:1.5">Javier Ibrahim</p>
          <p class="email-muted" style="margin:0;font-size:12px;color:#888">${isES ? 'Desarrollo Web & Experiencias Digitales' : 'Web Development & Digital Experiences'}</p>
          <p class="email-muted" style="margin:2px 0 0;font-size:12px;color:#888">javieribrahim.dev</p>

        </td></tr>

        <tr><td bgcolor="#f8f9fb" style="background-color:#f8f9fb;padding:16px 32px;border-top:1px solid #e5e7eb" class="email-footer">
          <p style="margin:0;font-size:11px;color:#999">Brief Maestro — javieribrahim.dev</p>
        </td></tr>

      </table>
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

function generatePDF(prompt, name, company, isES) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', buf => buffers.push(buf));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const brandColor = '#00D4FF';
      const textColor = '#1a1a2e';
      const mutedColor = '#666';

      doc.fontSize(22).font('Helvetica-Bold').fillColor(brandColor).text('Prompt Maestro', { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor(mutedColor).text(`Generado por Build a Brief — javieribrahim.dev | ${new Date().toLocaleDateString('es-MX',{year:'numeric',month:'long',day:'numeric'})}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor(textColor).text(`${isES ? 'Cliente' : 'Client'}: ${name}${company ? ` — ${company}` : ''}`, { align: 'center' });
      doc.moveDown(0.3);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(brandColor).lineWidth(2).stroke();
      doc.moveDown(0.5);

      doc.font('Courier').fontSize(7.5).fillColor('#333');
      const lines = (prompt || '').split('\n');
      for (const line of lines) {
        doc.text(line, { indent: 0 });
      }

      doc.moveDown(0.5);
      doc.fontSize(7).font('Helvetica').fillColor('#bbb').text('Build a Brief — javieribrahim.dev', { align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
