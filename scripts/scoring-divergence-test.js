const { query } = require('../lib/db');
const crypto = require('crypto');
const runtime = require('../lib/runtime');

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';

const THICK_LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

function shortId() { return crypto.randomBytes(4).toString('hex'); }

async function runPipelineWithLog(project, label) {
  const executionId = crypto.randomUUID();

  console.log(`\n${THICK_LINE}`);
  console.log(`  ${label}`);
  console.log(`${THICK_LINE}\n`);

  const result = await runtime.runPipeline(project.id, WS_ID, executionId, null, 'json_brief', undefined, USER_ID);

  const { rows: [exec] } = await query(`SELECT id, status, steps, errors, started_at, completed_at FROM executions WHERE id = $1`, [executionId]);
  const { rows: [decision] } = await query(`SELECT score, metrics, warnings, passed, feedback FROM decisions WHERE execution_id = $1 ORDER BY created_at DESC LIMIT 1`, [executionId]);
  const { rows: [proj] } = await query(`SELECT status FROM projects WHERE id = $1`, [project.id]);

  console.log(`Project:      ${project.name} (${project.slug})`);
  console.log(`Status:       ${proj.status}`);
  console.log(`Execution:    ${executionId}`);
  console.log(`Duration:     ${exec ? ((new Date(exec.completed_at) - new Date(exec.started_at)) / 1000).toFixed(1) + 's' : 'N/A'}`);
  console.log('');

  if (decision) {
    const metrics = decision.metrics || {};
    const warnings = decision.warnings || [];
    const highWarnings = warnings.filter(w => w.severity === 'high');
    const penaltyTotal = highWarnings.length * 10;

    console.log(`Score:        ${decision.score}/100`);
    console.log(`Passed:       ${decision.passed ? '✅' : '❌'}`);
    console.log(`Feedback:     ${decision.feedback || '(none)'}`);
    console.log('');
    console.log(`Metrics breakdown:`);
    if (metrics.contrast)     console.log(`  contrast:    ${metrics.contrast.score} × 0.25`);
    if (metrics.ux)           console.log(`  ux:          ${metrics.ux.score} × 0.25`);
    if (metrics.conversion)   console.log(`  conversion:  ${metrics.conversion.score} × 0.20`);
    if (metrics.clarity)      console.log(`  clarity:     ${metrics.clarity.score} × 0.15`);
    if (metrics.seo)          console.log(`  seo:         ${metrics.seo.score} × 0.15`);
    console.log('');

    if (warnings.length) {
      console.log(`Warnings (${warnings.length}):`);
      for (const w of warnings) {
        const icon = w.severity === 'high' ? '🔴' : w.severity === 'medium' ? '🟡' : '⚪';
        console.log(`  ${icon} [${w.severity}] ${w.message}${penaltyTotal && w.severity === 'high' ? ' → -10' : ''}`);
      }
      if (highWarnings.length) console.log(`  ─────────────────────────\n  Penalty total:  -${penaltyTotal} puntos`);
    } else {
      console.log(`Warnings:     (none)`);
    }
  } else {
    console.log('(no decision record found — pipeline may have failed)');
  }

  console.log(`\nProject ID:   ${project.id}`);

  return { executionId, score: decision ? decision.score : null, decision };
}

async function main() {
  const suffix = shortId();

  // ── PROJECT A: Full/rich data ──
  const formDataA = {
    biz_name: 'Mountain Lodge Retreat',
    biz_tagline: 'Tu refugio en la montaña',
    biz_history: 'Nacido del amor por la naturaleza y el deseo de compartir la paz de la montaña con viajeros de todo el mundo.',
    biz_mision: 'Crear experiencias de descanso profundo en armonía con la naturaleza.',
    biz_vision: 'Ser el refugio de montaña más reconocido de América Latina por su compromiso con la sustentabilidad.',
    biz_valores: ['Sustentabilidad', 'Autenticidad', 'Hospitalidad', 'Conexión con la naturaleza'],
    biz_diferenciadores: 'Arquitectura sustentable con materiales locales y cero plástico de un solo uso.',
    biz_personalidad: ['Acogedor', 'Rústico', 'Sereno', 'Auténtico'],
    obj_principal: 'Aumentar reservas directas en un 40% en los próximos 6 meses',
    obj_secundarios: ['Reducir dependencia de OTAs', 'Fidelizar huéspedes recurrentes', 'Posicionar marca como referente de ecoturismo'],
    obj_kpis: '200 reservas/mes, 80% ocupación, 4.8 estrellas rating',
    obj_conversion: 'Reserva directa desde la web con pago en línea',
    obj_plazo: '6 meses',
    comp_sitio: 'No tienen sitio web propio, solo perfil en Instagram',
    comp_problemas: ['Dependencia total de OTAs', 'Sin canal de reservas directo', 'Marca poco conocida digitalmente'],
    comp_directos: 'Hoteles boutique en la zona, cabañas en Airbnb',
    comp_aspiracionales: 'Nayara Springs (Costa Rica), Explora (Chile)',
    comp_oportunidades: 'Segmento de ecoturismo en crecimiento 20% anual',
    pub_ideal: 'Viajeros conscientes de 30-55 años, profesionales, amantes de la naturaleza y la tranquilidad',
    pub_problemas: 'Estrés urbano, necesidad de desconexión genuina',
    pub_motivaciones: 'Paz, silencio, naturaleza auténtica, bienestar',
    pub_objeciones: 'Precio, ubicación remota, temor al aburrimiento',
    pub_decision: 'Investigación en redes + reseñas → comparación → reserva directa',
    pub_canales: ['Instagram', 'Google', 'Blogs de viajes', 'Recomendación'],
    brand_logo: 'Sí, logotipo profesional con un pino estilizado',
    brand_colores: '#2d5016 #8b6f47 #f4efe6 #1a3c0a',
    brand_tipografia: 'Playfair Display para títulos, Inter para cuerpo',
    brand_estilo: ['Rústico', 'Natural', 'Acogedor', 'Orgánico', 'Elegante'],
    brand_emociones: ['Paz', 'Asombro', 'Gratitud', 'Conexión', 'Serenidad'],
    brand_prohibido: 'Nada artificial, neón, industrial o tecnológico',
    brand_nivel: '3',
    arq_paginas: ['Inicio', 'Habitaciones', 'Galería', 'Actividades', 'Restaurante', 'Reservas', 'Contacto', 'Blog'],
    arq_extras: 'Galería interactiva 360°, mapa de senderos, calendario de disponibilidad',
    arq_prioridad: 'Inicio y página de reservas',
    arq_flujo: ' Landing inspirador → explorar habitaciones → galería de fotos → reserva directa',
    cont_textos: 'Sí, textos descriptivos para cada habitación y actividad',
    cont_fotos: 'Sí, sesión profesional de 50+ fotos de alta resolución',
    cont_videos: 'Video drone del paisaje y testimoniales de huéspedes',
    cont_recursos: 'Guía de actividades descargable, mapa del sendero',
    serv_lista: 'Alojamiento en cabañas, restaurante gourmet, senderismo guiado, yoga al amanecer, fogatas nocturnas',
    serv_estrella: 'Cabañas privadas con vista panorámica y chimenea',
    serv_beneficios: 'Desconexión total, inmersión en naturaleza, gastronomía local',
    serv_proceso: 'Reserva → check-in personalizado → experiencia guiada → check-out con recuerdo artesanal',
    serv_precio: 'Premium accesible — $180-$350 USD por noche según temporada',
    social_testimonios: '"La mejor experiencia en la montaña. Volveremos cada año" — María G.\n"Un lugar mágico que renueva el alma" — Carlos R.',
    social_numeros: '95% ocupación en temporada alta, 4.9 estrellas en Google, 40% huéspedes recurrentes',
    social_clientes: 'Huéspedes de 12 países, familias, parejas, nómadas digitales',
    social_cert: 'Certificación de Sustentabilidad Turística, Miembro de Mountain Lodges Alliance',
    social_casos: 'Familia Martínez: 5 visitas consecutivas en 3 años',
    func_basicas: ['Galería fotográfica con lightbox', 'Mapa interactivo de la propiedad', 'Blog de actividades y naturaleza', 'Calculadora de presupuesto'],
    func_avanzadas: ['Reservas con disponibilidad en tiempo real', 'Pasarela de pago integrada', 'Panel de administración de reservas'],
    func_herramientas: 'Google Analytics, Tag Manager, Facebook Pixel, Hotjar',
    func_cms: 'Sistema propio con panel administrativo para gestionar reservas y contenido',
    seo_keywords: ['cabaña montaña', 'retiro naturaleza', 'escapada fin de semana', 'hotel bosque', 'ecoturismo', 'glamping', 'senderismo guiado', 'vacaciones sustentables'],
    seo_geo: ['Bosque de los Cedros', 'Sierra Nevada', 'Montañas del Sur'],
    seo_competencia: 'Baja competencia SEO para "ecoturismo [zona]" — oportunidad clara',
    seo_blog: 'Blog semanal con guías de actividades, historias de huéspedes y consejos de viaje sustentable',
    ref_favoritos: 'nayararesorts.com, exploara.com, fasabi.com',
    ref_odio: 'Sitios genéricos de hotel con templates, demasiado corporativos',
    ref_marcas: 'Patagonia (outdoor), Ace Hotel (rústico moderno), Airbnb Experiences',
    ref_palabras: 'natural, auténtico, sereno, envolvente, orgánico',
    conv_cta: 'Reserva tu escapada',
    conv_oferta: 'Garantía de mejor precio — 10% descuento en reserva directa',
    conv_lead: 'Guía gratuita "5 escapadas de montaña imperdibles" a cambio de email',
    conv_urgencia: 'Disponibilidad limitada — solo 8 cabañas',
    conv_seguimiento: 'Email post-estancia con encuesta y código de descuento para próxima visita',
    ai_persona: 'Un abrazo cálido envuelto en una manta frente a la chimenea, con el sonido del viento entre los pinos',
    ai_5seg: 'Paz profunda y conexión inmediata con la naturaleza',
    ai_diferencia: 'Cero plástico, huella de carbono neutral, 100% energía solar, materiales locales en cada construcción',
    ai_prohibido: 'Plásticos de un solo uso, luces LED frías, música ambiental, uniformes corporativos',
    ai_metafora: 'Como una cabaña de troncos con WiFi — tradición y confort moderno en equilibrio perfecto',
    ai_extra: 'El cliente valora la privacidad y el silencio por encima de todo. Cada detalle debe reforzar la sensación de estar lejos del mundo.',
  };

  const formDataB = {
    biz_name: 'Tienda XYZ',
  };

  // Create projects
  const projA = await runtime.createProject(WS_ID, USER_ID, `Project A Full ${suffix}`, formDataA);
  const projB = await runtime.createProject(WS_ID, USER_ID, `Project B Minimal ${suffix}`, formDataB);

  console.log(`\n  Proyecto A creado: ${projA.id}`);
  console.log(`  Proyecto B creado: ${projB.id}\n`);

  // Run pipelines
  const a = await runPipelineWithLog(projA, 'PROYECTO A — Marca completa, SEO, páginas, CTA');
  const b = await runPipelineWithLog(projB, 'PROYECTO B — Información mínima (solo biz_name)');

  // Comparison
  const scoreA = a.score || 0;
  const scoreB = b.score || 0;
  const diff = Math.abs(scoreA - scoreB);

  console.log(`\n${THICK_LINE}`);
  console.log('  COMPARATIVA FINAL');
  console.log(`${THICK_LINE}\n`);
  console.log(`                  PROY A     PROY B`);
  console.log(`                ───────── ─────────`);
  console.log(`Score:           ${String(scoreA).padStart(8)} ${String(scoreB).padStart(8)}`);
  console.log(`                ───────── ─────────`);
  console.log(`Diferencia:                    ${diff.toFixed(2)} puntos`);
  console.log('');
  console.log(`Línea base anterior (JSON vacío):`);
  console.log(`  Mínimo (con penalty):  53.75`);
  console.log(`  Máximo (sin penalty):  63.75`);
  console.log('');
  console.log(`Proyecto A vs base:  ${(scoreA - 53.75).toFixed(2)} puntos por encima del mínimo`);
  console.log(`Proyecto B vs base:  ${(scoreB - 53.75).toFixed(2)} puntos por encima del mínimo`);
  console.log(`Proyecto A vs B:     ${diff.toFixed(2)} puntos de divergencia`);

  const verdictA = scoreA > 80 ? '✅ MUY ALTO — datos completos generan score > 80' : scoreA > 63.75 ? '✅ SUPERIOR — supera el máximo anterior' : '⚠️ POR DEBAJO del máximo anterior';
  const verdictB = scoreB < 65 ? '✅ BAJO — datos mínimos generan score bajo' : scoreB > 63.75 ? '⚠️ INESPERADO — datos mínimos superan máximo anterior' : '⚠️ NO hay divergencia clara';
  const verdictDiff = diff > 20 ? '✅ DIVERGENCIA SIGNIFICATIVA (>20 pts)' : diff > 10 ? '⚠️ Divergencia moderada (10-20 pts)' : '❌ Divergencia insuficiente (<10 pts)';

  console.log(`\nVeredictos:`);
  console.log(`  Proyecto A:  ${verdictA}`);
  console.log(`  Proyecto B:  ${verdictB}`);
  console.log(`  Diferencia:  ${verdictDiff}`);

  // Cleanup
  await query(`DELETE FROM decisions WHERE project_id IN ($1,$2)`, [projA.id, projB.id]);
  await query(`DELETE FROM previews WHERE project_id IN ($1,$2)`, [projA.id, projB.id]);
  await query(`UPDATE projects SET current_preview_id = NULL WHERE id IN ($1,$2)`, [projA.id, projB.id]);
  await query(`DELETE FROM project_states WHERE project_id IN ($1,$2)`, [projA.id, projB.id]);
  await query(`DELETE FROM executions WHERE project_id IN ($1,$2)`, [projA.id, projB.id]);
  await query(`DELETE FROM project_inputs WHERE project_id IN ($1,$2)`, [projA.id, projB.id]);
  await query(`DELETE FROM form_responses WHERE project_id IN ($1,$2)`, [projA.id, projB.id]);
  await query(`DELETE FROM projects WHERE id IN ($1,$2)`, [projA.id, projB.id]);

  console.log(`\n🧹 Proyectos de prueba eliminados`);
}

main().catch(err => { console.error('\n❌ FATAL:', err.message); process.exit(1); });
