function compile(raw) {
  const normalized = normalize(raw);
  const sections = extractSections(normalized);
  return buildOutput(sections);
}

// ─── NORMALIZATION LAYER ────────────────────────────────────────────────────

const SPELLING_MAP = {
  'formurario': 'formulario',
  'formulario': 'formulario',
  'cotisasiones': 'cotizaciones',
  'cotizaciones': 'cotizaciones',
  'paguina': 'página',
  'pagina': 'página',
  'empresa': 'empresa',
  'telefono': 'teléfono',
  'correo': 'correo',
  'direccion': 'dirección',
  'usuario': 'usuario',
  'contraseña': 'contraseña',
};

function normalize(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => {
      let l = line.trim();
      if (l.startsWith('**') && l.includes(':** ')) {
        l = l.replace(/^\*\*(.+?):\*\*\s*/, '$1: ');
      }
      if (l.startsWith('- ')) l = l.substring(2);
      if (l.match(/^(#+)\s/)) l = l.replace(/^#+\s*/, '## ');
      if (l.match(/^[A-Z][A-Z\s]+:/) && !l.match(/^##/)) {
        l = '## ' + l;
      }
      return l;
    })
    .filter(line => line)
    .join('\n');
}

function spellCorrect(val) {
  if (!val) return val;
  return val.split(/\b/).map(word => {
    const lower = word.toLowerCase().trim();
    return SPELLING_MAP[lower] || word;
  }).join('');
}

// ─── SECTION EXTRACTION ─────────────────────────────────────────────────────

function extractSections(text) {
  const lines = text.split('\n');
  const raw = {};
  let currentSection = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s*(\d+)?\.?\s*(.+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[2].trim();
      continue;
    }

    const fieldMatch = line.match(/^(.+?):\s*(.*)/);
    if (fieldMatch && currentSection) {
      const key = normalizeKey(fieldMatch[1].trim());
      let val = spellCorrect(fieldMatch[2].trim());
      if (val.toLowerCase() === 'undefined' || val.toLowerCase() === 'none') val = '';
      if (!raw[currentSection]) raw[currentSection] = {};

      if (hasNestedFields(val)) {
        const nested = unpackNested(val);
        for (const [nk, nv] of Object.entries(nested)) {
          if (!raw[currentSection][nk]) raw[currentSection][nk] = nv;
        }
      }

      if (!raw[currentSection][key]) {
        raw[currentSection][key] = val;
      }
    }
  }

  return raw;
}

function hasNestedFields(val) {
  return /,\s*\w+\s*:/.test(val) || /,\s*\w+\s*:\s*(yes|no|true|false)\b/i.test(val);
}

function unpackNested(val) {
  const result = {};
  const parts = val.split(',');
  for (const part of parts) {
    const m = part.match(/^\s*(.+?):\s*(.*)/);
    if (m) {
      result[normalizeKey(m[1].trim())] = m[2].trim();
    }
  }
  return result;
}

function normalizeKey(key) {
  return key
    .replace(/[_\s]+/g, '_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
}

// ─── RAW UNDERSTANDING ──────────────────────────────────────────────────────

function detectName(raw, sections) {
  const candidates = [
    find(raw, 'name'),
    find(raw, 'empresa'),
    find(raw, 'business_name'),
    find(raw, 'company'),
    find(raw, 'cliente'),
    find(raw, 'client_name'),
  ];
  return firstValue(candidates) || null;
}

function detectTagline(raw, sections) {
  return find(raw, 'tagline') || find(raw, 'eslogan') || null;
}

function detectHistory(raw, sections) {
  return find(raw, 'history') || find(raw, 'historia') || null;
}

function detectMission(raw, sections) {
  const v = find(raw, 'mission') || find(raw, 'mision');
  return (v && v.toLowerCase() !== 'undefined') ? v : null;
}

function detectVision(raw, sections) {
  const v = find(raw, 'vision');
  return (v && v.toLowerCase() !== 'undefined') ? v : null;
}

function detectValues(raw, sections) {
  const v = find(raw, 'values') || find(raw, 'valores') || find(raw, 'valores_corporativos');
  return splitList(v);
}

function detectPersonality(raw, sections) {
  const v = find(raw, 'personality') || find(raw, 'personalidad') || find(raw, 'personalidad_de_marca');
  return splitList(v);
}

function detectDifferentiator(raw, sections) {
  return find(raw, 'differentiator') || find(raw, 'diferenciador') || find(raw, 'diferenciadores_clave') || find(raw, 'deep_differentiator') || find(raw, 'unique_difference') || null;
}

function detectMainObjective(raw, sections) {
  return find(raw, 'main_objective') || find(raw, 'objetivo_principal') || find(raw, 'main_goal') || null;
}

function detectSecondaryObjectives(raw, sections) {
  const v = find(raw, 'secondary_objectives') || find(raw, 'objetivos_secundarios');
  return splitList(v);
}

function detectKPI(raw, sections) {
  return find(raw, 'kpi') || find(raw, 'kpis') || find(raw, 'kpis_de_éxito') || null;
}

function detectTimeline(raw, sections) {
  return find(raw, 'timeline') || find(raw, 'plazo') || find(raw, 'plazo_para_resultados') || null;
}

function detectConversionGoal(raw, sections) {
  return find(raw, 'conversion_goal') || find(raw, 'conversión_principal_deseada') || find(raw, 'main_conversion') || null;
}

function detectPrimaryAudience(raw, sections) {
  return find(raw, 'primary_audience') || find(raw, 'público_objetivo') || find(raw, 'cliente_ideal') || find(raw, 'pub_ideal') || null;
}

function detectPainPoints(raw, sections) {
  const v = find(raw, 'pain_points') || find(raw, 'problemas') || find(raw, 'problemas_que_resuelve') || find(raw, 'objeciones');
  return splitList(v);
}

function detectMotivations(raw, sections) {
  const v = find(raw, 'motivations') || find(raw, 'motivaciones') || find(raw, 'motivaciones_de_compra');
  return splitList(v);
}

function detectDecisionBehavior(raw, sections) {
  return find(raw, 'decision_behavior') || find(raw, 'proceso_de_decisión') || find(raw, 'decision_process') || null;
}

function detectChannels(raw, sections) {
  const v = find(raw, 'channel') || find(raw, 'canales') || find(raw, 'canales_de_descubrimiento') || find(raw, 'discovery_channels');
  return splitList(v);
}

function detectColors(raw, sections) {
  const v = find(raw, 'colors') || find(raw, 'colores') || find(raw, 'paleta_de_colores');
  return splitList(v);
}

function detectVisualStyle(raw, sections) {
  const v = find(raw, 'visual_style') || find(raw, 'estilo_visual_deseado') || find(raw, 'estilo_visual') || find(raw, 'brand_estilo');
  return splitList(v);
}

function detectTypography(raw, sections) {
  return find(raw, 'typography') || find(raw, 'typography_style') || find(raw, 'tipografías') || find(raw, 'tipografia') || null;
}

function detectEmotions(raw, sections) {
  const v = find(raw, 'emotions') || find(raw, 'emociones') || find(raw, 'emociones_a_transmitir');
  return splitList(v);
}

function detectForbidden(raw, sections) {
  const v = find(raw, 'forbidden_elements') || find(raw, 'elementos_prohibidos') || find(raw, 'brand_prohibido') || find(raw, 'prohibido');
  return splitList(v);
}

function detectSophistication(raw, sections) {
  const v = find(raw, 'sophistication_level') || find(raw, 'nivel_de_sofisticación') || find(raw, 'brand_nivel');
  if (!v) return 0;
  const m = v.toString().match(/(\d+)/);
  return m ? Math.min(5, Math.max(0, parseInt(m[1]))) : 0;
}

function detectPages(raw, sections) {
  const v = find(raw, 'pages') || find(raw, 'páginas') || find(raw, 'páginas_requeridas') || find(raw, 'arq_paginas');
  return splitList(v);
}

function detectPriorityPages(raw, sections) {
  const v = find(raw, 'priority_pages') || find(raw, 'páginas_prioritarias') || find(raw, 'arq_prioridad');
  return splitList(v);
}

function detectUserFlow(raw, sections) {
  const v = find(raw, 'user_flow') || find(raw, 'flujo_de_usuario_ideal') || find(raw, 'flujo') || find(raw, 'arq_flujo');
  return splitList(v);
}

function detectMainService(raw, sections) {
  return find(raw, 'main_service') || find(raw, 'servicio_estrella') || find(raw, 'serv_estrella') || find(raw, 'servicio_principal') || null;
}

function detectServiceBenefit(raw, sections) {
  return find(raw, 'benefit') || find(raw, 'beneficio') || find(raw, 'beneficios_principales') || find(raw, 'serv_beneficios') || null;
}

function detectPricing(raw, sections) {
  return find(raw, 'pricing') || find(raw, 'pricing_model') || find(raw, 'precio') || find(raw, 'estrategia_de_precios') || find(raw, 'serv_precio') || null;
}

function detectProcess(raw, sections) {
  const v = find(raw, 'process') || find(raw, 'proceso') || find(raw, 'proceso_de_trabajo') || find(raw, 'serv_proceso');
  return splitList(v);
}

function detectPhotos(raw, sections) {
  const v = find(raw, 'photos') || find(raw, 'fotos') || find(raw, 'fotografías') || find(raw, 'professional_photos');
  return isAffirmative(v);
}

function detectVideos(raw, sections) {
  const v = find(raw, 'videos') || find(raw, 'video_material') || find(raw, 'cont_videos');
  return isAffirmative(v);
}

function detectDownloads(raw, sections) {
  const v = find(raw, 'downloads') || find(raw, 'downloadable_assets') || find(raw, 'recursos') || find(raw, 'recursos_descargables') || find(raw, 'cont_recursos');
  return isAffirmative(v);
}

function detectExperienceYears(raw, sections) {
  const v = find(raw, 'experience') || find(raw, 'experiencia');
  if (!v) return 0;
  const m = v.match(/(\d+)\s*(años|years)/i);
  return m ? parseInt(m[1]) : 0;
}

function detectEventsDone(raw, sections) {
  const v = find(raw, 'experience') || find(raw, 'events') || find(raw, 'eventos');
  if (!v) return 0;
  const m = v.match(/(\d+)\s*(eventos|events)/i);
  return m ? parseInt(m[1]) : 0;
}

function detectClients(raw, sections) {
  const v = find(raw, 'clients') || find(raw, 'clientes') || find(raw, 'clientes/marcas_importantes');
  return splitList(v);
}

function detectCTA(raw, sections) {
  return find(raw, 'cta') || find(raw, 'cta_primary') || find(raw, 'conv_cta') || find(raw, 'cta_principal') || find(raw, 'main_cta') || null;
}

function detectLeadMagnet(raw, sections) {
  return find(raw, 'lead_magnet') || find(raw, 'conv_lead') || find(raw, 'oferta') || null;
}

function detectFollowUp(raw, sections) {
  return find(raw, 'follow_up') || find(raw, 'seguimiento') || find(raw, 'conv_seguimiento') || null;
}

function detectFirst5Seconds(raw, sections) {
  return find(raw, 'first_5_seconds') || find(raw, 'first_5_seconds_goal') || find(raw, 'primeros_5_segundos') || find(raw, 'ai_5seg') || null;
}

function detectMetaphor(raw, sections) {
  return find(raw, 'metaphor') || find(raw, 'brand_metaphor') || find(raw, 'metáfora') || find(raw, 'referente_cultural') || find(raw, 'ai_metafora') || null;
}

function detectDeepDifferentiator(raw, sections) {
  return find(raw, 'deep_differentiator') || find(raw, 'diferenciador_real_profundo') || find(raw, 'ai_diferencia') || null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function find(raw, key) {
  const nk = normalizeKey(key);
  for (const section of Object.values(raw)) {
    if (!section || typeof section !== 'object') continue;
    for (const [k, v] of Object.entries(section)) {
      if (k === nk && v) return v;
    }
  }
  return null;
}

function firstValue(arr) {
  for (const v of arr) {
    if (v) return v;
  }
  return null;
}

function splitList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(s => s.trim()).filter(Boolean);
  return val
    .split(/[,;]+/)
    .map(s => s.trim().replace(/^[•\-*]\s*/, ''))
    .filter(Boolean);
}

function isAffirmative(val) {
  if (!val) return false;
  const v = val.toString().toLowerCase().trim();
  if (v === 'yes' || v === 'sí' || v === 'si' || v === 'true' || v === '1') return true;
  if (v.match(/^(sí|yes|true|1)/i)) return true;
  return false;
}

// ─── OUTPUT BUILDER ─────────────────────────────────────────────────────────

function buildOutput(raw) {
  return {
    meta: {
      client_name: find(raw, 'client_name') || null,
      company: find(raw, 'company') || null,
      email: find(raw, 'email') || null,
      phone: find(raw, 'phone') || null,
      date: find(raw, 'date') || find(raw, 'date_sent') || null,
    },
    business: {
      name: detectName(raw),
      tagline: detectTagline(raw),
      history: detectHistory(raw),
      mission: detectMission(raw),
      vision: detectVision(raw),
      values: detectValues(raw),
      personality: detectPersonality(raw),
      differentiator: detectDifferentiator(raw),
    },
    goals: {
      main_objective: detectMainObjective(raw),
      secondary_objectives: detectSecondaryObjectives(raw),
      kpi: detectKPI(raw),
      timeline: detectTimeline(raw),
      conversion_goal: detectConversionGoal(raw),
    },
    audience: {
      primary: detectPrimaryAudience(raw),
      pain_points: detectPainPoints(raw),
      motivations: detectMotivations(raw),
      decision_behavior: detectDecisionBehavior(raw),
      channel: detectChannels(raw),
    },
    branding: {
      colors: detectColors(raw),
      style: detectVisualStyle(raw),
      typography: detectTypography(raw),
      emotions: detectEmotions(raw),
      forbidden: detectForbidden(raw),
      sophistication: detectSophistication(raw),
    },
    site: {
      pages: detectPages(raw),
      priority_pages: detectPriorityPages(raw),
      user_flow: detectUserFlow(raw),
    },
    services: {
      main_service: detectMainService(raw),
      benefit: detectServiceBenefit(raw),
      pricing: detectPricing(raw),
      process: detectProcess(raw),
    },
    assets: {
      photos: detectPhotos(raw),
      videos: detectVideos(raw),
      downloads: detectDownloads(raw),
    },
    social_proof: {
      experience_years: detectExperienceYears(raw),
      events_done: detectEventsDone(raw),
      clients: detectClients(raw),
    },
    conversion: {
      cta: detectCTA(raw),
      lead_magnet: detectLeadMagnet(raw),
      follow_up: detectFollowUp(raw),
    },
    essence: {
      first_5_seconds: detectFirst5Seconds(raw),
      metaphor: detectMetaphor(raw),
      differentiator: detectDeepDifferentiator(raw),
    },
  };
}

module.exports = { compile };
