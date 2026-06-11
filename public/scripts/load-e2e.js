// =============================================================================
// E2E Loader v1 — Carga e2e-brief-bypass-wizard.js y expone helpers
//
// Solo activo cuando se carga manualmente desde consola:
//   fetch('/scripts/load-e2e.js').then(r => r.text()).then(eval)
//
// No se referencia desde ningun HTML — sin riesgo en produccion.
// =============================================================================
// NOTA: Este archivo usa solo ASCII. Sin emojis, sin box-drawing,
// sin Unicode fuera del rango basico.
// =============================================================================

(function() {
  'use strict';

  var LOG_PFX = '[E2E]';
  var log = function(msg) {
    console.log(LOG_PFX + ' ' + msg);
  };

  // -- Salmos Cafe test data (copia de e2e-brief-bypass-wizard.js) ----------
  var SALMOS_DATA = {
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

  // -- Inkognita Agency test data -------------------------------------------
  var INKOGNITA_DATA = {
    biz_name: 'Inkognita Agency',
    biz_tagline: 'Estrategia digital con identidad',
    biz_history: 'Inkognita nacio en 2022 como un estudio boutique de branding y desarrollo web. Fundado por un equipo de disenadores y desarrolladores que creian que la identidad de marca merecia mas que plantillas genericas. Hoy trabajamos con startups y empresas en expansion que buscan destacar en el entorno digital.',
    biz_mision: 'Construir identidades digitales que conecten emocionalmente con las audiencias y generen resultados medibles.',
    biz_vision: 'Ser la agencia de referencia para marcas que buscan una identidad digital autentica y diferenciada en Latinoamerica.',
    biz_valores: ['Creatividad', 'Autenticidad', 'Resultados', 'Transparencia', 'Innovacion'],
    biz_diferenciadores: 'Enfoque en identidad de marca, diseno data-driven, equipo multidisciplinario, procesos agiles.',
    biz_personalidad: ['Audaz y creativo', 'Profesional y serio', 'Moderno y tecnologico'],
    biz_contacto: 'hola@inkognita.agency | Whatsapp: +52 55 1234 5678',
    biz_redes: 'Instagram: @inkognita.agency | LinkedIn: /company/inkognita-agency',
    obj_principal: 'Generar leads B2B calificados',
    obj_secundarios: ['Posicionar autoridad en branding digital', 'Atraer talento creative', 'Educar al mercado sobre identidad de marca'],
    obj_kpis: 'Solicitudes de cotizacion, descargas de portafolio, tiempo en sitio, formularios de contacto.',
    obj_conversion: 'Solicitar cotizacion de proyecto',
    obj_plazo: '6-12 meses',
    comp_sitio: 'https://inkognita.agency',
    comp_problemas: ['Diseno desactualizado', 'Poca presencia en redes', 'Falta de casos de exito visibles'],
    comp_directos: 'Brando Studio, Taller 11, Marca Digital MX, Agencia Pulpo',
    comp_aspiracionales: 'Media.Monks, VML, Tribal Worldwide',
    comp_oportunidades: 'Diferenciarse con procesos transparentes, diseno conceptual fuerte y presencia regional.',
    pub_ideal: 'Fundadores de startups, directores de marketing en PYMES, emprendedores en serie.',
    pub_problemas: 'Su marca actual no refleja el valor real de su negocio. Tienen dificultad para conectar con su audiencia ideal.',
    pub_motivaciones: 'Diferenciarse de competidores, escalar su negocio, atraer inversion, profesionalizar su imagen.',
    pub_objeciones: 'Presupuesto, tiempo de entrega, alcance del proyecto, retorno de inversion.',
    pub_decision: 'Solicita portafolio, revisa casos de exito, agenda llamada de descubrimiento.',
    pub_canales: ['LinkedIn', 'Instagram', 'Google Ads', 'Recomendaciones', 'Medium/blog'],
    brand_logo: 'Si, tengo logotipo definido pero planeamos actualizarlo',
    brand_tipografia: 'Variable, sans-serif con personalidad como Satoshi o Cabinet Grotesk.',
    brand_estilo: ['Audaz y llamativo', 'Minimalista y limpio', 'Moderno y tecnologico'],
    brand_emociones: ['Innovacion y vanguardia', 'Confianza y seguridad', 'Creatividad y originalidad', 'Profesionalismo y seriedad'],
    brand_prohibido: 'Estilos corporativos tradicionales, tono formal y distante.',
    brand_nivel: 3,
    branding_colors: { primary: '#6C2BD9', secondary: '#0A0A0A', accent: '#FF6B35', palette: ['#0A0A0A', '#6C2BD9', '#FF6B35', '#FFFFFF'] },
    brand_colores: 'Primary: #6C2BD9 | Secondary: #0A0A0A | Accent: #FF6B35',
    arq_paginas: ['Inicio', 'Portafolio', 'Servicios', 'Metodologia', 'Blog/Recursos', 'Contacto'],
    arq_extras: 'Area de clientes con login',
    arq_prioridad: 'Inicio, Portafolio, Servicios',
    arq_flujo: 'Inicio -> Portafolio -> Servicios -> Contacto',
    cont_textos: 'Redactados parcialmente, necesitan edicion profesional',
    cont_fotos: 'Sesion fotografica profesional del equipo',
    cont_videos: 'Showreel de proyectos en produccion',
    cont_recursos: 'Case studies descargables en PDF',
    serv_lista: 'Branding, diseno web, estrategia de contenido, identidad visual, consultoria de marca.',
    serv_estrella: 'Branding digital completo',
    serv_beneficios: 'Identidad coherente, diferenciacion competitiva, conexion emocional con audiencias.',
    serv_proceso: '1. Descubrimiento 2. Estrategia 3. Diseno conceptual 4. Desarrollo 5. Iteracion 6. Entrega',
    serv_precio: 'Desde $15,000 MXN por proyecto',
    social_testimonios: 'Clientes destacan la calidad del diseno y la cercania del equipo.',
    social_numeros: '24 proyectos entregados, 18 clientes activos, 4.9/5 calificacion promedio.',
    social_clientes: 'Startups tech, restaurantes, centros culturales.',
    social_cert: 'Google Partner (en tramite)',
    social_casos: 'Case studies detallados con metricas',
    func_basicas: ['Formulario de contacto', 'WhatsApp flotante', 'Galeria de proyectos', 'Filtro por categoria'],
    func_avanzadas: ['Chatbot de calificacion', 'Cotizador automatico'],
    func_herramientas: '',
    func_cms: 'Cliente via CMS sencillo',
    seo_keywords: ['agencia de branding', 'diseno web mexico', 'identidad de marca', 'branding digital', 'agencia creativa'],
    seo_geo: ['Mexico', 'CDMX', 'Monterrey', 'Guadalajara', 'Latinoamerica'],
    seo_competencia: '',
    seo_blog: 'Blog semanal sobre branding y diseno',
    ref_favoritos: 'Agencias con portafolio visual impactante, diseno inmersivo y narrativa de marca fuerte.',
    ref_odio: 'Sitios corporativos lentos, genericos y con fotos de stock.',
    ref_marcas: 'Apple, Stripe, Linear',
    ref_palabras: 'Audaz, Autentico, Innovador',
    conv_cta: 'Cotiza tu proyecto',
    conv_oferta: 'Consulta inicial gratuita de 30 min',
    conv_lead: '',
    conv_urgencia: 'Cupo limitado: 3 proyectos por mes',
    conv_seguimiento: 'Email de seguimiento a las 24h, llamada a las 72h si no hay respuesta.',
    ai_persona: 'Un estratega creativo apasionado, directo y seguro, que habla con la experiencia de quien ha construido marcas desde cero.',
    ai_5seg: 'Creatividad, estrategia y resultados medibles.',
    ai_diferencia: 'No solo disenamos; construimos identidades que conectan, comunican y convierten.',
    ai_prohibido: 'Lenguaje corporativo vacio, promesas genericas, jerga tecnica innecesaria.',
    ai_metafora: 'Como un traje a la medida: cada marca merece una identidad que le quede perfecta, hecha con los materiales correctos y el ajuste preciso.',
    ai_extra: 'Buscamos proyectos que nos desafien creativamente y nos permitan dejar una huella.'
  };

  // -- Cargar el script base E2E dinamicamente -------------------------------
  function loadBaseScript() {
    return new Promise(function(resolve, reject) {
      if (typeof window.runBriefE2E === 'function') {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = '/scripts/e2e-brief-bypass-wizard.js';
      script.onload = resolve;
      script.onerror = function() {
        log('[ERR] No se pudo cargar e2e-brief-bypass-wizard.js');
        log('  Verifica que el archivo exista en /public/scripts/');
        reject(new Error('Failed to load e2e-brief-bypass-wizard.js'));
      };
      document.head.appendChild(script);
    });
  }

  // -- Poblar formData -------------------------------------------------------
  function loadFormData(data) {
    if (typeof formData === 'undefined') {
      log('[ERR] formData no encontrado. Debes ejecutar desde brief-maestro.html');
      return false;
    }
    Object.assign(formData, JSON.parse(JSON.stringify(data)));
    if (typeof save === 'function') save();
    return true;
  }

  // -- Helpers ----------------------------------------------------------------

  // e2eSalmos()
  window.e2eSalmos = async function(contactInfo) {
    log('Loading test data...');
    await loadBaseScript();
    loadFormData(SALMOS_DATA);
    log('Generating prompt...');
    log('Sending request...');
    var result = await runBriefE2E(2, contactInfo || {
      name: 'Javier Ibrahim',
      email: 'contacto@salmoscafe.com',
      company: 'Salmos Cafe'
    }, SALMOS_DATA);
    log('Request completed.');
    return result;
  };

  // e2eInkognita()
  window.e2eInkognita = async function(contactInfo) {
    log('Loading test data...');
    await loadBaseScript();
    loadFormData(INKOGNITA_DATA);
    log('Generating prompt...');
    log('Sending request...');
    var result = await runBriefE2E(2, contactInfo || {
      name: 'Marco Reyes',
      email: 'marco@inkognita.agency',
      company: 'Inkognita Agency'
    }, INKOGNITA_DATA);
    log('Request completed.');
    return result;
  };

  // e2eCustom({ name, email, company?, phone?, formData? })
  window.e2eCustom = async function(opts) {
    opts = opts || {};
    log('Loading test data...');
    await loadBaseScript();
    var customData = opts.formData || SALMOS_DATA;
    loadFormData(customData);
    log('Generating prompt...');
    log('Sending request...');
    var result = await runBriefE2E(2, {
      name: opts.name || 'Test User',
      email: opts.email || 'test@example.com',
      company: opts.company || '',
      phone: opts.phone || ''
    }, customData);
    log('Request completed.');
    return result;
  };

  // showCurrentFormData()
  window.showCurrentFormData = function() {
    if (typeof formData === 'undefined') {
      log('[ERR] formData no encontrado. Debes ejecutar desde brief-maestro.html');
      return null;
    }
    console.log(LOG_PFX + ' current formData (' + Object.keys(formData).length + ' keys):');
    console.table(formData);
    return formData;
  };

  // clearFormData()
  window.clearFormData = function() {
    if (typeof formData === 'undefined') {
      log('[ERR] formData no encontrado. Debes ejecutar desde brief-maestro.html');
      return;
    }
    for (var key in formData) {
      if (formData.hasOwnProperty(key)) {
        var val = formData[key];
        if (Array.isArray(val)) {
          formData[key] = [];
        } else if (typeof val === 'string') {
          formData[key] = '';
        } else if (typeof val === 'number') {
          formData[key] = 0;
        } else if (typeof val === 'object' && val !== null) {
          formData[key] = {};
        }
      }
    }
    if (typeof save === 'function') save();
    log('formData cleared (' + Object.keys(formData).length + ' keys reset).');
  };

  // -- Startup log -----------------------------------------------------------
  log('==============================');
  log('  E2E Loader v1 loaded');
  log('');
  log('  Helpers disponibles:');
  log('  e2eSalmos()            Envia brief con datos de Salmos Cafe');
  log('  e2eInkognita()         Envia brief con datos de Inkognita Agency');
  log('  e2eCustom({...})       Envia brief con datos personalizados');
  log('  showCurrentFormData()  Inspecciona formData actual');
  log('  clearFormData()        Resetea formData');
  log('');
  log('  Uso:');
  log('  e2eSalmos()');
  log('  e2eInkognita({ name: "...", email: "..." })');
  log('  e2eCustom({ name: "X", email: "y@z.com", formData: {...} })');
  log('');
  log('  requestId se muestra en la respuesta.');
  log('  Para inspeccion lifecycle:');
  log('  GET /api/sendBrief?id=<requestId>');
  log('==============================');

})();
