const fetch = require('node-fetch');

const BASE_URL = 'https://web-portfolio-kappa-wheat.vercel.app';
const RUN_ID = Date.now().toString(36).slice(-6);

function makeEmail(label) {
  return `test-${label}-${RUN_ID}@example.com`;
}

async function post(path, body) {
  const start = Date.now();
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
  return { status: res.status, ok: res.ok, ms: Date.now() - start, response: json, headers: res.headers.raw() };
}

async function get(path) {
  const res = await fetch(BASE_URL + path);
  const json = await res.json();
  return { status: res.status, json };
}

async function run() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  PRODUCTION TEST SUITE`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Run ID: ${RUN_ID}`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}`);

  // ── 1. Brief submission ───────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log('  1. Brief submission');
  const brief = await post('/api/sendBrief', {
    name: 'Test User', email: makeEmail('brief1'), company: 'Test Co',
    prompt: 'Hello world test message', lang: 'en', submittedAt: Date.now()
  });
  console.log(`     POST /api/sendBrief → ${brief.status} ${brief.ok ? '✅' : '❌'} (${brief.ms}ms)`);
  if (brief.response.requestId) console.log(`     requestId: ${brief.response.requestId}`);

  // ── 2. Contact submission ────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log('  2. Contact submission');
  const contact = await post('/api/sendContact', {
    name: 'Test User', email: makeEmail('contact1'),
    message: 'Hello world test message', lang: 'en', submittedAt: Date.now()
  });
  console.log(`     POST /api/sendContact → ${contact.status} ${contact.ok ? '✅' : '❌'} (${contact.ms}ms)`);
  if (contact.response.requestId) console.log(`     requestId: ${contact.response.requestId}`);

  // ── 3. Duplicate brief (email dedup) ─────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log('  3. Duplicate brief (email dedup)');
  const dup = await post('/api/sendBrief', {
    name: 'Test User', email: makeEmail('brief1'),
    prompt: 'Hello world test message', lang: 'en', submittedAt: Date.now()
  });
  const dedupOk = dup.status === 429;
  console.log(`     POST /api/sendBrief (dup) → ${dup.status} ${dedupOk ? '✅' : '⚠️'}`);
  if (!dedupOk) console.log(`     ❌ Expected 429, got ${dup.status}`);
  if (dup.response.error) console.log(`     error: ${dup.response.error}`);

  // ── 4. Invalid email ─────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log('  4. Invalid email');
  const bad = await post('/api/sendBrief', {
    name: 'Test User', email: 'bad', prompt: 'test', lang: 'en', submittedAt: Date.now()
  });
  console.log(`     POST /api/sendBrief (bad email) → ${bad.status}`);
  console.log(`     requestId: ${bad.response.requestId}`);
  console.log(`     error: ${bad.response.error}`);

  // ── 5. Missing name (validation path) ────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log('  5. Missing name');
  const noname = await post('/api/sendBrief', {
    email: makeEmail('noname'), prompt: 'test', lang: 'en', submittedAt: Date.now()
  });
  console.log(`     POST /api/sendBrief (no name) → ${noname.status}`);
  if (noname.response.requestId) console.log(`     requestId: ${noname.response.requestId}`);

  // ── 6. Missing prompt (validation path) ──────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log('  6. Missing prompt');
  const noprompt = await post('/api/sendContact', {
    name: 'Test User', email: makeEmail('noprompt'), message: '',
    lang: 'en', submittedAt: Date.now()
  });
  console.log(`     POST /api/sendContact (no message) → ${noprompt.status}`);
  if (noprompt.response.requestId) console.log(`     requestId: ${noprompt.response.requestId}`);

  // ── 7. TELEMETRY ─────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log('  7. Telemetry');

  const health = await get('/api/telemetry?type=health');
  console.log(`     GET /api/telemetry?type=health → ${health.json.status === 'ok' ? '✅' : '❌'}`);

  const logs = await get('/api/telemetry?type=logs&limit=10');
  const logCount = logs.json.entries ? logs.json.entries.length : 0;
  console.log(`     GET /api/telemetry?type=logs → ${logCount} entries`);

  const coverage = await get('/api/telemetry?type=coverage');
  const cov = coverage.json.coverage || {};
  const totalPaths = cov.total || 0;
  console.log(`     GET /api/telemetry?type=coverage → ${cov.percentage || 0}% (${cov.executed || 0}/${totalPaths} paths)`);
  if (cov.executed > 0) {
    (cov.coveredPaths || []).forEach(p => console.log(`       ✅ ${p}`));
  }

  // ── 8. TRACE LOOKUP ──────────────────────────────────────────
  if (brief.response.requestId) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  8. Trace lookup: ${brief.response.requestId}`);
    const traces = await get(`/api/telemetry?type=traces&id=${brief.response.requestId}`);
    console.log(`     Found: ${traces.json.found}`);
    console.log(`     Sources: memory=${traces.json.sources?.memory || 0} neon=${traces.json.sources?.neon || 0} merged=${traces.json.sources?.merged || 0}`);
    if (traces.json.traces && traces.json.traces.length > 0) {
      traces.json.traces.forEach(t => console.log(`       ${t.pathId} (${t.source})`));
    }
  }

  // ── 9. RANGE ANALYTICS ───────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log('  9. Range analytics (24h)');
  const range = await get('/api/telemetry?type=range&hours=24');
  const paths = range.json.paths || range.json.aggregation || [];
  console.log(`     Paths: ${paths.length}`);
  if (paths.length > 0) {
    paths.slice(0, 8).forEach(p => console.log(`       ${p.pathId}: ${p.hitCount} hits`));
    if (paths.length > 8) console.log(`       ... and ${paths.length - 8} more`);
  }

  // ── VALIDATION STAGES (from logs) ─────────────────────────---
  if (logCount > 0) {
    const stages = [...new Set((logs.json.entries || []).filter(e => e.validationStage).map(e => e.validationStage))];
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  10. Validation stages seen (${stages.length}):`);
    stages.forEach(s => console.log(`       ✅ ${s}`));
  }

  // ── SUMMARY ──────────────────────────────────────────────────
  const endpointOk = brief.ok || brief.status === 202;
  const contactOk = contact.ok || contact.status === 202;
  const testsPassed = [endpointOk, contactOk, dedupOk, health.json.status === 'ok'].filter(Boolean).length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  RESULTS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Endpoints:     ${endpointOk ? '✅' : '❌'} sendBrief, ${contactOk ? '✅' : '❌'} sendContact`);
  console.log(`  Dedup:         ${dedupOk ? '✅' : '❌'}`);
  console.log(`  Telemetry:     ${health.json.status === 'ok' ? '✅' : '❌'}`);
  console.log(`  Coverage:      ${cov.percentage || 0}% (${cov.executed || 0}/${totalPaths} paths)`);
  console.log(`  Core tests:    ${testsPassed}/4 passed`);
  console.log(`  Completed:     ${new Date().toISOString()}`);
  console.log('');
  process.exit(testsPassed === 4 ? 0 : 1);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
