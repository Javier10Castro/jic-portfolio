const nodemailer = require('nodemailer');
const {
  RATE_LIMIT_REASON,
  edgeCheck, rateLimitKey,
  rateLimitHeaders, softLimitHeaders,
  emailDedup, honeypotCheck, timingCheck,
  validateEmail, sanitizeAndValidateName, clientIp, maskEmail,
  waitForSmtpSlot, releaseSmtpSlot,
} = require('../lib/rate-limit');
const log = require('../lib/logger');

function json(status, headers, payload) {
  return res => { res.writeHead(status, headers).end(JSON.stringify(payload)); };
}

function debugHeaders(rlCheck, reason) {
  if (process.env.DEBUG_RATE_LIMIT !== 'true') return {};
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

async function sendWithTimeout(transporter, mailOptions, timeoutMs, req, label) {
  const sendStart = Date.now();
  try {
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('send_timeout'), { timedOut: true })), timeoutMs)),
    ]);
    const elapsed = Date.now() - sendStart;
    log.debugLog(req, `email_send:${label}`, { elapsed_ms: elapsed });
    releaseSmtpSlot(elapsed, true);
    return true;
  } catch (err) {
    if (err.timedOut) {
      log.warn(req, `Email send timed out`, { label, timeout_ms: timeoutMs, elapsed_ms: Date.now() - sendStart });
      log.debugLog(req, `email_send:${label} (timed_out)`, { elapsed_ms: Date.now() - sendStart });
      releaseSmtpSlot(Date.now() - sendStart, false);
      return false;
    }
    releaseSmtpSlot(Date.now() - sendStart, false);
    throw err;
  }
}

module.exports = async (req, res) => {
  const start = Date.now();
  const ip = clientIp(req);
  req._debugEndpoint = 'sendContact';
  stage(req, 'start');

  if (req.method !== 'POST') {
    log.warn(req, 'Method not allowed', { ip, method: req.method, reason: RATE_LIMIT_REASON.VALIDATION });
    return json(405, { 'Content-Type': 'application/json' }, { success: false, error: 'Method Not Allowed' })(res);
  }

  // ── 1. Body parsing ───────────────────────────────────────────
  let body = '';
  for await (const chunk of req) body += chunk;
  if (body.length > 1_000_000) {
    log.debugLog(req, 'Payload too large', { ip, length: body.length });
    return json(413, { 'Content-Type': 'application/json' }, { success: false, error: 'Payload too large' })(res);
  }

  let parsed;
  try { parsed = JSON.parse(body || '{}'); } catch {
    log.debugLog(req, 'Invalid JSON body', { ip, bodyPreview: body.slice(0, 200) });
    return json(400, { 'Content-Type': 'application/json' }, { success: false, error: 'Invalid JSON body' })(res);
  }

  log.debugLog(req, 'Body parsed', { ip, hasEmail: !!parsed.email, nameLength: parsed.name?.length });

  // ── 2. Anti-spam: honeypot (silent 200) ───────────────────────
  const hp = honeypotCheck(parsed);
  if (hp.triggered) {
    log.warn(req, 'Honeypot triggered', { ip, field: hp.field, reason: RATE_LIMIT_REASON.BOT });
    return json(200, { 'Content-Type': 'application/json', ...debugHeaders({ allowed: false }, RATE_LIMIT_REASON.BOT) }, { success: true })(res);
  }

  // ── 3. Anti-spam: timing check (submittedAt REQUIRED) �────────
  const tc = timingCheck(parsed);
  if (tc.tooFast) {
    const reason = tc.reason === 'missing_timestamp' ? RATE_LIMIT_REASON.BOT : RATE_LIMIT_REASON.TIMING;
    log.warn(req, 'Timing check failed', { ip, elapsedMs: tc.elapsedMs, reason });
    return json(400, { 'Content-Type': 'application/json', ...debugHeaders({ allowed: false }, reason) }, { success: false, error: 'Invalid request' })(res);
  }

  // ── 4. Validate payload ───────────────────────────────────────
  const { name: rawName, email, company, project, message, lang } = parsed;

  const nameCheck = sanitizeAndValidateName(rawName);
  if (!nameCheck.valid) {
    log.debugLog(req, 'Name validation failed', { ip, reason: nameCheck.reason });
    return json(400, { 'Content-Type': 'application/json' }, { success: false, error: nameCheck.reason })(res);
  }
  const safeName = nameCheck.value;

  if (!validateEmail(email)) {
    log.warn(req, 'Invalid email', { ip, email: maskEmail(email), reason: RATE_LIMIT_REASON.VALIDATION });
    return json(400, { 'Content-Type': 'application/json' }, { success: false, error: 'A valid email address is required' })(res);
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    log.debugLog(req, 'Message missing', { ip });
    return json(400, { 'Content-Type': 'application/json' }, { success: false, error: 'Message is required' })(res);
  }
  if (message.length > 100000) {
    log.debugLog(req, 'Message too long', { ip, length: message.length });
    return json(400, { 'Content-Type': 'application/json' }, { success: false, error: 'Message exceeds 100,000 characters' })(res);
  }

  // ── 5. LAYER 1: Edge protection (IP burst) ────────────────────
  // Soft limit (>20 req/60s): still allow through but set throttling headers.
  // Hard limit (>40 req/60s): blocks aggressive bots only.
  const rlKey = rateLimitKey('contact', req);
  const edge = edgeCheck(rlKey);
  if (edge.soft) req._edgeSoft = edge;
  if (!edge.allowed) {
    log.warn(req, 'Edge blocked', { ip, retryAfter: edge.retryAfter, reason: RATE_LIMIT_REASON.IP_BURST });
    return json(429, { ...rateLimitHeaders(edge), ...debugHeaders(edge, RATE_LIMIT_REASON.IP_BURST) }, { success: false, error: 'Too many requests. Please wait before submitting again.' })(res);
  }

  // ── 6. LAYER 2: Abuse protection — email dedup (5 min) ────────
  const dedupCheck = emailDedup(email);
  if (!dedupCheck.allowed) {
    log.warn(req, 'Email dedup blocked', { email: maskEmail(email), retryAfter: dedupCheck.retryAfter, reason: RATE_LIMIT_REASON.EMAIL_DUP });
    return json(429, { ...rateLimitHeaders(dedupCheck), ...debugHeaders(dedupCheck, RATE_LIMIT_REASON.EMAIL_DUP) }, { success: false, error: 'A message was already sent with this email. Please wait before sending again.' })(res);
  }

  stage(req, 'after_validation');

  // ── 7. LAYER 3: Resource protection (SMTP concurrency) ────────
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    log.error(req, 'Missing GMAIL_USER or GMAIL_APP_PASSWORD', null, { ip });
    return json(500, { 'Content-Type': 'application/json' }, { success: false, error: 'Email service misconfigured' })(res);
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

  // ── 8. LAYER 3: Acquire SMTP slot (concurrency + adaptive) ────
  stage(req, 'before_email_send');
  const slot = await waitForSmtpSlot(req, 3000);
  if (!slot.acquired) {
    log.warn(req, 'SMTP slot unavailable', { reason: slot.reason, retryAfter: slot.retryAfter });
    return json(503, { ...rateLimitHeaders(slot), ...debugHeaders(slot, RATE_LIMIT_REASON.SMTP_CONGESTION) }, { success: false, error: 'Service is busy. Please try again in a moment.' })(res);
  }

  try {
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
    log.info(req, 'Contact emails sent', { name: safeName, email: maskEmail(email), duration_ms: Date.now() - start });
    return json(200, withSoftHeaders(req, { 'Content-Type': 'application/json' }), { success: true })(res);
  } catch (error) {
    log.error(req, 'Failed to send contact emails', error, { name: safeName, email: maskEmail(email), duration_ms: Date.now() - start });
    log.debugLog(req, 'Catch block hit', { error: error.message, stack: error.stack?.split('\n').slice(0, 3).join('; ') });
    return json(502, { 'Content-Type': 'application/json' }, { success: false, error: 'Failed to send email. Please try again later.' })(res);
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
