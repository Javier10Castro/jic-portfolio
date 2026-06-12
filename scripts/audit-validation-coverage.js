/**
 * audit-validation-coverage.js (v2)
 *
 * Production-grade validation persistence + trace coverage audit tool.
 *
 * Tests:
 * 1. Persistence: Every reachable validation reject path persists diagnostics to Neon
 * 2. Live traces: In-memory tracer records pathId on each validation failure
 * 3. Neon traces: Trace events persisted to request_traces table
 * 4. True system coverage: Merged coverage from memory + Neon (survives cold starts)
 *
 * Usage: node scripts/audit-validation-coverage.js
 * Environment: Node 18+ (uses global fetch)
 */

const BASE = 'https://web-portfolio-kappa-wheat.vercel.app';
const POLL_DELAY_MS = 2000;
const POLL_RETRIES = 2;

let passed = 0;
let failed = 0;

const livePaths = new Set();

function pad(label, n) {
  return label.length < n ? label + ' '.repeat(n - label.length) : label;
}

async function apiLogs(requestId) {
  const url = `${BASE}/api/logs?id=${encodeURIComponent(requestId)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

async function apiTraces(requestId) {
  const url = `${BASE}/api/traces?id=${encodeURIComponent(requestId)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const body = await res.json();
    return body.traces || [];
  } catch {
    return [];
  }
}

async function apiMergedCoverage() {
  const url = `${BASE}/api/traces?coverage=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function apiRangeCoverage(hours) {
  const url = `${BASE}/api/traces?range=${hours}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function testEndpoint(label, endpoint, payload, method = 'POST') {
  process.stdout.write(`\n  ${pad(label, 32)}`);
  let traces = [];
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (payload !== null) opts.body = JSON.stringify(payload);
    const res = await fetch(`${BASE}${endpoint}`, opts);
    const ct = res.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await res.json() : {};
    const requestId = body.requestId || null;
    const status = res.status;

    process.stdout.write(`status=${String(status).padEnd(4)}`);

    if (!requestId) {
      process.stdout.write(`  NO requestId`);
      failed++;
      return { label, status, requestId: null, validationStage: null, persisted: false, traces: [] };
    }

    process.stdout.write(`  id=${requestId.slice(0, 8)}…`);

    // Poll Neon for persistence
    let entry = null;
    for (let attempt = 0; attempt <= POLL_RETRIES; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, POLL_DELAY_MS));
      entry = await apiLogs(requestId);
      if (entry) break;
    }

    // Read trace events (from memory or Neon via merged endpoint)
    traces = await apiTraces(requestId);

    const stage = entry ? entry.validationStage || 'none' : 'NOT_FOUND';
    const persisted = !!entry;

    process.stdout.write(`  stage=${String(stage).padEnd(28)}`);

    if (persisted && stage !== 'none') {
      process.stdout.write(`  ✅`);
      passed++;
    } else {
      process.stdout.write(`  ❌`);
      failed++;
    }

    // Record live trace pathIds (from /api/traces response)
    for (const t of traces) {
      if (t.pathId) livePaths.add(t.pathId);
    }

    return { label, status, requestId, validationStage: stage, persisted, traces, traceCount: traces.length };
  } catch (err) {
    process.stdout.write(`  ERROR: ${err.message.padEnd(30)}  ❌`);
    failed++;
    return { label, status: 0, requestId: null, validationStage: null, persisted: false, traces: [], error: err.message };
  }
}

async function testSendBrief(label, payload) {
  return testEndpoint(label, '/api/sendBrief', payload);
}

async function testSendContact(label, payload, method) {
  return testEndpoint(label, '/api/sendContact', payload, method);
}

async function runAll() {
  const now = Date.now();
  const results = [];

  console.log('');
  console.log('═'.repeat(92));
  console.log('  VALIDATION PERSISTENCE + TRACE COVERAGE AUDIT (v2)');
  console.log(`  Target: ${BASE}`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('═'.repeat(92));
  console.log('');

  // ── sendBrief tests ──────────────────────────────────────────
  console.log('── sendBrief ────────────────────────────────────────');

  results.push(await testSendBrief('invalid-email', {
    name: 'Audit Bot', email: 'not-an-email',
    prompt: 'Test prompt for audit verification purposes only.',
    lang: 'en', formData: {}, submittedAt: now,
  }));
  await new Promise(r => setTimeout(r, 1000));

  results.push(await testSendBrief('empty-name', {
    name: '', email: 'audit@test.com',
    prompt: 'Test prompt for audit verification purposes only.',
    lang: 'en', formData: {}, submittedAt: now,
  }));
  await new Promise(r => setTimeout(r, 1000));

  results.push(await testSendBrief('missing-prompt', {
    name: 'Audit Bot', email: 'audit@test.com', prompt: '',
    lang: 'en', formData: {}, submittedAt: now,
  }));
  await new Promise(r => setTimeout(r, 1000));

  // ── sendContact tests ────────────────────────────────────────
  console.log('\n  ── sendContact ──────────────────────────────────────');

  results.push(await testSendContact('empty-name', {
    name: '', email: 'audit@test.com', message: 'Test message for audit verification.', submittedAt: now,
  }));
  await new Promise(r => setTimeout(r, 1000));

  results.push(await testSendContact('invalid-email', {
    name: 'Audit Bot', email: 'not-an-email', message: 'Test message for audit verification.', submittedAt: now,
  }));
  await new Promise(r => setTimeout(r, 1000));

  results.push(await testSendContact('empty-message', {
    name: 'Audit Bot', email: 'audit@test.com', message: '', submittedAt: now,
  }));
  await new Promise(r => setTimeout(r, 1000));

  results.push(await testSendContact('message-too-long', {
    name: 'Audit Bot', email: 'audit@test.com', message: 'A'.repeat(100001), submittedAt: now,
  }));
  await new Promise(r => setTimeout(r, 1000));

  results.push(await testSendContact('timing-check-fail', {
    name: 'Audit Bot', email: 'audit@test.com', message: 'Test message.',
  }));
  await new Promise(r => setTimeout(r, 1000));

  results.push(await testSendContact('method-not-allowed', {}, 'PUT'));

  // ── PERSISTENCE RESULTS ─────────────────────────────────────
  const total = passed + failed;
  const pct = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
  const failureRate = total > 0 ? ((failed / total) * 100).toFixed(1) : '0.0';

  console.log('');
  console.log('═'.repeat(92));
  console.log('  PERSISTENCE RESULTS (Neon request_logs)');
  console.log('═'.repeat(92));
  console.log('');
  console.log(`  ${pad('Test', 32)} ${pad('Status', 8)} ${pad('Stage', 30)} Result`);
  console.log(`  ${'─'.repeat(75)}`);
  for (const r of results) {
    const mark = r.persisted && r.validationStage && r.validationStage !== 'none' ? '✅ PASS' : '❌ FAIL';
    const stageStr = r.validationStage || (r.requestId ? 'PENDING' : 'N/A');
    const traceInfo = r.traceCount ? ` (${r.traceCount} traces)` : '';
    console.log(`  ${pad(r.label, 32)} ${pad(String(r.status), 8)} ${pad(stageStr, 30)} ${mark}${traceInfo}`);
  }
  console.log(`  ${'─'.repeat(75)}`);
  console.log('');
  console.log(`  Total tests:        ${total}`);
  console.log(`  Passed:             ${passed}`);
  console.log(`  Failed:             ${failed}`);
  console.log(`  Success rate:       ${pct}%`);
  console.log(`  Failure rate:       ${failureRate}%`);
  console.log('');

  // ── TRUE SYSTEM COVERAGE (merged) ──────────────────────────
  console.log('═'.repeat(92));
  console.log('  TRUE SYSTEM COVERAGE (memory live + Neon historical, merged)');
  console.log('═'.repeat(92));
  console.log('');

  const totalPaths = 23;
  const coveredList = [
    'sendBrief:methodCheck', 'sendBrief:parseBody', 'sendBrief:honeypotCheck',
    'sendBrief:timingCheck', 'sendBrief:sanitizeAndValidateName',
    'sendBrief:validateEmail', 'sendBrief:validatePrompt',
    'sendBrief:rateLimit:ip', 'sendBrief:rateLimit:email',
    'sendBrief:configCheck', 'sendBrief:queueCheck',
    'sendContact:methodCheck', 'sendContact:parseBody', 'sendContact:honeypotCheck',
    'sendContact:timingCheck', 'sendContact:sanitizeAndValidateName',
    'sendContact:validateEmail', 'sendContact:validateMessage:empty',
    'sendContact:validateMessage:tooLong', 'sendContact:rateLimit:ip',
    'sendContact:rateLimit:email', 'sendContact:configCheck', 'sendContact:queueCheck',
  ];

  // Source 1: Live traces from this test run (memory)
  const liveCovered = coveredList.filter(p => livePaths.has(p));

  // Source 2: Merged coverage endpoint (memory + Neon 24h)
  const mergedCov = await apiMergedCoverage();
  const mergedPaths = mergedCov && mergedCov.coverage
    ? new Set(mergedCov.coverage.coveredPaths || [])
    : new Set();

  // Source 3: Range analytics
  const rangeData = await apiRangeCoverage(24);
  const rangePaths = rangeData && rangeData.aggregation
    ? new Set((rangeData.aggregation.paths || []).map(p => p.pathId))
    : new Set();

  // True coverage: union of all 3 sources
  const allTraced = new Set([...livePaths, ...mergedPaths, ...rangePaths]);
  const covered = coveredList.filter(p => allTraced.has(p));
  const missing = coveredList.filter(p => !allTraced.has(p));
  const coveragePct = ((covered.length / totalPaths) * 100).toFixed(1);

  console.log(`  Total defined paths: ${totalPaths} (11 sendBrief + 12 sendContact)`);
  console.log(`  Live paths (memory): ${livePaths.size} distinct`);
  console.log(`  Merged paths (24h):  ${mergedPaths.size} distinct`);
  console.log(`  Range paths (24h):   ${rangePaths.size} distinct`);
  console.log(`  True coverage:       ${covered.length}/${totalPaths} (${coveragePct}%)`);
  console.log('');

  if (covered.length > 0) {
    console.log('  Covered paths:');
    for (const p of covered) {
      const sources = [];
      if (livePaths.has(p)) sources.push('live');
      if (mergedPaths.has(p)) sources.push('merged');
      if (rangePaths.has(p)) sources.push('range');
      console.log(`    ✅ ${p} [${sources.join(',')}]`);
    }
    console.log('');
  }

  if (missing.length > 0) {
    console.log('  Missing paths (no trace event in any source):');
    for (const p of missing) {
      console.log(`    ⬜ ${p}`);
    }
    console.log('');
  }

  if (covered.length === totalPaths) {
    console.log('  VERDICT: ALL 23 PATHS COVERED (true system coverage)');
  } else if (covered.length >= totalPaths - 2) {
    console.log('  VERDICT: Near-complete — remaining paths require manual trigger (SMTP config, queue overflow)');
  } else {
    console.log('  VERDICT: Coverage gap — investigate missing paths');
  }

  console.log('');
  console.log('═'.repeat(92));
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

runAll().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
