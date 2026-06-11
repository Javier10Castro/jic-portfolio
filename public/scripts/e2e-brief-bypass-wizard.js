// =============================================================================
// E2E Brief Maestro - Bypass del Wizard v2
//
// Modo 1: submitContact() direct (usa la funcion interna real, necesita DOM)
// Modo 2: fetch directo a /api/sendBrief
//   - Con formData global: usa generatePrompt() (brief-maestro.html)
//   - Sin formData global: standalone (cualquier pagina)
//
// Funciones globales expuestas:
//   runBriefE2E(mode, contactInfo, dataOverride)
//   runBriefE2EConsole(data)
//   ensureE2E()
// =============================================================================
// NOTA: Este archivo usa solo ASCII. NO contiene emojis, box-drawing ni
// caracteres Unicode fuera del rango basico.
// =============================================================================

(function() {
  'use strict';

  var LOG_PFX = '[E2E-Brief]';
  var log = function(msg, data) {
    console.log(LOG_PFX + ' ' + msg, data !== undefined ? data : '');
  };
  var sleep = function(ms) { return new Promise(function(r) { setTimeout(r, ms); }); };

  // -- Payload Builder Fallback ----------------------------------------------
  // Self-healing: if sendBrief-payload.js didn't load, define builder here.
  // Primary source of truth is sendBrief-payload.js - this only activates as
  // a safety net for pages that load the E2E script without the payload script.
  if (typeof window.buildSendBriefPayload !== 'function') {
    window.buildSendBriefPayload = function(opts) {
      var name = opts.name || '';
      var email = opts.email || '';
      var company = opts.company || '';
      var phone = opts.phone || '';
      var prompt = opts.prompt || opts.message || '';
      var rawFormData = opts.formData || {};
      var source = opts.source || 'unknown';
      var lang = opts.lang;
      if (!lang && typeof currentLang !== 'undefined') lang = currentLang;
      if (!lang) lang = 'es';
      var payload = {name:name,email:email,company:company,phone:phone,prompt:prompt,lang:lang,formData:JSON.parse(JSON.stringify(rawFormData)),submittedAt:Date.now()};
      console.log('[PAYLOAD:'+source.toUpperCase()+']',JSON.parse(JSON.stringify(payload)));
      return payload;
    };
  }

  // -- Test Data -------------------------------------------------------------
  var TEST_DATA = {
    biz_name: 'Salmos Cafe',
    biz_tagline: 'Experiencias memorables alrededor de una taza de cafe',
    biz_history: 'Salmos Cafe nacio hace cuatro anos durante un campamento de lideres juveniles. Lo que comenzo como una pasion por el cafe y el deseo de servir a Dios se transformo en un proyecto dedicado a crear experiencias memorables para las personas a traves de una barra de cafe profesional para eventos.',
    biz_mision: 'Llevar lo mejor del cafe y crear experiencias excepcionales que conecten a las personas a traves del servicio, la hospitalidad y la excelencia.',
    biz_vision: 'Convertirnos en una de las empresas de cafe para eventos mas reconocidas de Baja California.',
    biz_valores: ['Excelencia', 'Servicio', 'Integridad', 'Hospitalidad', 'Calidad', 'Pasion'],
    biz_diferenciadores: 'Atencion personalizada, imagen elegante, inspiracion cristiana, cafe de alta calidad, experiencia memorable.',
    biz_personalidad: ['Profesional y seria', 'Cercana y amigable', 'Minimalista y elegante'],
    biz_contacto: 'Telefono y WhatsApp: 663 150 8119 | Correo: salmoscafe497@gmail.com',
    biz_redes: 'Instagram: @salmos_cafe | Facebook: SalmosCafe',
    obj_principal: 'Generar leads calificados',
    obj_secundarios: ['Posicionamiento SEO', 'Construccion de comunidad', 'Educacion del mercado'],
    obj_kpis: 'Solicitudes de cotizacion, mensajes por WhatsApp, formularios enviados, llamadas recibidas.',
    obj_conversion: 'Llenar formulario de contacto',
    obj_plazo: '3-6 meses',
    comp_sitio: '',
    comp_problemas: ['No tengo sitio web actualmente'],
    comp_directos: 'Civet Cafe, Bendito Cafe, Electric Coffee Roasters, Das Cortez',
    comp_aspiracionales: 'Marcas premium de cafe y experiencias para eventos.',
    comp_oportunidades: 'Diferenciarse mediante experiencia personalizada, elegante y enfocada en eventos.',
    pub_ideal: 'Parejas proximas a casarse, organizadores de eventos, iglesias, empresas.',
    pub_problemas: 'Necesitan un servicio profesional que agregue valor a sus eventos.',
    pub_motivaciones: 'Crear una experiencia memorable, elevar la percepcion del evento.',
    pub_objeciones: 'Precio, disponibilidad, calidad del producto, capacidad para eventos grandes.',
    pub_decision: 'Investiga y compara varias opciones',
    pub_canales: ['Instagram', 'Facebook', 'Referidos/boca en boca', 'Google busqueda organica'],
    brand_logo: 'Si, tengo logotipo definido',
    brand_tipografia: 'Moderna, limpia, sans-serif profesional como Inter o Poppins.',
    brand_estilo: ['Minimalista y limpio', 'Moderno y tecnologico', 'Calido y humano'],
    brand_emociones: ['Confianza y seguridad', 'Calidad y excelencia', 'Cercania y calidez', 'Profesionalismo y seriedad'],
    brand_prohibido: '',
    brand_nivel: 4,
    branding_colors: { primary: '#529FB3', secondary: '#0B0F19', accent: '#00D4FF', palette: ['#0B0F19', '#529FB3', '#00D4FF', '#FFFFFF'] },
    brand_colores: 'Primary: #529FB3 | Secondary: #0B0F19 | Accent: #00D4FF | Palette: #0B0F19, #529FB3, #00D4FF, #FFFFFF',
    arq_paginas: ['Portada/Inicio', 'Quienes somos', 'Servicios (general)', 'Portafolio/Casos de exito', 'Testimonios', 'Contacto'],
    arq_extras: '',
    arq_prioridad: 'Inicio, Servicios, Galeria',
    arq_flujo: 'Inicio -> Servicios -> Galeria -> Contacto',
    cont_textos: 'Solo ideas y notas',
    cont_fotos: 'Algunas fotos basicas',
    cont_videos: 'No tengo pero estoy dispuesto a producir',
    cont_recursos: '',
    serv_lista: 'Barra movil de cafe para eventos, coffee break, bebidas calientes y frias.',
    serv_estrella: 'Barra de cafe para eventos',
    serv_beneficios: 'Experiencia premium, servicio personalizado, excelente presentacion.',
    serv_proceso: '1. Cotizacion 2. Definicion 3. Confirmacion 4. Menu 5. Montaje 6. Operacion',
    serv_precio: 'Precios a consultar',
    social_testimonios: 'Clientes destacan la calidad del cafe y la atencion del equipo.',
    social_numeros: 'Mas de 50 eventos realizados. De 20 a mas de 1000 personas.',
    social_clientes: '',
    social_cert: '',
    social_casos: 'Historias pero sin metricas',
    func_basicas: ['Formulario de contacto', 'WhatsApp flotante', 'Galeria de imagenes'],
    func_avanzadas: ['Sistema de reservas/citas'],
    func_herramientas: '',
    func_cms: 'Yo mismo / equipo interno',
    seo_keywords: ['barra de cafe para eventos', 'coffee bar para bodas', 'coffee catering tijuana', 'barra movil de cafe'],
    seo_geo: ['Tijuana', 'Rosarito', 'Tecate', 'Ensenada', 'Baja California'],
    seo_competencia: '',
    seo_blog: 'Me gustaria empezar',
    ref_favoritos: 'Marcas premium de cafe minimalistas y elegantes con fotografias inmersivas.',
    ref_odio: '',
    ref_marcas: 'Apple',
    ref_palabras: 'Elegante, Premium, Memorables',
    conv_cta: 'Cotiza tu evento',
    conv_oferta: '',
    conv_lead: '',
    conv_urgencia: '',
    conv_seguimiento: 'Contactar al prospecto por WhatsApp o llamada en 24 hrs.',
    ai_persona: 'Un anfitrion elegante, atento y genuino que hace sentir especial a cada invitado.',
    ai_5seg: 'Profesionalismo, confianza y una experiencia premium.',
    ai_diferencia: 'No solo servimos cafe; creamos experiencias memorables que elevan cualquier evento.',
    ai_prohibido: '',
    ai_metafora: 'Como el aroma de un buen cafe que transforma un momento ordinario en una experiencia inolvidable.',
    ai_extra: ''
  };

  // -- Modo 1: via submitContact() interna ----------------------------------
  function runViaSubmitContact(contactInfo, dataOverride) {
    log('=== Modo 1: submitContact() interno ===');

    var data = dataOverride || TEST_DATA;
    Object.assign(formData, JSON.parse(JSON.stringify(data)));
    if (typeof save === 'function') save();
    log('formData loaded with test data');
    log('  fields:' + Object.keys(formData).length);

    var app = document.getElementById('app');
    var contactPage = document.getElementById('contact-page');
    if (app) app.classList.remove('active');
    if (contactPage) contactPage.classList.add('active');

    document.getElementById('inp-name').value = contactInfo.name;
    document.getElementById('inp-email').value = contactInfo.email;
    document.getElementById('inp-company').value = contactInfo.company || '';
    document.getElementById('inp-phone').value = contactInfo.phone || '';

    log('Contact fields set: name=' + contactInfo.name + ' email=' + contactInfo.email);

    var origFetch = window.fetch;
    window.fetch = async function() {
      var args = arguments;
      log('[SEND] Request sent');
      log('  url: ' + args[0]);
      log('  method: ' + (args[1] && args[1].method ? args[1].method : 'GET'));

      var response = await origFetch.apply(window, args);
      var clone = response.clone();
      var body = null;
      try { body = await clone.json(); } catch(e) { try { body = { raw: await clone.text() }; } catch(e2) { body = { raw: 'unreadable' }; } }

      log('[RECV] Response received');
      log('  status: ' + response.status);
      log('  ok: ' + response.ok);
      if (body && body.requestId) log('  requestId: ' + body.requestId);
      if (body && body.queuePosition !== undefined) log('  queuePosition: ' + body.queuePosition);
      if (body && body.queueDepth !== undefined) log('  queueDepth: ' + body.queueDepth);
      if (body && body.status) log('  status field: ' + body.status);
      log('  full body: ' + JSON.stringify(body));

      window.fetch = origFetch;
      return response;
    };

    log('Calling submitContact()...');
    if (typeof submitContact === 'function') {
      submitContact();
      log('[OK] submitContact() executed');
    } else {
      log('[ERR] submitContact() not found in global scope');
    }
  }

  // -- Modo 2: fetch directo a /api/sendBrief (necesita formData global) ----
  async function runDirectAPI(contactInfo, dataOverride) {
    log('=== Modo 2: fetch directo a /api/sendBrief ===');

    var data = dataOverride || TEST_DATA;
    Object.assign(formData, JSON.parse(JSON.stringify(data)));
    if (typeof save === 'function') save();

    var prompt = '';
    if (typeof generatePrompt === 'function') {
      prompt = generatePrompt();
      log('Prompt generated (' + prompt.length + ' chars)');
    } else {
      prompt = '# PROMPT MAESTRO - GENERACION DE SITIO WEB PROFESIONAL\nGenerado por E2E test';
      log('[WARN] generatePrompt() not found, using fallback prompt');
    }

    var payload = window.buildSendBriefPayload({
      name: contactInfo.name,
      email: contactInfo.email,
      company: contactInfo.company || '',
      phone: contactInfo.phone || '',
      prompt: prompt,
      formData: formData || data,
      source: 'direct-api'
    });

    return _sendPayload(payload);
  }

  // -- Modo 2 Standalone: sin dependencia de formData/DOM --------------------
  async function runDirectAPIStandalone(contactInfo, dataOverride) {
    log('=== Modo 2: Standalone (sin DOM) ===');

    var formDataPayload = {};
    var promptText = '';

    if (dataOverride) {
      if (dataOverride.prompt) {
        promptText = dataOverride.prompt;
        delete dataOverride.prompt;
      }
      if (dataOverride.formData) {
        formDataPayload = dataOverride.formData;
        delete dataOverride.formData;
      } else {
        formDataPayload = JSON.parse(JSON.stringify(dataOverride));
      }
    }

    if (!promptText) {
      promptText = '# PROMPT MAESTRO - GENERACION DE SITIO WEB PROFESIONAL\nGenerado por E2E Console test';
    }

    var payload = window.buildSendBriefPayload({
      name: contactInfo.name,
      email: contactInfo.email,
      company: contactInfo.company || '',
      phone: contactInfo.phone || '',
      prompt: promptText,
      formData: formDataPayload,
      source: 'standalone'
    });

    log('Payload built (standalone, no DOM)');
    log('  name: ' + payload.name);
    log('  email: ' + payload.email);
    log('  prompt length: ' + payload.prompt.length);

    return _sendPayload(payload);
  }

  // -- Helper de envio (compartido por Modo 2 y Standalone) ------------------
  async function _sendPayload(payload) {
    log('[SEND] Sending request to /api/sendBrief...');
    var startTime = Date.now();

    try {
      var response = await fetch('/api/sendBrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      var elapsed = Date.now() - startTime;
      var body = null;
      try { body = await response.clone().json(); } catch(e) { try { body = { raw: await response.clone().text() }; } catch(e2) { body = { raw: 'unreadable' }; } }

      log('[RECV] Response received (' + elapsed + 'ms)');
      log('  status: ' + response.status);
      log('  ok: ' + response.ok);

      var validation = { statusOk: false, hasRequestId: false, hasSuccess: false, errors: [] };

      if (response.status === 200 || response.status === 202) {
        validation.statusOk = true;
        log('[PASS] HTTP ' + response.status + ' OK');
      } else if (response.status === 429) {
        validation.errors.push('RATE_LIMITED');
        log('[WARN] HTTP 429 — Rate limited (expected under load)');
      } else {
        validation.errors.push('HTTP_' + response.status);
        log('[FAIL] HTTP ' + response.status + ' — unexpected status');
      }

      if (body && body.requestId) {
        validation.hasRequestId = true;
        log('[PASS] requestId: ' + body.requestId);
      } else {
        validation.errors.push('MISSING_REQUEST_ID');
        log('[FAIL] No requestId in response');
      }

      if (body && body.success === true) {
        validation.hasSuccess = true;
        log('[PASS] success: true');
      }

      validation.passed = validation.statusOk && validation.hasRequestId;

      if (validation.passed) {
        log('[RESULT] VALIDATION PASSED');
      } else {
        log('[RESULT] VALIDATION FAILED — ' + validation.errors.join(', '));
      }

      if (body && body.queuePosition !== undefined) log('  queuePosition: ' + body.queuePosition);
      if (body && body.queueDepth !== undefined) log('  queueDepth: ' + body.queueDepth);
      if (body && body.status) log('  status field: ' + body.status);
      log('  full body: ' + JSON.stringify(body));

      if (validation.passed) {
        log('[INFO] To inspect lifecycle: GET /api/sendBrief?id=' + body.requestId);
      }

      return { response: response, body: body, elapsed: elapsed, validation: validation };
    } catch (err) {
      log('[ERR] Network error: ' + err.message);
      throw err;
    }
  }

  // -- Entry Point -----------------------------------------------------------
  window.runBriefE2E = async function(mode, contactInfo, dataOverride) {
    mode = mode || 1;
    contactInfo = contactInfo || {
      name: 'Javier Ibrahim',
      email: 'contacto@ejemplo.com',
      company: 'Salmos Cafe',
      phone: '+52 663 150 8119'
    };

    log('========================================');
    log('E2E Brief Maestro - Bypass del Wizard');
    log('Mode: ' + mode + ' (1=submitContact, 2=direct API)');
    log('Contact: ' + contactInfo.name + ' <' + contactInfo.email + '>');
    log('========================================');

    var hasFormData = (typeof formData !== 'undefined');

    try {
      if (mode === 1) {
        if (!hasFormData) {
          log('[ERR] Mode 1 requires formData global (needs brief-maestro.html)');
          return;
        }
        runViaSubmitContact(contactInfo, dataOverride);
      } else {
        if (hasFormData) {
          return await runDirectAPI(contactInfo, dataOverride);
        } else {
          return await runDirectAPIStandalone(contactInfo, dataOverride);
        }
      }
    } catch (err) {
      log('[ERR] E2E test failed: ' + err.message);
      console.error(err);
    }
  };

  // -- Auto-repair loader ----------------------------------------------------
  window.ensureE2E = async function() {
    if (typeof window.runBriefE2E === 'function') return;
    await new Promise(function(resolve, reject) {
      var s = document.createElement('script');
      s.src = '/scripts/e2e-brief-bypass-wizard.js';
      s.onload = resolve;
      s.onerror = function() {
        console.error('[E2E-Brief] Failed to load script');
        reject(new Error('Failed to load e2e-brief-bypass-wizard.js'));
      };
      document.head.appendChild(s);
    });
  };

  // -- Console-safe API ------------------------------------------------------
  // Self-contained: builds payload directly, no routing through runBriefE2E(2).
  window.runBriefE2EConsole = async function(data) {
    await window.ensureE2E();
    log('=== runBriefE2EConsole (standalone) ===');

    var userPrompt = data.prompt || data.message || '';
    if (!userPrompt) {
      userPrompt = 'E2E validation prompt for brief submission testing';
    }

    var payload = window.buildSendBriefPayload({
      name: data.name || 'Test User',
      email: data.email || 'test@demo.com',
      company: data.company || 'Test Co',
      phone: data.phone || '',
      prompt: userPrompt,
      formData: data.formData || {},
      source: 'console'
    });

    return await _sendPayload(payload);
  };

  log('========================================');
  log('E2E Brief Maestro script loaded');
  log('');
  log('Usage:');
  log('  runBriefE2E(1)             -> Mode 1: submitContact() interno (needs DOM)');
  log('  runBriefE2E(2)             -> Mode 2: fetch directo a /api/sendBrief');
  log('  runBriefE2E(m, c, d)       -> Modo m, contacto c, dataOverride d');
  log('  runBriefE2EConsole({ name, email, company, message })  -> Desde cualquier pagina');
  log('');
  log('Ejemplo: runBriefE2E(2)');
  log('========================================');

})();
