const { query } = require('../lib/db');
const plan = require('../lib/plan');

async function main() {
  const { rows } = await query(`SELECT id, name, slug, status, prompt_maestro, created_at FROM projects ORDER BY created_at DESC LIMIT 1`);
  if (!rows.length) {
    console.log('No projects found');
    process.exit(1);
  }

  const p = rows[0];
  const pm = p.prompt_maestro || '';
  const pmStr = typeof pm === 'string' ? pm : JSON.stringify(pm);

  console.log('=== PROJECT ===');
  console.log(`id:             ${p.id}`);
  console.log(`name:           ${p.name}`);
  console.log(`slug:           ${p.slug}`);
  console.log(`status:         ${p.status}`);
  console.log(`prompt_maestro: ${pmStr.length} chars`);
  console.log('');
  console.log('=== PROMPT_MAESTRO (first 500 chars) ===');
  console.log(pmStr.slice(0, 500));
  console.log('');

  console.log('=== PLAN COMPILE ===');
  let ir;
  try {
    ir = plan.compile(pmStr);
    console.log('compile:        OK');
  } catch (err) {
    console.log('compile:        ERROR —', err.message);
    process.exit(1);
  }

  const project = ir.project || {};
  const sections = Object.keys(project);

  console.log(`sections:       ${sections.length}`);
  for (const s of sections) {
    const fields = project[s] || {};
    const nonNull = Object.entries(fields).filter(([, v]) => v !== null && v !== undefined);
    console.log(`  ${s}: ${nonNull.length} fields`);
  }

  const identity = project.identity || {};
  const structure = project.structure || {};
  const seo = project.seo || {};
  const conversion = project.conversion || {};
  const content = project.content || {};

  const warnings = [];
  if (!identity.business_name) warnings.push('business_name missing');
  if (!structure.pages || !structure.pages.length) warnings.push('pages missing');
  if (!seo.keywords || !seo.keywords.length) warnings.push('keywords missing');
  if (!identity.main_goal) warnings.push('main_goal missing');
  if (!conversion.main_cta) warnings.push('main_cta missing');

  console.log('');
  console.log('=== WARNINGS ===');
  if (warnings.length) {
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  } else {
    console.log('  None — full IR detected');
  }

  console.log('');
  console.log('=== KEY FIELDS ===');
  console.log(`business_name:  ${identity.business_name || '(null)'}`);
  console.log(`tagline:        ${identity.tagline || '(null)'}`);
  console.log(`main_goal:      ${identity.main_goal || '(null)'}`);
  console.log(`ideal_client:   ${identity.ideal_client || '(null)'}`);
  console.log(`pages:          ${(structure.pages || []).join(', ') || '(empty)'}`);
  console.log(`keywords:       ${(seo.keywords || []).join(', ') || '(empty)'}`);
  console.log(`main_cta:       ${conversion.main_cta || '(null)'}`);
  console.log(`flagship_svc:   ${content.flagship_service || '(null)'}`);

  console.log('');
  console.log('=== RAW IR ===');
  console.log(JSON.stringify(ir, null, 2));
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
