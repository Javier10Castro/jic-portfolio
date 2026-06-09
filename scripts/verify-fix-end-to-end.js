const { query } = require('../lib/db');
const plan = require('../lib/plan');
const runtime = require('../lib/runtime');

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';

async function main() {
  const suffix = Date.now().toString(36);

  // ── 1. Crear proyecto como lo haría el dashboard ──
  const formData = {
    biz_name: 'Café del Puerto',
    biz_tagline: 'El mejor café del muelle',
    obj_principal: 'Aumentar ventas en un 30% en 6 meses',
    obj_kpis: '300 visitas/mes, 50 reservas/semana',
    pub_ideal: 'Turistas y locales 25-50 años',
    brand_colores: '#1a3a5c #c4956a #f5f0eb',
    arq_paginas: ['Inicio', 'Menú', 'Galería', 'Nosotros', 'Contacto', 'Blog'],
    seo_keywords: ['café artesanal', 'puerto', 'desayunos', 'especialidad', 'eventos'],
    conv_cta: 'Reserva tu mesa',
    brand_estilo: ['marítimo', 'elegante', 'acogedor'],
    serv_estrella: 'Café de especialidad tostado en casa',
    ai_5seg: 'Brisa marina y aroma a café fresco',
    ref_palabras: 'náutico, artesanal, atemporal',
    brand_nivel: '4',
    ai_diferencia: 'Tostamos nuestro propio café con granos de comercio justo',
    func_basicas: ['Galería de fotos', 'Menú interactivo', 'Formulario de contacto'],
    social_testimonios: '"El mejor café del puerto" — Ana L.',
  };

  console.log('=== 1. CREAR PROYECTO (flujo dashboard) ===\n');

  const project = await runtime.createProject(WS_ID, USER_ID, `Verificación fix ${suffix}`, formData);
  console.log(`Proyecto creado:  ${project.id}`);
  console.log(`Slug:             ${project.slug}`);
  console.log(`Status:           draft`);

  // ── 2. Leer desde DB ──
  const { rows } = await query(`SELECT id, name, status, prompt_maestro FROM projects WHERE id = $1`, [project.id]);
  const p = rows[0];
  const pm = typeof p.prompt_maestro === 'string' ? p.prompt_maestro : JSON.stringify(p.prompt_maestro);

  console.log(`\n=== 2. LECTURA DB ===\n`);
  console.log(`id:               ${p.id}`);
  console.log(`status:           ${p.status}`);
  console.log(`prompt_maestro:   ${pm.length} chars`);

  // ── 3. Verificar formato ──
  const startsWithHash = pm.startsWith('#');
  const startsWithBrace = pm.startsWith('{');

  console.log(`\n=== 3. VERIFICAR FORMATO ===\n`);
  console.log(`¿Comienza con # (compilado)?  ${startsWithHash ? '✅ SÍ' : '❌ NO'}`);
  console.log(`¿Comienza con { (JSON)?       ${startsWithBrace ? '❌ SÍ (ANTIGUO)' : '✅ NO'}`);

  if (!startsWithHash) {
    console.log(`\n❌ FIX FALLÓ — prompt_maestro NO es texto compilado`);
    console.log(`Primeros 500: ${pm.slice(0, 500)}`);
    process.exit(1);
  }

  console.log(`\nPrimeros 1000 caracteres:\n`);
  console.log(pm.slice(0, 1000));

  // ── 4. Ejecutar plan.compile() ──
  console.log(`\n=== 4. PLAN.COMPILE() ===\n`);

  let ir;
  try {
    ir = plan.compile(pm);
    console.log(`compile:          ✅ OK`);
  } catch (err) {
    console.log(`compile:          ❌ ERROR — ${err.message}`);
    process.exit(1);
  }

  const projectIR = ir.project || {};
  const sections = Object.keys(projectIR);

  console.log(`sections:         ${sections.length}`);
  for (const s of sections) {
    const fields = projectIR[s] || {};
    const nonNull = Object.entries(fields).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0));
    console.log(`  ${s}: ${nonNull.length} fields`);
  }

  // ── 5. Extraer campos clave ──
  const identity = projectIR.identity || {};
  const structure = projectIR.structure || {};
  const seo = projectIR.seo || {};
  const conversion = projectIR.conversion || {};
  const content = projectIR.content || {};

  const warnings = [];
  if (!identity.business_name) warnings.push('business_name ausente');
  if (!structure.pages || !structure.pages.length) warnings.push('pages ausente');
  if (!seo.keywords || !seo.keywords.length) warnings.push('keywords ausente');
  if (!identity.main_goal) warnings.push('main_goal ausente');
  if (!conversion.main_cta) warnings.push('main_cta ausente');
  if (!content.flagship_service) warnings.push('flagship_service ausente');

  console.log(`\n=== 5. CAMPOS CLAVE ===\n`);
  console.log(`business_name:    ${identity.business_name || '❌ (null)'}`);
  console.log(`main_goal:        ${identity.main_goal || '❌ (null)'}`);
  console.log(`tagline:          ${identity.tagline || '(null)'}`);
  console.log(`pages:            ${(structure.pages || []).join(', ') || '❌ (empty)'}`);
  console.log(`keywords:         ${(seo.keywords || []).join(', ') || '❌ (empty)'}`);
  console.log(`main_cta:         ${conversion.main_cta || '❌ (null)'}`);
  console.log(`flagship_service: ${content.flagship_service || '❌ (null)'}`);

  console.log(`\n=== 6. COMPARATIVA ===`);
  console.log(`\nAnterior (JSON):`);
  console.log(`  business_name → null`);
  console.log(`  pages → []`);
  console.log(`  keywords → []`);
  console.log(`  main_cta → null`);
  console.log(`  score → 53.75 (base) / 63.75 (sin warning)`);
  console.log(`\nActual (compilado):`);
  console.log(`  business_name → ${identity.business_name}`);
  console.log(`  pages → ${(structure.pages || []).length}`);
  console.log(`  keywords → ${(seo.keywords || []).length}`);
  console.log(`  main_cta → ${conversion.main_cta}`);
  console.log(`  main_goal → ${identity.main_goal}`);

  const allNull = !identity.business_name && (!structure.pages || !structure.pages.length);
  const verdict = allNull ? '❌ FIX FALLÓ — datos no llegan al plan engine' : '✅ FIX FUNCIONA — el plan engine recibe datos reales';

  console.log(`\n=== 7. VEREDICTO ===\n`);
  console.log(verdict);

  // ── 8. Simular scoring engine ──
  console.log(`\n=== 8. IMPACTO EN SCORING ===\n`);

  const designSystem = projectIR;
  const previewMock = { layout: { sections: [{ type: 'hero' }, { type: 'contact' }] }, warnings: [] };

  const contrastScore = evaluateContrast({ tokens: { semantic: { background: '#f5f0eb', text: '#1a3a5c', primary: '#c4956a' } }, colors: { palette: ['#1a3a5c', '#c4956a', '#f5f0eb'] } });
  const uxScore = evaluateUX(ir, previewMock);
  const conversionScore = evaluateConversion(ir);
  const clarityScore = evaluateClarity(ir);
  const seoScore = evaluateSEO(ir);

  const weighted =
    contrastScore * 0.25 +
    uxScore * 0.25 +
    conversionScore * 0.20 +
    clarityScore * 0.15 +
    seoScore * 0.15;

  console.log(`contrast:    ${contrastScore} * 0.25 = ${(contrastScore * 0.25).toFixed(2)}`);
  console.log(`ux:          ${uxScore} * 0.25 = ${(uxScore * 0.25).toFixed(2)}`);
  console.log(`conversion:  ${conversionScore} * 0.20 = ${(conversionScore * 0.20).toFixed(2)}`);
  console.log(`clarity:     ${clarityScore} * 0.15 = ${(clarityScore * 0.15).toFixed(2)}`);
  console.log(`seo:         ${seoScore} * 0.15 = ${(seoScore * 0.15).toFixed(2)}`);
  console.log(`\nScore total: ${Math.round(weighted * 100) / 100}`);
  console.log(`(vs. 53.75-63.75 con JSON vacío)`);
  console.log(`\nDiferencia:  ${(Math.round(weighted * 100) / 100 - 53.75).toFixed(2)} puntos más que con JSON`);

  const scoreVerdict = weighted > 63.75 ? '✅ SÍ — el scoring recibe información real (score > 63.75)' : '⚠️ Parcial — score no supera el máximo anterior';
  console.log(`\n${scoreVerdict}`);

  // ── Limpiar proyecto de prueba ──
  await query(`DELETE FROM project_inputs WHERE project_id = $1`, [project.id]);
  await query(`DELETE FROM projects WHERE id = $1`, [project.id]);
  await query(`DELETE FROM form_responses WHERE project_id = $1`, [project.id]);
  console.log(`\n🧹 Proyecto de prueba eliminado`);
}

// ── Copia inline de funciones de scoring (sin importar runtime) ──
function evaluateContrast(dsResult) {
  if (!dsResult || !dsResult.tokens || !dsResult.tokens.semantic) return 50;
  const sem = dsResult.tokens.semantic;
  let score = 70;
  if (sem.background && sem.text) {
    try {
      const cr = previewContrastRatio(sem.background, sem.text);
      if (cr >= 7) score += 15;
      else if (cr >= 4.5) score += 5;
      else if (cr >= 3) score -= 10;
      else score -= 25;
    } catch { score -= 10; }
  }
  if (sem.primary) score += 5;
  if (dsResult.colors && dsResult.colors.palette && dsResult.colors.palette.length > 6) score -= 10;
  return Math.max(0, Math.min(100, score));
}
function evaluateUX(planIr, previewResult) {
  if (!planIr || !planIr.project) return 50;
  const identity = planIr.project.identity || {};
  const structure = planIr.project.structure || {};
  let score = 60;
  if (identity.business_name) score += 10;
  if (identity.tagline || identity.mission) score += 5;
  if (structure.pages && structure.pages.length > 0) score += Math.min(15, structure.pages.length * 3);
  if (structure.main_conversion) score += 5;
  if (previewResult && previewResult.layout) {
    const sections = previewResult.layout.sections || [];
    if (sections.some(s => s.type === 'hero')) score += 5;
    if (sections.some(s => s.type === 'contact')) score += 5;
  }
  return Math.min(100, score);
}
function evaluateConversion(planIr) {
  if (!planIr || !planIr.project) return 50;
  const conversion = planIr.project.conversion || {};
  const identity = planIr.project.identity || {};
  let score = 50;
  if (conversion.main_cta) score += 15;
  if (conversion.lead_magnet) score += 10;
  if (conversion.follow_up) score += 5;
  if (identity.main_goal) score += 10;
  if (structureHasCTA(planIr)) score += 10;
  return Math.min(100, score);
}
function evaluateClarity(planIr) {
  if (!planIr || !planIr.project) return 50;
  const identity = planIr.project.identity || {};
  const content = planIr.project.content || {};
  let score = 50;
  if (identity.business_name) score += 10;
  if (identity.tagline) score += 10;
  if (identity.mission || identity.story) score += 10;
  if (content.service_list || content.flagship_service) score += 10;
  if (content.ideal_client) score += 5;
  if (identity.values && identity.values.length) score += 5;
  return Math.min(100, score);
}
function evaluateSEO(planIr) {
  if (!planIr || !planIr.project) return 50;
  const seo = planIr.project.seo || {};
  const structure = planIr.project.structure || {};
  let score = 50;
  if (seo.keywords && seo.keywords.length >= 3) score += 15;
  else if (seo.keywords && seo.keywords.length > 0) score += 5;
  if (seo.locations && seo.locations.length) score += 10;
  if (seo.content_strategy) score += 10;
  if (structure.pages && structure.pages.length >= 3) score += 10;
  if (seo.kpis) score += 5;
  return Math.min(100, score);
}
function structureHasCTA(planIr) {
  const structure = planIr.project.structure || {};
  if (structure.main_conversion) return true;
  const conversion = planIr.project.conversion || {};
  if (conversion.main_cta) return true;
  return false;
}
function previewContrastRatio(hex1, hex2) {
  function luminance(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  const l1 = luminance(hex1), l2 = luminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

main().catch(err => { console.error('\n❌ FATAL:', err.message); process.exit(1); });
