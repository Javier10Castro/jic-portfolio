const { query } = require('../lib/db');
const runtime = require('../lib/runtime');
const plan = require('../lib/plan');

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';

let passed = 0, failed = 0;

function assert(label, ok, detail) {
  if (ok) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}: ${detail}`); }
}

async function main() {
  console.log('=== VERIFICACIÓN: prompt_maestro compilado ===\n');

  // 1. Create project with formData (como lo hace el dashboard sin prompt_maestro)
  const suffix = Date.now().toString(36);
  const formData = {
    biz_name: 'Test Empresa',
    obj_principal: 'Crecimiento 20%',
    brand_colores: '#ff6600 #ffffff',
    arq_paginas: ['Inicio', 'Servicios', 'Contacto'],
    seo_keywords: ['test', 'verificacion'],
    conv_cta: 'Contáctanos',
  };

  const project = await runtime.createProject(WS_ID, USER_ID, `Test prompt_maestro ${suffix}`, formData);
  console.log(`  Proyecto creado: ${project.id}\n`);

  // 2. Leer prompt_maestro desde DB
  const { rows } = await query(`SELECT prompt_maestro FROM projects WHERE id = $1`, [project.id]);
  const pm = typeof rows[0].prompt_maestro === 'string'
    ? rows[0].prompt_maestro
    : JSON.stringify(rows[0].prompt_maestro);

  console.log(`  prompt_maestro: ${pm.length} chars\n`);

  // 3. Verificar formato
  console.log('--- Formato ---');
  assert('Comienza con # (compilado)', pm.trim().startsWith('#'), `Primer char: ${pm.trim().charAt(0)}`);
  assert('NO comienza con { (JSON)', !pm.trim().startsWith('{'), `Primer char: ${pm.trim().charAt(0)}`);
  assert('Contiene sección ##', pm.includes('## 1.'), 'No se encontró ## 1.');
  assert('Contiene campo **Empresa:**', pm.includes('**Empresa:**'), 'No se encontró **Empresa:**');
  assert('Contiene el biz_name', pm.includes('Test Empresa'), 'No se encontró Test Empresa');
  assert('Contiene páginas como texto plano', pm.includes('Inicio, Servicios, Contacto'), 'Las páginas deben aparecer como texto plano');

  // 4. plan.compile() debe parsear correctamente
  console.log('\n--- Plan compile ---');
  let ir;
  try {
    ir = plan.compile(pm);
    assert('plan.compile() no lanza error', true, '');
  } catch (e) {
    assert('plan.compile() no lanza error', false, e.message);
  }

  const bizName = ir?.project?.identity?.business_name;
  const pages = ir?.project?.structure?.pages || [];
  const keywords = ir?.project?.seo?.keywords || [];
  const mainCta = ir?.project?.conversion?.main_cta;
  const mainGoal = ir?.project?.identity?.main_goal;

  assert('Extrae business_name', bizName === 'Test Empresa', `Got: ${bizName}`);
  assert('Extrae pages', pages.length === 3, `Got: ${JSON.stringify(pages)}`);
  assert('Extrae keywords', keywords.length === 2, `Got: ${JSON.stringify(keywords)}`);
  assert('Extrae main_cta', mainCta === 'Contáctanos', `Got: ${mainCta}`);
  assert('Extrae main_goal', mainGoal === 'Crecimiento 20%', `Got: ${mainGoal}`);

  // 5. Verificar que prompt NO contiene JSON.stringify artifacts
  const hasJsonArtifacts = pm.includes('{"') || pm.includes('"}') || pm.includes('":"');
  assert('Sin artefactos JSON', !hasJsonArtifacts, 'prompt_maestro contiene caracteres JSON');

  // 6. Limpiar
  await query(`DELETE FROM project_inputs WHERE project_id = $1`, [project.id]);
  await query(`DELETE FROM projects WHERE id = $1`, [project.id]);
  await query(`DELETE FROM form_responses WHERE project_id = $1`, [project.id]);
  console.log('\n  🧹 Proyecto de prueba eliminado\n');

  // 7. Resultado final
  console.log('--- RESULTADO ---');
  if (failed === 0) {
    console.log(`\n  ✅ FRONTEND NO envía prompt_maestro compilado, PERO`);
    console.log(`  ✅ BACKEND lo genera automáticamente en createProjectRow()`);
    console.log(`  ✅ prompt_maestro almacena texto compilado (## secciones + **key:** valor)`);
    console.log(`  ✅ plan.compile() extrae datos correctamente del texto compilado`);
    console.log(`\n  Confirmación: ${passed}/${passed + failed} pruebas pasaron`);
  } else {
    console.log(`\n  ❌ Fallaron ${failed}/${passed + failed} pruebas`);
    process.exit(1);
  }
}

main().catch(err => { console.error('\nFATAL:', err.message); process.exit(1); });
