const fetch = require("node-fetch");

const BASE_URL = "https://web-portfolio-kappa-wheat.vercel.app";

const BRIEF_PAYLOAD = {
  name: "Test User",
  email: "test@example.com",
  company: "Test Co",
  prompt: "Hello world test message",
  submittedAt: Date.now()
};

const CONTACT_PAYLOAD = {
  name: "Test User",
  email: "test@example.com",
  message: "Hello world test message",
  submittedAt: Date.now()
};

async function post(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return {
    status: res.status,
    ok: res.ok,
    response: json
  };
}

async function run() {
  console.log(`\n${'='.repeat(60)}`);
  console.log("  PRODUCTION TEST SUITE");
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}`);

  // ── 1. Brief ──────────────────────────────────────────────────
  console.log('\n📋  BRIEF SUBMISSION');
  const brief = await post("/api/sendBrief", BRIEF_PAYLOAD);
  console.log(`  POST /api/sendBrief → ${brief.status} ${brief.ok ? '✅' : '❌'}`);
  if (brief.response.requestId) console.log(`  requestId: ${brief.response.requestId}`);
  if (brief.response.error) console.log(`  error: ${brief.response.error}`);

  // ── 2. Contact ────────────────────────────────────────────────
  console.log('\n📋  CONTACT SUBMISSION');
  const contact = await post("/api/sendContact", CONTACT_PAYLOAD);
  console.log(`  POST /api/sendContact → ${contact.status} ${contact.ok ? '✅' : '❌'}`);
  if (contact.response.requestId) console.log(`  requestId: ${contact.response.requestId}`);
  if (contact.response.error) console.log(`  error: ${contact.response.error}`);

  // ── 3. Brief (second request — email dedup) ───────────────────
  console.log('\n📋  BRIEF (DUPLICATE — tests email dedup)');
  const brief2 = await post("/api/sendBrief", BRIEF_PAYLOAD);
  console.log(`  POST /api/sendBrief (dup) → ${brief2.status} ${brief2.ok ? '✅' : '❌'}`);
  if (brief2.response.error) console.log(`  error: ${brief2.response.error}`);

  // ── 4. Brief (with invalid email — tests validation path) ─────
  console.log('\n📋  BRIEF (INVALID EMAIL)');
  const briefBad = await post("/api/sendBrief", { ...BRIEF_PAYLOAD, email: "bad" });
  console.log(`  POST /api/sendBrief (bad email) → ${briefBad.status}`);
  if (briefBad.response.requestId) console.log(`  requestId: ${briefBad.response.requestId}`);
  if (briefBad.response.error) console.log(`  error: ${briefBad.response.error}`);

  // ── 5. TELEMETRY ──────────────────────────────────────────────
  console.log('\n📊  TELEMETRY VERIFICATION');

  const health = await fetch(BASE_URL + "/api/telemetry?type=health").then(r => r.json());
  console.log(`  GET /api/telemetry?type=health → ${health.status === 'ok' ? '✅' : '❌'}`);

  const logs = await fetch(BASE_URL + "/api/telemetry?type=logs&limit=10").then(r => r.json());
  const logCount = logs.entries ? logs.entries.length : 0;
  console.log(`  GET /api/telemetry?type=logs → ${logCount} entries`);

  const coverage = await fetch(BASE_URL + "/api/telemetry?type=coverage").then(r => r.json());
  const cov = coverage.coverage || {};
  console.log(`  GET /api/telemetry?type=coverage → ${cov.percentage || 0}% (${cov.executed || 0}/${cov.total || 23} paths)`);
  if (cov.executed > 0) {
    console.log(`  Covered paths:`);
    (cov.coveredPaths || []).forEach(p => console.log(`    ✅ ${p}`));
  }

  // ── 6. TRACE LOOKUP ──────────────────────────────────────────
  if (brief.response.requestId) {
    const traces = await fetch(BASE_URL + `/api/telemetry?type=traces&id=${brief.response.requestId}`).then(r => r.json());
    console.log(`\n🔍  TRACE LOOKUP: ${brief.response.requestId}`);
    console.log(`  Traces found: ${traces.found}`);
    console.log(`  Sources: memory=${traces.sources?.memory || 0} neon=${traces.sources?.neon || 0} merged=${traces.sources?.merged || 0}`);
    if (traces.traces && traces.traces.length > 0) {
      traces.traces.forEach(t => console.log(`    ${t.pathId} (${t.source})`));
    }
  }

  // ── 7. VALIDATION PATHS (from logs) ──────────────────────────
  if (logCount > 0) {
    const stages = [...new Set((logs.entries || []).filter(e => e.validationStage).map(e => e.validationStage))];
    console.log(`\n🔐  VALIDATION STAGES SEEN:`);
    stages.forEach(s => console.log(`    ✅ ${s}`));
  }

  // ── SUMMARY ──────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  FINAL STATUS`);
  console.log(`${'='.repeat(60)}`);
  const passed = [
    brief.status !== 500,
    contact.status !== 500,
    health.status === 'ok',
    logCount > 0,
  ].filter(Boolean).length;
  console.log(`  Tests: ${passed}/4 passed`);
  console.log(`  Coverage: ${cov.percentage || 0}%`);
  console.log(`  Completed: ${new Date().toISOString()}`);
  console.log('');
  process.exit(passed === 4 ? 0 : 1);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
