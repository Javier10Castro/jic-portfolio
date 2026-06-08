function compile(promptMaestro) {
  const sections = parseSections(promptMaestro);

  return {
    project: {
      identity: buildIdentity(sections),
      structure: buildStructure(sections),
      ui: buildUI(sections),
      content: buildContent(sections),
      seo: buildSEO(sections),
      conversion: buildConversion(sections),
      assets: buildAssets(sections),
      rules: buildRules(sections)
    }
  };
}

function parseSections(text) {
  const lines = text.split('\n');
  const sections = {};
  let currentSection = null;
  let currentKey = null;
  let currentVal = [];

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(\d+)\.\s+(.+)/);
    if (sectionMatch) {
      if (currentSection && currentKey) {
        saveField(sections, currentSection, currentKey, currentVal);
      }
      currentSection = sectionMatch[2].trim();
      currentKey = null;
      currentVal = [];
      continue;
    }

    const fieldMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)/);
    if (fieldMatch && currentSection) {
      if (currentKey) saveField(sections, currentSection, currentKey, currentVal);
      currentKey = fieldMatch[1].trim();
      currentVal = [fieldMatch[2].trim()];
    } else if (currentKey && line.trim()) {
      currentVal.push(line.trim());
    }
  }

  if (currentSection && currentKey) saveField(sections, currentSection, currentKey, currentVal);
  return sections;
}

function saveField(sections, section, key, val) {
  if (!sections[section]) sections[section] = {};
  const joined = val.join(' ').replace(/\s+/g, ' ').trim();
  sections[section][key] = joined && joined !== 'No especificado' ? joined : null;
}

function get(sections, sectionName, key) {
  for (const [name, fields] of Object.entries(sections)) {
    if (name.toLowerCase().includes(sectionName.toLowerCase())) {
      return fields[key] || null;
    }
  }
  return null;
}

function getAll(sections, sectionName) {
  for (const [name, fields] of Object.entries(sections)) {
    if (name.toLowerCase().includes(sectionName.toLowerCase())) {
      return fields;
    }
  }
  return {};
}

function buildIdentity(sections) {
  const biz = getAll(sections, 'NEGOCIO');
  const branding = getAll(sections, 'BRANDING');
  const essence = getAll(sections, 'ESENCIA');
  const obj = getAll(sections, 'OBJETIVOS');
  return {
    business_name: biz['Empresa'] || null,
    tagline: biz['Eslogan/Tagline'] || null,
    story: biz['Historia'] || null,
    mission: biz['Misión'] || null,
    vision: biz['Visión'] || null,
    values: splitList(biz['Valores corporativos']),
    differentiators: biz['Diferenciadores clave'] || null,
    personality: splitList(biz['Personalidad de marca']),
    main_goal: obj['Objetivo principal'] || null,
    brand_persona: essence['Personalidad de marca (metáfora)'] || null,
    first_5s_emotion: essence['Primeros 5 segundos'] || null,
    unique_difference: essence['Diferenciador real profundo'] || null,
    cultural_reference: essence['Referente cultural/metáfora'] || null
  };
}

function buildStructure(sections) {
  const arch = getAll(sections, 'ARQUITECTURA');
  const obj = getAll(sections, 'OBJETIVOS');
  return {
    pages: splitList(arch['Páginas requeridas']),
    special_pages: arch['Páginas especiales'] || null,
    priority_pages: arch['Páginas prioritarias'] || null,
    user_flow: arch['Flujo de usuario ideal'] || null,
    main_conversion: obj['Conversión principal deseada'] || null
  };
}

function buildUI(sections) {
  const branding = getAll(sections, 'BRANDING');
  const refs = getAll(sections, 'REFERENCIAS');
  return {
    logo_status: branding['Estado del logotipo'] || null,
    color_palette: branding['Paleta de colores'] || null,
    typography: branding['Tipografías'] || null,
    visual_style: splitList(branding['Estilo visual deseado']),
    emotions: splitList(branding['Emociones a transmitir']),
    sophistication: branding['Nivel de sofisticación'] || null,
    forbidden_elements: branding['Elementos prohibidos'] || null,
    liked_sites: refs['Sitios favoritos'] || null,
    disliked_sites: refs['Sitios que no le gustan'] || null,
    brand_references: refs['Marcas de referencia'] || null,
    design_words: refs['Tres palabras del diseño'] || null
  };
}

function buildContent(sections) {
  const content = getAll(sections, 'CONTENIDO');
  const services = getAll(sections, 'PRODUCTOS');
  const pub = getAll(sections, 'PÚBLICO');
  return {
    existing_texts: content['Textos existentes'] || null,
    professional_photos: content['Fotografías profesionales'] || null,
    video_material: content['Material en video'] || null,
    downloadable_resources: content['Recursos descargables'] || null,
    service_list: services['Lista de servicios/productos'] || null,
    flagship_service: services['Servicio estrella'] || null,
    benefits: services['Beneficios principales'] || null,
    work_process: services['Proceso de trabajo'] || null,
    pricing_strategy: services['Estrategia de precios'] || null,
    ideal_client: pub['Cliente ideal'] || null,
    client_problems: pub['Problemas que resuelve'] || null,
    motivations: pub['Motivaciones de compra'] || null,
    objections: pub['Objeciones principales'] || null,
    decision_process: pub['Proceso de decisión'] || null,
    discovery_channels: splitList(pub['Canales de descubrimiento'])
  };
}

function buildSEO(sections) {
  const seo = getAll(sections, 'ESTRATEGIA SEO');
  const obj = getAll(sections, 'OBJETIVOS');
  return {
    keywords: splitList(seo['Palabras clave']),
    locations: splitList(seo['Ubicaciones geográficas']),
    competitor_analysis: seo['Competencia SEO'] || null,
    content_strategy: seo['Estrategia de contenidos'] || null,
    kpis: obj['KPIs de éxito'] || null
  };
}

function buildConversion(sections) {
  const conv = getAll(sections, 'CONVERSIÓN');
  const obj = getAll(sections, 'OBJETIVOS');
  return {
    main_cta: conv['CTA principal'] || null,
    special_offer: conv['Oferta/garantía especial'] || null,
    lead_magnet: conv['Lead magnet'] || null,
    urgency: conv['Urgencia/escasez'] || null,
    follow_up: conv['Seguimiento post-contacto'] || null,
    secondary_objectives: splitList(obj['Objetivos secundarios']),
    timeline: obj['Plazo para resultados'] || null
  };
}

function buildAssets(sections) {
  const funcs = getAll(sections, 'FUNCIONALIDADES');
  const comp = getAll(sections, 'SITUACIÓN');
  const social = getAll(sections, 'PRUEBA SOCIAL');
  return {
    basic_features: splitList(funcs['Básicas']),
    advanced_features: splitList(funcs['Avanzadas']),
    tools: funcs['Herramientas a integrar'] || null,
    site_admin: funcs['Administrador del sitio'] || null,
    current_site_url: comp['Sitio web actual'] || null,
    current_problems: splitList(comp['Problemas actuales']),
    testimonials: social['Testimonios'] || null,
    statistics: social['Estadísticas/métricas'] || null,
    client_logos: social['Clientes/marcas importantes'] || null,
    certifications: social['Certificaciones y premios'] || null,
    case_studies: social['Casos de éxito'] || null
  };
}

function buildRules(sections) {
  const essence = getAll(sections, 'ESENCIA');
  const branding = getAll(sections, 'BRANDING');
  return {
    forbidden_visuals: essence['Elementos siempre prohibidos'] || branding['Elementos prohibidos'] || null,
    additional_context: essence['Contexto adicional'] || null,
    design_words: getAll(sections, 'REFERENCIAS')['Tres palabras del diseño'] || null
  };
}

function splitList(val) {
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

module.exports = { compile };
