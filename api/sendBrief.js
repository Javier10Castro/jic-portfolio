const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, company, phone, prompt, lang, formData } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables');
    return res.status(500).json({ error: 'Email service misconfigured' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  await transporter.verify();

  const isES = lang === 'es';
  const now = new Date();
  const tz = 'America/Tijuana';
  const dateStr = isES
    ? now.toLocaleDateString('es-MX', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : now.toLocaleDateString('en-US', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const bizName = (formData && formData.biz_name) || company || name;
  const pdfBuffer = await generatePDF(prompt, name, bizName, isES);

  try {
    // Email 1 — Admin notification
    await transporter.sendMail({
      from: `"Build a Brief" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      replyTo: email,
      subject: isES
        ? `Nuevo brief de ${name}${company ? ` — ${company}` : ''}`
        : `New brief from ${name}${company ? ` — ${company}` : ''}`,
      html: buildEmailHTML({ name, email, company, phone, prompt, dateStr, lang: isES ? 'es' : 'en', formData }),
      attachments: [{
        filename: `brief-${bizName.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g,'_').toLowerCase()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    // Email 2 — Client confirmation
    const clientSubject = isES
      ? `Gracias por compartir tu proyecto conmigo 🚀`
      : `Thank you for sharing your project with me 🚀`;

    await transporter.sendMail({
      from: `"Build a Brief" <${GMAIL_USER}>`,
      to: [email, GMAIL_USER],
      replyTo: GMAIL_USER,
      subject: clientSubject,
      html: buildClientEmailHTML({ name, bizName, dateStr, lang: isES ? 'es' : 'en' }),
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('sendMail error:', error);
    return res.status(502).json({ error: 'Failed to send email' });
  }
};

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
            <!-- Success checkmark -->
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

          <!-- PROJECT STATUS CARD -->
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

          <!-- NEXT STEPS SECTION -->
          <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0B0F19">${isES ? '¿Qué sucederá ahora?' : 'What happens next?'}</h2>

          <table width="100%" cellpadding="0" cellspacing="0" border="0">${stepsRows}</table>

          <!-- TIMELINE -->
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

          <!-- ADDITIONAL MATERIALS -->
          <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0B0F19">${isES ? '¿Quieres agregar algo más?' : 'Want to add something else?'}</h2>

          <p class="email-text" style="margin:0 0 24px;font-size:14px;color:#222;line-height:1.7">${isES
            ? 'Si después de enviar el formulario recuerdas algún detalle importante, deseas compartir referencias, fotografías, logotipos o cualquier material adicional, puedes responder directamente a este correo y lo tomaré en cuenta durante la revisión.'
            : 'If after submitting the form you remember an important detail, want to share references, photos, logos, or any additional material, feel free to reply directly to this email and I will consider it during the review.'}</p>

          <!-- COMMITMENT -->
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

          <!-- SIGNATURE -->
          <div style="text-align:center;margin-bottom:16px">
            <div style="display:inline-block;width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#00D4FF,#00FFC8);text-align:center;line-height:36px;font-size:13px;font-weight:700;color:#0B0F19;letter-spacing:-0.03em">JIC</div>
          </div>
          <p class="email-text" style="margin:0 0 4px;font-size:15px;color:#222;line-height:1.7">${isES ? 'Un abrazo,' : 'Best regards,'}</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#0B0F19;line-height:1.5">Javier Ibrahim</p>
          <p class="email-muted" style="margin:0;font-size:12px;color:#888">${isES ? 'Desarrollo Web & Experiencias Digitales' : 'Web Development & Digital Experiences'}</p>
          <p class="email-muted" style="margin:2px 0 0;font-size:12px;color:#888">javieribrahim.dev</p>

        </td></tr>

        <!-- FOOTER -->
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

      // Line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(brandColor).lineWidth(2).stroke();
      doc.moveDown(0.5);

      // Prompt content
      doc.font('Courier').fontSize(7.5).fillColor('#333');
      const lines = (prompt || '').split('\n');
      for (const line of lines) {
        doc.text(line, { indent: 0 });
      }

      // Footer
      doc.moveDown(0.5);
      doc.fontSize(7).font('Helvetica').fillColor('#bbb').text('Build a Brief — javieribrahim.dev', { align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
