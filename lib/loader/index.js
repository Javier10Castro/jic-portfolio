const fs = require('fs');
const path = require('path');
const { query } = require('../db');

const DECISIONS_FILE = path.resolve(__dirname, '../../data/decisions.json');
const PROJECT_FIELDS = ['id', 'project_id', 'name', 'email', 'company', 'phone', 'status', 'created_at'];

const SECTION_TITLES = {
  business: ['\u00bfQui\u00e9n eres?', null],
  goals: ['\u00bfQu\u00e9 quieres lograr?', 'What do you want to achieve?'],
  competition: ['Competencia y situaci\u00f3n actual', 'Competition & current situation'],
  audience: ['\u00bfA qui\u00e9n te diriges?', 'Who are you targeting?'],
  branding: ['Branding e identidad visual', 'Branding & visual identity'],
  site: ['Arquitectura del sitio', 'Site architecture'],
  content: ['Contenido disponible', 'Available content'],
  services: ['Productos y servicios', 'Products & services'],
  social_proof: ['Prueba social', 'Social proof'],
  functionality: ['Funcionalidades', 'Functionalities'],
  seo: ['Estrategia SEO', 'SEO strategy'],
  references: ['Referencias visuales', 'Visual references'],
  conversion: ['Estrategia de conversi\u00f3n', 'Conversion strategy'],
  essence: ['La esencia de tu marca', 'The essence of your brand'],
};

const FIELD_LABELS = {
  biz_name: { es: 'Nombre del negocio', en: 'Business name' },
  biz_tagline: { es: 'Eslogan', en: 'Tagline' },
  biz_history: { es: 'Historia', en: 'History' },
  biz_mision: { es: 'Misi\u00f3n', en: 'Mission' },
  biz_vision: { es: 'Visi\u00f3n', en: 'Vision' },
  biz_valores: { es: 'Valores', en: 'Values' },
  biz_diferenciadores: { es: 'Diferenciadores', en: 'Differentiators' },
  biz_personalidad: { es: 'Personalidad', en: 'Personality' },
  biz_contacto: { es: 'Contacto', en: 'Contact' },
  biz_redes: { es: 'Redes sociales', en: 'Social media' },
  obj_principal: { es: 'Objetivo principal', en: 'Main objective' },
  obj_secundarios: { es: 'Objetivos secundarios', en: 'Secondary objectives' },
  obj_kpis: { es: 'KPIs', en: 'KPIs' },
  obj_conversion: { es: 'Objetivo de conversi\u00f3n', en: 'Conversion goal' },
  obj_plazo: { es: 'Plazo', en: 'Timeline' },
  comp_sitio: { es: 'Sitio actual', en: 'Current site' },
  comp_problemas: { es: 'Problemas actuales', en: 'Current problems' },
  comp_directos: { es: 'Competidores directos', en: 'Direct competitors' },
  comp_aspiracionales: { es: 'Referentes aspiracionales', en: 'Aspirational references' },
  comp_oportunidades: { es: 'Oportunidades', en: 'Opportunities' },
  pub_ideal: { es: 'Cliente ideal', en: 'Ideal client' },
  pub_problemas: { es: 'Problemas del cliente', en: 'Client problems' },
  pub_motivaciones: { es: 'Motivaciones', en: 'Motivations' },
  pub_objeciones: { es: 'Objeciones', en: 'Objections' },
  pub_decision: { es: 'Comportamiento de compra', en: 'Buying behavior' },
  pub_canales: { es: 'Canales', en: 'Channels' },
  brand_logo: { es: 'Estado del logo', en: 'Logo status' },
  brand_colores: { es: 'Colores', en: 'Colors' },
  brand_tipografia: { es: 'Tipograf\u00eda', en: 'Typography' },
  brand_estilo: { es: 'Estilo visual', en: 'Visual style' },
  brand_emociones: { es: 'Emociones', en: 'Emotions' },
  brand_prohibido: { es: 'Elementos prohibidos', en: 'Forbidden elements' },
  brand_nivel: { es: 'Nivel de sofisticaci\u00f3n', en: 'Sophistication level' },
  arq_paginas: { es: 'P\u00e1ginas', en: 'Pages' },
  arq_extras: { es: 'P\u00e1ginas extra', en: 'Extra pages' },
  arq_prioridad: { es: 'P\u00e1ginas prioritarias', en: 'Priority pages' },
  arq_flujo: { es: 'Flujo de usuario', en: 'User flow' },
  cont_textos: { es: 'Textos disponibles', en: 'Available texts' },
  cont_fotos: { es: 'Fotos disponibles', en: 'Available photos' },
  cont_videos: { es: 'Videos disponibles', en: 'Available videos' },
  cont_recursos: { es: 'Recursos adicionales', en: 'Additional resources' },
  serv_lista: { es: 'Lista de servicios', en: 'Service list' },
  serv_estrella: { es: 'Servicio estrella', en: 'Star service' },
  serv_beneficios: { es: 'Beneficios', en: 'Benefits' },
  serv_proceso: { es: 'Proceso de venta', en: 'Sales process' },
  serv_precio: { es: 'Modelo de precio', en: 'Pricing model' },
  social_testimonios: { es: 'Testimonios', en: 'Testimonials' },
  social_numeros: { es: 'N\u00fameros clave', en: 'Key numbers' },
  social_clientes: { es: 'Clientes destacados', en: 'Featured clients' },
  social_cert: { es: 'Certificaciones', en: 'Certifications' },
  social_casos: { es: 'Casos de \u00e9xito', en: 'Case studies' },
  func_basicas: { es: 'Funcionalidades b\u00e1sicas', en: 'Basic functionalities' },
  func_avanzadas: { es: 'Funcionalidades avanzadas', en: 'Advanced functionalities' },
  func_herramientas: { es: 'Herramientas', en: 'Tools' },
  func_cms: { es: 'CMS deseado', en: 'Desired CMS' },
  seo_keywords: { es: 'Palabras clave', en: 'Keywords' },
  seo_geo: { es: 'Zona geogr\u00e1fica', en: 'Geographic area' },
  seo_competencia: { es: 'Competencia SEO', en: 'SEO competition' },
  seo_blog: { es: 'Blog / contenido', en: 'Blog / content' },
  ref_favoritos: { es: 'Sitios favoritos', en: 'Favorite sites' },
  ref_odio: { es: 'Sitios que no te gustan', en: 'Sites you dislike' },
  ref_marcas: { es: 'Marcas de referencia', en: 'Reference brands' },
  ref_palabras: { es: 'Palabras clave de marca', en: 'Brand keywords' },
  conv_cta: { es: 'CTA principal', en: 'Main CTA' },
  conv_oferta: { es: 'Oferta / lead magnet', en: 'Offer / lead magnet' },
  conv_lead: { es: 'Captura de leads', en: 'Lead capture' },
  conv_urgencia: { es: 'Urgencia / escasez', en: 'Urgency / scarcity' },
  conv_seguimiento: { es: 'Seguimiento', en: 'Follow-up' },
  ai_persona: { es: 'Personalidad de marca', en: 'Brand personality' },
  ai_5seg: { es: 'Primeros 5 segundos', en: 'First 5 seconds' },
  ai_diferencia: { es: 'Diferenciador profundo', en: 'Deep differentiator' },
  ai_prohibido: { es: 'Lo que NO eres', en: 'What you are NOT' },
  ai_metafora: { es: 'Met\u00e1fora de marca', en: 'Brand metaphor' },
  ai_extra: { es: 'Algo m\u00e1s', en: 'Anything else' },
};

function readDecisions() {
  try {
    if (!fs.existsSync(DECISIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(DECISIONS_FILE, 'utf-8'));
  } catch { return []; }
}

async function loadProject(projectId) {
  if (!projectId) throw new Error('projectId is required');

  const responses = await query(
    'SELECT * FROM form_responses WHERE project_id = $1 ORDER BY section, field_key',
    [projectId]
  );
  const rows = responses.rows;

  const grouped = {};
  const meta = { project_id: projectId, field_count: 0, sections: [] };

  for (const row of rows) {
    if (!grouped[row.section]) {
      grouped[row.section] = {};
      meta.sections.push(row.section);
    }
    grouped[row.section][row.field_key] = row.value;
    meta.field_count++;

    if (row.field_key === 'biz_name' && !meta.name) meta.name = row.value;
    if (row.field_key === 'biz_contacto' && !meta.email) meta.email = row.value;
  }

  return { meta, responses: rows, grouped };
}

async function rebuildPromptMaestro(projectId, lang) {
  const data = await loadProject(projectId);
  if (data.responses.length === 0) return null;

  const isES = lang !== 'en';
  const lines = [];
  let sectionIndex = 0;
  const orderedSections = Object.keys(SECTION_TITLES);

  for (const section of orderedSections) {
    const fields = data.grouped[section];
    if (!fields) continue;

    sectionIndex++;
    const title = SECTION_TITLES[section];
    const sectionTitle = title && title[0] ? (isES ? title[0] : title[1] || title[0]) : section;
    lines.push(`## ${sectionIndex}. ${sectionTitle.toUpperCase()}`);

    for (const [fieldKey, value] of Object.entries(fields)) {
      if (!value) continue;
      const label = FIELD_LABELS[fieldKey];
      const displayKey = label ? (isES ? label.es : label.en) : fieldKey;
      lines.push(`**${displayKey}:** ${value}`);
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}

async function getProjectState(projectId) {
  if (!projectId) throw new Error('projectId is required');

  const data = await loadProject(projectId);
  const decisions = readDecisions();

  let executionHistory = [];
  try {
    const execResult = await query(
      'SELECT * FROM executions WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    executionHistory = execResult.rows;
  } catch {
    executionHistory = [];
  }

  let projectMeta = null;
  try {
    const projResult = await query(
      'SELECT * FROM projects WHERE project_id = $1 LIMIT 1',
      [projectId]
    );
    projectMeta = projResult.rows[0] || null;
  } catch {
    projectMeta = null;
  }

  return {
    project: projectMeta || { project_id: projectId, name: data.meta.name || 'unknown' },
    form_responses: data,
    execution_history: executionHistory,
    decisions: decisions.filter(d =>
      d.modules_affected && d.modules_affected.some(m => m.includes(projectId) || m.includes('formResponses'))
    ),
    timestamp: new Date().toISOString(),
  };
}

async function listProjects() {
  const result = await query(
    'SELECT DISTINCT project_id FROM form_responses ORDER BY project_id'
  );
  const projects = [];
  for (const row of result.rows) {
    const data = await loadProject(row.project_id);
    projects.push(data.meta);
  }
  return projects;
}

module.exports = { loadProject, rebuildPromptMaestro, getProjectState, listProjects };
