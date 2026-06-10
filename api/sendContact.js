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
  try {
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('send_timeout'), { timedOut: true })), timeoutMs)),
    ]);
    const elapsed = Date.now() - sendStart;
    log.debugLog(req, `email_send:${label}`, { elapsed_ms: elapsed });
    return true;
  } catch (err) {
    if (err.timedOut) {
      log.warn(req, `Email send timed out`, { label, timeout_ms: timeoutMs, elapsed_ms: Date.now() - sendStart });
      log.debugLog(req, `email_send:${label} (timed_out)`, { elapsed_ms: Date.now() - sendStart });
      return false;
    }
    throw err;
  }
}

module.exports = async (req, res) => {
  const start = Date.now();
  const ip = clientIp(req);
  req._debugEndpoint = 'sendContact';
  log.requestId(req);
  log.event('request.start', req, { ip, method: req.method, endpoint: 'sendContact' });
  stage(req, 'start');
  const di = deployInfo();
  log.info(req, 'deploy_context', { sha: di.sha, env: di.env, region: di.region });

  if (req.method !== 'POST') {
    log.warn(req, 'Method not allowed', { ip, method: req.method, reason: RATE_LIMIT_REASON.VALIDATION });
    return json(405, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'Method Not Allowed' }))(res);
  }

  const bt = log.bodyType(req);

  const parsed = await parseBody(req);
  if (!parsed) {
    log.event('body_parse.fail', req, { bodyType: bt, parseMethod: req._bodyParseMethod || 'unknown' });
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_BODY' }))(res);
  }
  log.event('body_parse.ok', req, { bodyType: bt, parseMethod: req._bodyParseMethod || 'unknown' });

  const hp = honeypotCheck(parsed);
  if (hp.triggered) {
    log.warn(req, 'Honeypot triggered', { ip, field: hp.field, reason: RATE_LIMIT_REASON.BOT });
    log.event('honeypot.triggered', req, { field: hp.field });
    return json(200, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req), ...debugHeaders({ allowed: false }, RATE_LIMIT_REASON.BOT) }, resPayload(req, { success: true }))(res);
  }

  const tc = timingCheck(parsed);
  if (tc.blocked) {
    log.warn(req, 'Timing check failed', { ip, reason: tc.reason });
    log.event('timing_check.blocked', req, { reason: tc.reason });
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_REQUEST' }))(res);
  }
  log.event('timing_check.ok', req, { elapsedMs: tc.elapsedMs });

  const { name: rawName, email, company, project, message, lang } = parsed;

  const nameCheck = sanitizeAndValidateName(rawName);
  if (!nameCheck.valid) {
    log.debugLog(req, 'Name validation failed', { ip, reason: nameCheck.reason });
    log.event('validation.fail', req, { field: 'name', reason: nameCheck.reason });
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_REQUEST' }))(res);
  }
  const safeName = nameCheck.value;

  if (!validateEmail(email)) {
    log.warn(req, 'Invalid email', { ip, email: maskEmail(email), reason: RATE_LIMIT_REASON.VALIDATION });
    log.event('validation.fail', req, { field: 'email' });
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_REQUEST' }))(res);
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    log.debugLog(req, 'Message missing', { ip });
    log.event('validation.fail', req, { field: 'message', reason: 'empty' });
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_REQUEST' }))(res);
  }
  if (message.length > 100000) {
    log.debugLog(req, 'Message too long', { ip, length: message.length });
    log.event('validation.fail', req, { field: 'message', reason: 'too_long', length: message.length });
    return json(400, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'INVALID_REQUEST' }))(res);
  }

  const rlKey = rateLimitKey('contact', req);
  const edge = edgeCheck(rlKey);
  if (edge.soft) req._edgeSoft = edge;
  if (!edge.allowed) {
    log.warn(req, 'Edge blocked', { ip, retryAfter: edge.retryAfter, reason: RATE_LIMIT_REASON.IP_BURST });
    log.event('rate_limit.blocked', req, { layer: 'edge', reason: RATE_LIMIT_REASON.IP_BURST, retryAfter: edge.retryAfter, remaining: edge.remaining });
    return json(429, { ...deployHeaders(req), ...reqHeaders(req), ...rateLimitHeaders(edge), ...debugHeaders(edge, RATE_LIMIT_REASON.IP_BURST) }, resPayload(req, { success: false, error: 'RATE_LIMITED' }))(res);
  }

  const dedupCheck = emailDedup(email);
  if (!dedupCheck.allowed) {
    log.warn(req, 'Email dedup blocked', { email: maskEmail(email), retryAfter: dedupCheck.retryAfter, reason: RATE_LIMIT_REASON.EMAIL_DUP });
    log.event('rate_limit.blocked', req, { layer: 'dedup', reason: RATE_LIMIT_REASON.EMAIL_DUP, retryAfter: dedupCheck.retryAfter, email: maskEmail(email) });
    return json(429, { ...deployHeaders(req), ...reqHeaders(req), ...rateLimitHeaders(dedupCheck), ...debugHeaders(dedupCheck, RATE_LIMIT_REASON.EMAIL_DUP) }, resPayload(req, { success: false, error: 'RATE_LIMITED' }))(res);
  }

  log.event('rate_limit.ok', req, { edgeRemaining: edge.remaining });
  stage(req, 'after_validation');

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    log.error(req, 'Missing GMAIL_USER or GMAIL_APP_PASSWORD', null, { ip });
    log.event('smtp.misconfigured', req, { ip });
    return json(500, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'Email service misconfigured' }))(res);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  const isES = lang === 'es';
  const now = new Date();
  const dateStr = isES
    ? now.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const templateData = { name: safeName, email, company, project, message, dateStr, lang: isES ? 'es' : 'en' };

  stage(req, 'before_email_send');
  const queueResult = emailQueue.enqueue({
    handler: async () => {
      await sendWithTimeout(transporter, {
        from: `"Javier Ibrahim — Portfolio" <${GMAIL_USER}>`,
        to: GMAIL_USER,
        replyTo: email,
        subject: isES
          ? `Nuevo mensaje de ${safeName}${company ? ` — ${company}` : ''}`
          : `New message from ${safeName}${company ? ` — ${company}` : ''}`,
        html: buildContactHTML(templateData, 'admin'),
      }, EMAIL_TIMEOUT_MS, req, 'admin');

      stage(req, 'before_email_client');
      await sendWithTimeout(transporter, {
        from: `"Javier Ibrahim" <${GMAIL_USER}>`,
        to: [email, GMAIL_USER],
        replyTo: GMAIL_USER,
        subject: isES ? 'Hemos recibido tu mensaje ✅' : 'We received your message ✅',
        html: buildContactHTML(templateData, 'client'),
      }, EMAIL_TIMEOUT_MS, req, 'client');

      stage(req, 'after_email_send');
      log.info(req, 'Contact emails sent', { name: safeName, email: maskEmail(email) });
    },
    req,
    label: 'sendContact',
  });

  if (!queueResult) {
    log.warn(req, 'Queue overflow', { ip });
    log.event('queue.overflow', req, { ip, endpoint: 'sendContact' });
    return json(503, { 'Content-Type': 'application/json', ...deployHeaders(req), ...reqHeaders(req) }, resPayload(req, { success: false, error: 'QUEUE_OVERFLOW' }))(res);
  }

  const { queueId, position, depth } = queueResult;
  log.event('queue.queued', req, { queueId, position, depth, endpoint: 'sendContact' });
  log.debugLog(req, 'Emails queued', { queueId, position, depth });
  return json(202, withSoftHeaders(req, {
    'Content-Type': 'application/json',
    ...deployHeaders(req),
    ...reqHeaders(req),
    'X-Queue-Id': String(queueId),
    'X-Queue-Depth': String(depth),
    'X-Queue-Position': String(position),
    'X-Processing-Mode': depth > 0 ? 'queued' : 'immediate',
  }), resPayload(req, { success: true, queued: true, position, depth }))(res);
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
