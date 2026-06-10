// =============================================================================
// E2E Brief Maestro — Bypass del Wizard v1
//
// Modo 1: submitContact() direct (usa la función interna real, necesita DOM)
// Modo 2: fetch directo a /api/sendBrief (no necesita DOM, puro bypass)
// =============================================================================
// Pega todo el script en DevTools console de brief-maestro.html
// =============================================================================

(function() {
  'use strict';

  const LOG_PFX = '[E2E-Brief]';
  const log = (msg, data) => console.log(`${LOG_PFX} ${msg}`, data !== undefined ? data : '');
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ── Test Data ──────────────────────────────────────────────────────────────
  const TEST_DATA = {
    biz_name: 'Salmos Café',
    biz_tagline: 'Experiencias memorables alrededor de una taza de café',
    biz_history: 'Salmos Café nació hace cuatro años durante un campamento de líderes juveniles. Lo que comenzó como una pasión por el café y el deseo de servir a Dios se transformó en un proyecto dedicado a crear experiencias memorables para las personas a través de una barra de café profesional para eventos.',
    biz_mision: 'Llevar lo mejor del café y crear experiencias excepcionales que conecten a las personas a través del servicio, la hospitalidad y la excelencia.',
    biz_vision: 'Convertirnos en una de las empresas de café para eventos más reconocidas de Baja California.',
    biz_valores: ['Excelencia', 'Servicio', 'Integridad', 'Hospitalidad', 'Calidad', 'Pasión'],
    biz_diferenciadores: 'Atención personalizada, imagen elegante, inspiración cristiana, café de alta calidad, experiencia memorable.',
    biz_personalidad: ['Profesional y seria', 'Cercana y amigable', 'Minimalista y elegante'],
    biz_contacto: 'Teléfono y WhatsApp: 663 150 8119 | Correo: salmoscafe497@gmail.com',
    biz_redes: 'Instagram: @salmos_cafe | Facebook: SalmosCafe',
    obj_principal: 'Generar leads calificados',
    obj_secundarios: ['Posicionamiento SEO', 'Construcción de comunidad', 'Educación del mercado'],
    obj_kpis: 'Solicitudes de cotización, mensajes por WhatsApp, formularios enviados, llamadas recibidas.',
    obj_conversion: 'Llenar formulario de contacto',
    obj_plazo: '3\u20136 meses',
    comp_sitio: '',
    comp_problemas: ['No tengo sitio web actualmente'],
    comp_directos: 'Civet Cafe, Bendito Cafe, Electric Coffee Roasters, Das Cortez',
    comp_aspiracionales: 'Marcas premium de café y experiencias para eventos.',
    comp_oportunidades: 'Diferenciarse mediante experiencia personalizada, elegante y enfocada en eventos.',
    pub_ideal: 'Parejas próximas a casarse, organizadores de eventos, iglesias, empresas.',
    pub_problemas: 'Necesitan un servicio profesional que agregue valor a sus eventos.',
    pub_motivaciones: 'Crear una experiencia memorable, elevar la percepción del evento.',
    pub_objeciones: 'Precio, disponibilidad, calidad del producto, capacidad para eventos grandes.',
    pub_decision: 'Investiga y compara varias opciones',
    pub_canales: ['Instagram', 'Facebook', 'Referidos/boca en boca', 'Google búsqueda orgánica'],
    brand_logo: 'Sí, tengo logotipo definido',
    brand_tipografia: 'Moderna, limpia, sans-serif profesional como Inter o Poppins.',
    brand_estilo: ['Minimalista y limpio', 'Moderno y tecnológico', 'Cálido y humano'],
    brand_emociones: ['Confianza y seguridad', 'Calidad y excelencia', 'Cercanía y calidez', 'Profesionalismo y seriedad'],
    brand_prohibido: '',
    brand_nivel: 4,
    branding_colors: { primary: '#529FB3', secondary: '#0B0F19', accent: '#00D4FF', palette: ['#0B0F19', '#529FB3', '#00D4FF', '#FFFFFF'] },
    brand_colores: 'Primary: #529FB3 | Secondary: #0B0F19 | Accent: #00D4FF | Palette: #0B0F19, #529FB3, #00D4FF, #FFFFFF',
    arq_paginas: ['Portada/Inicio', 'Quiénes somos', 'Servicios (general)', 'Portafolio/Casos de éxito', 'Testimonios', 'Contacto'],
    arq_extras: '',
    arq_prioridad: 'Inicio, Servicios, Galería',
    arq_flujo: 'Inicio \u2192 Servicios \u2192 Galer\u00eda \u2192 Contacto',
    cont_textos: 'Solo ideas y notas',
    cont_fotos: 'Algunas fotos básicas',
    cont_videos: 'No tengo pero estoy dispuesto a producir',
    cont_recursos: '',
    serv_lista: 'Barra móvil de café para eventos, coffee break, bebidas calientes y frías.',
    serv_estrella: 'Barra de café para eventos',
    serv_beneficios: 'Experiencia premium, servicio personalizado, excelente presentación.',
    serv_proceso: '1. Cotización 2. Definición 3. Confirmación 4. Menú 5. Montaje 6. Operación',
    serv_precio: 'Precios a consultar',
    social_testimonios: 'Clientes destacan la calidad del café y la atención del equipo.',
    social_numeros: 'Más de 50 eventos realizados. De 20 a más de 1000 personas.',
    social_clientes: '',
    social_cert: '',
    social_casos: 'Historias pero sin métricas',
    func_basicas: ['Formulario de contacto', 'WhatsApp flotante', 'Galería de imágenes'],
    func_avanzadas: ['Sistema de reservas/citas'],
    func_herramientas: '',
    func_cms: 'Yo mismo / equipo interno',
    seo_keywords: ['barra de café para eventos', 'coffee bar para bodas', 'coffee catering tijuana', 'barra móvil de café'],
    seo_geo: ['Tijuana', 'Rosarito', 'Tecate', 'Ensenada', 'Baja California'],
    seo_competencia: '',
    seo_blog: 'Me gustaría empezar',
    ref_favoritos: 'Marcas premium de café minimalistas y elegantes con fotografías inmersivas.',
    ref_odio: '',
    ref_marcas: 'Apple',
    ref_palabras: 'Elegante, Premium, Memorables',
    conv_cta: 'Cotiza tu evento',
    conv_oferta: '',
    conv_lead: '',
    conv_urgencia: '',
    conv_seguimiento: 'Contactar al prospecto por WhatsApp o llamada en 24 hrs.',
    ai_persona: 'Un anfitrión elegante, atento y genuino que hace sentir especial a cada invitado.',
    ai_5seg: 'Profesionalismo, confianza y una experiencia premium.',
    ai_diferencia: 'No solo servimos café; creamos experiencias memorables que elevan cualquier evento.',
    ai_prohibido: '',
    ai_metafora: 'Como el aroma de un buen café que transforma un momento ordinario en una experiencia inolvidable.',
    ai_extra: ''
  };

  // ── Modo 1: vía submitContact() interna ────────────────────────────────────
  // Requiere que los elementos del DOM existan (inp-name, inp-email, etc.)
  async function runViaSubmitContact(contactInfo) {
    log('=== Modo 1: submitContact() interno ===');

    // 1. Poblar formData global
    Object.assign(formData, JSON.parse(JSON.stringify(TEST_DATA)));
    if (typeof save === 'function') save();
    log('formData loaded with test data');
    log('  fields:', Object.keys(formData).length);

    // 2. Asegurar que contact-page esté visible (para que los inputs sean accesibles)
    const app = document.getElementById('app');
    const contactPage = document.getElementById('contact-page');
    if (app) app.classList.remove('active');
    if (contactPage) contactPage.classList.add('active');

    // 3. Llenar inputs de contacto
    document.getElementById('inp-name').value = contactInfo.name;
    document.getElementById('inp-email').value = contactInfo.email;
    document.getElementById('inp-company').value = contactInfo.company || '';
    document.getElementById('inp-phone').value = contactInfo.phone || '';

    log('Contact fields set:', contactInfo);

    // 4. Interceptar fetch para capturar response
    const origFetch = window.fetch;
    window.fetch = async function(...args) {
      log('📤 Request sent');
      log('  url:', args[0]);
      log('  method:', args[1]?.method || 'GET');
      log('  payload:', JSON.parse(args[1]?.body || '{}'));

      const response = await origFetch(...args);
      const clone = response.clone();
      let body = null;
      try { body = await clone.json(); } catch(e) { body = { raw: await clone.text() }; }

      log('📥 Response received');
      log('  status:', response.status);
      log('  ok:', response.ok);
      if (body.requestId) log('  requestId:', body.requestId);
      if (body.queuePosition !== undefined) log('  queuePosition:', body.queuePosition);
      if (body.queueDepth !== undefined) log('  queueDepth:', body.queueDepth);
      if (body.status) log('  status field:', body.status);
      log('  full body:', body);

      window.fetch = origFetch;
      return response;
    };

    // 5. Ejecutar submitContact() — la función interna real
    log('Calling submitContact()...');
    if (typeof submitContact === 'function') {
      submitContact();
      log('✅ submitContact() executed');
    } else {
      log('❌ submitContact() not found in global scope');
    }
  }

  // ── Modo 2: fetch directo a /api/sendBrief ─────────────────────────────────
  // No necesita DOM. Construye el payload exacto que espera el backend.
  async function runDirectAPI(contactInfo) {
    log('=== Modo 2: fetch directo a /api/sendBrief ===');

    // 1. Poblar formData (necesario para generatePrompt)
    Object.assign(formData, JSON.parse(JSON.stringify(TEST_DATA)));
    if (typeof save === 'function') save();

    // 2. Generar el prompt maestro usando la función interna
    let prompt = '';
    if (typeof generatePrompt === 'function') {
      prompt = generatePrompt();
      log('Prompt generated (' + prompt.length + ' chars)');
    } else {
      prompt = '# PROMPT MAESTRO — GENERACIÓN DE SITIO WEB PROFESIONAL\nGenerado por E2E test';
      log('⚠ generatePrompt() not found, using fallback prompt');
    }

    // 3. Construir payload exacto
    const payload = {
      name: contactInfo.name,
      email: contactInfo.email,
      company: contactInfo.company || '',
      phone: contactInfo.phone || '',
      prompt: prompt,
      lang: typeof currentLang !== 'undefined' ? currentLang : 'es',
      formData: JSON.parse(JSON.stringify(formData || TEST_DATA))
    };

    log('Payload built');
    log('  endpoint: /api/sendBrief');
    log('  name:', payload.name);
    log('  email:', payload.email);
    log('  lang:', payload.lang);
    log('  prompt length:', payload.prompt.length);
    log('  formData keys:', Object.keys(payload.formData).length);

    // 4. Enviar
    log('📤 Sending request...');
    const startTime = Date.now();

    try {
      const response = await fetch('/api/sendBrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const elapsed = Date.now() - startTime;
      let body = null;
      try { body = await response.clone().json(); } catch(e) { body = { raw: await response.clone().text() }; }

      log('📥 Response received (' + elapsed + 'ms)');
      log('  status:', response.status);
      log('  ok:', response.ok);
      if (body.requestId) log('  requestId:', body.requestId);
      if (body.queuePosition !== undefined) log('  queuePosition:', body.queuePosition);
      if (body.queueDepth !== undefined) log('  queueDepth:', body.queueDepth);
      if (body.status) log('  status field:', body.status);
      log('  full body:', body);

      if (body.requestId) {
        log('🔍 To inspect lifecycle: GET /api/sendBrief?id=' + body.requestId);
      }

      return { response, body, elapsed };
    } catch (err) {
      log('❌ Network error:', err.message);
      throw err;
    }
  }

  // ── Entry Point ────────────────────────────────────────────────────────────
  window.runBriefE2E = async function(mode, contactInfo) {
    mode = mode || 1;
    contactInfo = contactInfo || {
      name: 'Javier Ibrahim',
      email: 'contacto@ejemplo.com',
      company: 'Salmos Café',
      phone: '+52 663 150 8119'
    };

    log('═══════════════════════════════════════════');
    log('E2E Brief Maestro — Bypass del Wizard');
    log('Mode: ' + mode + ' (1=submitContact, 2=direct API)');
    log('Contact: ' + contactInfo.name + ' <' + contactInfo.email + '>');
    log('═══════════════════════════════════════════');

    // Verificar que estamos en brief-maestro.html
    if (typeof formData === 'undefined') {
      log('❌ formData global not found. Are you on brief-maestro.html?');
      return;
    }

    try {
      if (mode === 1) {
        await runViaSubmitContact(contactInfo);
      } else {
        const result = await runDirectAPI(contactInfo);
        log('✅ Direct API call complete');
        return result;
      }
    } catch (err) {
      log('❌ E2E test failed:', err.message);
      console.error(err);
    }
  };

  log('═══════════════════════════════════════════');
  log('E2E Brief Maestro script loaded');
  log('');
  log('Usage:');
  log('  runBriefE2E(1)        → Mode 1: submitContact() interno (usa DOM)');
  log('  runBriefE2E(2)        → Mode 2: fetch directo a /api/sendBrief');
  log('  runBriefE2E(1, { name, email, company?, phone? }) → custom contact');
  log('');
  log('Ejemplo: runBriefE2E(2)');
  log('═══════════════════════════════════════════');

})();
