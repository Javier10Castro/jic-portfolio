const nodemailer = require('nodemailer');
const { rateLimit, rateLimitKey } = require('../lib/rate-limit');
const log = require('../lib/logger');

module.exports = async (req, res) => {
  const start = Date.now();
  let parsed = {};

  if (req.method !== 'POST') {
    return res.writeHead(405, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const rlCheck = rateLimit(rateLimitKey('contact', req), 10, 60000);
  if (!rlCheck.allowed) {
    return res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': String(rlCheck.retryAfter) }).end(JSON.stringify({ error: 'Too many requests' }));
  }

  let body = '';
  for await (const chunk of req) body += chunk;
  if (body.length > 1000000) {
    return res.writeHead(413, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Payload too large' }));
  }
  try { parsed = JSON.parse(body || '{}'); } catch { return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Invalid JSON body' })); }

  const { name, email, company, project, message, lang } = parsed;

  if (!name || !email || !message) {
    return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Name, email, and message are required' }));
  }

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    log.error(req, 'Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables');
    return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Email service misconfigured' }));
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

  const templateData = { name, email, company, project, message, dateStr, lang: isES ? 'es' : 'en' };

  try {
    // Email 1 — Admin notification (to user)
    await transporter.sendMail({
      from: `"Javier Ibrahim — Portfolio" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      replyTo: email,
      subject: isES
        ? `Nuevo mensaje de ${name}${company ? ` — ${company}` : ''}`
        : `New message from ${name}${company ? ` — ${company}` : ''}`,
      html: buildContactHTML(templateData, 'admin'),
    });

    // Email 2 — Client confirmation (to client and owner)
    await transporter.sendMail({
      from: `"Javier Ibrahim" <${GMAIL_USER}>`,
      to: [email, GMAIL_USER],
      replyTo: GMAIL_USER,
      subject: isES
        ? 'Hemos recibido tu mensaje ✅'
        : 'We received your message ✅',
      html: buildContactHTML(templateData, 'client'),
    });

    log.info(req, 'Contact emails sent', { name, email, duration_ms: Date.now() - start });
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: true }));
  } catch (error) {
    log.error(req, 'Failed to send contact emails', error, { name, email, duration_ms: Date.now() - start });
    return res.writeHead(502, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Failed to send email' }));
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
          ${label('Nombre', 'Name')}${name}</td></tr>
          ${label('Email', 'Email')}${email}</td></tr>
          ${company ? `${label('Empresa', 'Company')}${company}</td></tr>` : ''}
          ${project ? `${label('Proyecto', 'Project')}${project}</td></tr>` : ''}
          ${label('Enviado', 'Sent')}${dateStr}</td></tr>
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
