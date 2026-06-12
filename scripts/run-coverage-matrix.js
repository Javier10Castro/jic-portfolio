/**
 * scripts/run-coverage-matrix.js
 *
 * Automated path exerciser for the observability system.
 * Exercises every reachable path in sendBrief + sendContact endpoints,
 * then generates JSON + Markdown coverage reports.
 *
 * Usage:
 *   node scripts/run-coverage-matrix.js                     # localhost:3000
 *   node scripts/run-coverage-matrix.js http://localhost:3000
 *   node scripts/run-coverage-matrix.js https://project.vercel.app
 */

const BASE = process.argv[2] || 'http://localhost:3000';
const API_BRIEF = `${BASE}/api/sendBrief`;
const API_CONTACT = `${BASE}/api/sendContact`;
const API_TRACES = `${BASE}/api/traces`;
const API_TELEMETRY = `${BASE}/api/telemetry`;
const START = Date.now();
const RESULTS = [];

const fetch = typeof globalThis.fetch === 'function' ? globalThis.fetch :
  require('node-fetch');

async function req(url, opts = {}) {
  try {
    const res = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    let body;
    try { body = await res.json(); } catch { body = null; }
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body };
  } catch (e) {
    return { status: 0, error: e.message, body: null, headers: {} };
  }
}

function record(pathId, endpoint, stage, expectedStatus, actualStatus, ok, note) {
  RESULTS.push({
    pathId, endpoint, stage, expectedStatus, actualStatus: actualStatus || 0,
    ok: ok !== false, note: note || '',
    timestamp: new Date().toISOString(),
  });
  const icon = ok !== false ? 'OK' : 'FAIL';
  const statusStr = actualStatus ? `${actualStatus}` : 'ERR';
  console.log(`  ${icon} ${pathId} → ${statusStr}${note ? ` (${note})` : ''}`);
}

function uid() { return `test-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`; }

function briefPayload(overrides = {}) {
  return {
    name: 'Test User',     email: `coverage-${uid()}\u0040test.jic.dev`,
    prompt: 'Test prompt for coverage matrix run',
    submittedAt: Date.now() - 1000,
    lang: 'en', formData: { biz_name: 'TestCo' },
    ...overrides,
  };
}

function contactPayload(overrides = {}) {
  return {
    name: 'Test User',     email: `coverage-${uid()}\u0040test.jic.dev`,
    message: 'Test message for coverage matrix run, at least 10 chars.',
    submittedAt: Date.now() - 1000,
    ...overrides,
  };
}

// ============================================================
// Reachable paths (not reachable: parseBody, configCheck,
//   queueCheck, handlerError — these require env/edge conditions)
// ============================================================
const PATHS = [
  // sendBrief
  { id: 'sendBrief:methodCheck', endpoint: 'sendBrief', stage: 'methodCheck',
    run: () => req(API_BRIEF, { method: 'GET' }),
    expectedStatus: [405], reachable: true },
  { id: 'sendBrief:timingCheck', endpoint: 'sendBrief', stage: 'timingCheck',
    run: () => req(API_BRIEF, { method: 'POST', body: JSON.stringify({ ...briefPayload(), submittedAt: 0 }) }),
    expectedStatus: [400], reachable: true },
  { id: 'sendBrief:sanitizeAndValidateName', endpoint: 'sendBrief', stage: 'sanitizeAndValidateName',
    run: () => req(API_BRIEF, { method: 'POST', body: JSON.stringify({ ...briefPayload(), name: '' }) }),
    expectedStatus: [400], reachable: true },
  { id: 'sendBrief:validateEmail', endpoint: 'sendBrief', stage: 'validateEmail',
    run: () => req(API_BRIEF, { method: 'POST', body: JSON.stringify({ ...briefPayload(), email: 'not-an-email' }) }),
    expectedStatus: [400], reachable: true },
  { id: 'sendBrief:validatePrompt', endpoint: 'sendBrief', stage: 'validatePrompt',
    run: () => req(API_BRIEF, { method: 'POST', body: JSON.stringify({ ...briefPayload(), prompt: '' }) }),
    expectedStatus: [400], reachable: true },
  { id: 'sendBrief:honeypotCheck', endpoint: 'sendBrief', stage: 'honeypotCheck',
    run: () => req(API_BRIEF, { method: 'POST', body: JSON.stringify({ ...briefPayload(), bot: 'spambot', bot_timestamp: Date.now() }) }),
    expectedStatus: [200], reachable: true },
  { id: 'sendBrief:submitted', endpoint: 'sendBrief', stage: 'submitted',
    run: () => req(API_BRIEF, { method: 'POST', body: JSON.stringify(briefPayload()) }),
    expectedStatus: [200, 202], reachable: true },

  // sendContact
  { id: 'sendContact:methodCheck', endpoint: 'sendContact', stage: 'methodCheck',
    run: () => req(API_CONTACT, { method: 'PUT' }),
    expectedStatus: [405], reachable: true },
  { id: 'sendContact:timingCheck', endpoint: 'sendContact', stage: 'timingCheck',
    run: () => req(API_CONTACT, { method: 'POST', body: JSON.stringify({ ...contactPayload(), submittedAt: 0 }) }),
    expectedStatus: [400], reachable: true },
  { id: 'sendContact:sanitizeAndValidateName', endpoint: 'sendContact', stage: 'sanitizeAndValidateName',
    run: () => req(API_CONTACT, { method: 'POST', body: JSON.stringify({ ...contactPayload(), name: '' }) }),
    expectedStatus: [400], reachable: true },
  { id: 'sendContact:validateEmail', endpoint: 'sendContact', stage: 'validateEmail',
    run: () => req(API_CONTACT, { method: 'POST', body: JSON.stringify({ ...contactPayload(), email: 'not-an-email' }) }),
    expectedStatus: [400], reachable: true },
  { id: 'sendContact:validateMessage:empty', endpoint: 'sendContact', stage: 'validateMessage:empty',
    run: () => req(API_CONTACT, { method: 'POST', body: JSON.stringify({ ...contactPayload(), message: '' }) }),
    expectedStatus: [400], reachable: true },
  { id: 'sendContact:validateMessage:tooLong', endpoint: 'sendContact', stage: 'validateMessage:tooLong',
    run: () => req(API_CONTACT, { method: 'POST', body: JSON.stringify({ ...contactPayload(), message: 'x'.repeat(100001) }) }),
    expectedStatus: [400], reachable: true },
  { id: 'sendContact:honeypotCheck', endpoint: 'sendContact', stage: 'honeypotCheck',
    run: () => req(API_CONTACT, { method: 'POST', body: JSON.stringify({ ...contactPayload(), bot: 'spambot' }) }),
    expectedStatus: [200], reachable: true },
  { id: 'sendContact:submitted', endpoint: 'sendContact', stage: 'submitted',
    run: () => req(API_CONTACT, { method: 'POST', body: JSON.stringify(contactPayload()) }),
    expectedStatus: [200, 202], reachable: true },
];

// Non-reachable paths (documented limitations)
const UNREACHABLE_PATHS = [
  { id: 'sendBrief:parseBody', reason: 'Vercel Edge Runtime intercepts malformed JSON before handler', status: 'unreachable' },
  { id: 'sendContact:parseBody', reason: 'Vercel Edge Runtime intercepts malformed JSON before handler', status: 'unreachable' },
  { id: 'sendBrief:configCheck', reason: 'SMTP credentials are configured in production', status: 'unreachable' },
  { id: 'sendContact:configCheck', reason: 'SMTP credentials are configured in production', status: 'unreachable' },
  { id: 'sendBrief:queueCheck', reason: 'Requires queue depth >100; not reproducible via normal HTTP', status: 'unreachable' },
  { id: 'sendContact:queueCheck', reason: 'Requires queue depth >100; not reproducible via normal HTTP', status: 'unreachable' },
  { id: 'sendBrief:handlerError', reason: 'Requires PDF generation failure or unexpected runtime exception', status: 'unreachable' },
  { id: 'sendContact:handlerError', reason: 'Requires enqueue failure or unexpected runtime exception', status: 'unreachable' },
];

async function main() {
  console.log(`\n=== Observability Coverage Matrix ===`);
  console.log(`Target: ${BASE}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  // --- Phase 1: Exercise all reachable paths ---
  console.log('--- Phase 1: Exercising reachable paths ---\n');
  for (const p of PATHS) {
    process.stdout.write(`  → ${p.id}... `);
    const result = await p.run();
    const ok = p.expectedStatus.includes(result.status);
    record(p.id, p.endpoint, p.stage, p.expectedStatus[0], result.status, ok,
      ok ? '' : `expected ${p.expectedStatus[0]}, got ${result.status}`);
  }

  // --- Phase 2: Verify Neon persistence ---
  console.log('\n--- Phase 2: Verifying Neon persistence ---\n');

  // Wait briefly for Neon writes to propagate
  await new Promise(r => setTimeout(r, 2000));

  // Fetch coverage from /api/traces
  process.stdout.write('  → Fetching merged coverage... ');
  const cov = await req(`${API_TRACES}?coverage=true`);
  const coverageData = cov.body && cov.body.coverage;
  if (coverageData) {
    record('system:coverage', 'system', 'merged', 200, cov.status, true,
      `${coverageData.percentage}% (${coverageData.covered}/${coverageData.total})`);
    console.log(`OK: ${coverageData.percentage}% coverage (${coverageData.covered}/${coverageData.total})`);
  } else {
    record('system:coverage', 'system', 'merged', 200, cov.status, false, 'No coverage data returned');
    console.log(`FAIL: No coverage data`);
  }

  // Fetch heatmap
  process.stdout.write('  → Fetching heatmap... ');
  const heatmap = await req(`${API_TRACES}?heatmap=true&hours=2`);
  if (heatmap.body && heatmap.body.rows) {
    record('system:heatmap', 'system', 'heatmap', 200, heatmap.status, true,
      `${heatmap.body.rows.length} path entries, ${heatmap.body.total} total events`);
    console.log(`OK: ${heatmap.body.rows.length} path entries from ${heatmap.body.total} events`);
  } else {
    record('system:heatmap', 'system', 'heatmap', 200, heatmap.status, false, 'No heatmap data');
    console.log(`FAIL: No heatmap data`);
  }

  // Fetch timeline
  process.stdout.write('  → Fetching timeline... ');
  const timeline = await req(`${API_TRACES}?timeline=true&hours=2&limit=100`);
  if (timeline.body && timeline.body.byRequest) {
    const reqCount = timeline.body.totalRequests || 0;
    const evCount = timeline.body.totalEvents || 0;
    record('system:timeline', 'system', 'timeline', 200, timeline.status, true,
      `${reqCount} requests, ${evCount} events`);
    console.log(`OK: ${reqCount} requests with ${evCount} events`);
  } else {
    record('system:timeline', 'system', 'timeline', 200, timeline.status, false, 'No timeline data');
    console.log(`FAIL: No timeline data`);
  }

  // Fetch telemetry health
  process.stdout.write('  → Fetching telemetry health... ');
  const health = await req(`${API_TELEMETRY}?type=health`);
  if (health.body && health.body.status === 'ok') {
    record('system:health', 'system', 'health', 200, health.status, true, 'System healthy');
    console.log(`OK: System healthy`);
  } else {
    record('system:health', 'system', 'health', 200, health.status, false,
      health.body ? `status: ${health.body.status}` : 'No health data');
    console.log(`FAIL: System not healthy`);
  }

  // --- Phase 3: Verify no internal leakage ---
  console.log('\n--- Phase 3: Leakage audit ---\n');
  const LEAK_PATTERNS = [
    'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'gmail', 'password', 'DATABASE_URL',
    'UPSTASH_REDIS', 'secret', 'token', 'api_key',
  ];
  for (const resp of [cov, heatmap, timeline, health]) {
    if (resp.body) {
      const bodyStr = JSON.stringify(resp.body);
      for (const pat of LEAK_PATTERNS) {
        if (bodyStr.toLowerCase().includes(pat.toLowerCase())) {
          record('system:leakage', 'system', 'leakage', 0, resp.status, false,
            `LEAK DETECTED: pattern "${pat}" in response body`);
        }
      }
    }
  }

  // Check response headers for info leakage
  const SENSITIVE_HEADERS = ['x-tracer-debug', 'x-powered-by'];
  for (const resp of [cov, heatmap, timeline, health]) {
    for (const hdr of SENSITIVE_HEADERS) {
      if (resp.headers && resp.headers[hdr]) {
        record('system:leakage', 'system', 'header_leak', 0, resp.status, false,
          `Header leak: ${hdr}: ${resp.headers[hdr]}`);
      }
    }
  }
  const leaked = RESULTS.filter(r => r.pathId === 'system:leakage' && !r.ok);
  if (leaked.length === 0) {
    record('system:leakage', 'system', 'header_leak', 200, 200, true, 'No sensitive data leaked');
    console.log('  OK No sensitive data leaked in responses');
  } else {
    console.log(`  FAIL ${leaked.length} leakage issues found`);
  }

  // --- Generate report ---
  const elapsed = Date.now() - START;
  const totalPaths = PATHS.length + UNREACHABLE_PATHS.length;
  const exercised = PATHS.length;
  const unreachable = UNREACHABLE_PATHS.length;
  const passed = RESULTS.filter(r => r.ok).length;
  const failed = RESULTS.filter(r => !r.ok).length;
  const reachablePassed = RESULTS.filter(r => r.ok && PATHS.some(p => p.id === r.pathId)).length;
  const reachableFailed = RESULTS.filter(r => !r.ok && PATHS.some(p => p.id === r.pathId)).length;

  // Keep rate-limit paths separated (they need careful timing)
  const rateLimitPaths = RESULTS.filter(r => r.pathId.includes('rateLimit'));
  const standardResults = RESULTS.filter(r => !r.pathId.includes('rateLimit') && !r.pathId.startsWith('system:'));

  const report = {
    meta: {
      timestamp: new Date().toISOString(),
      target: BASE,
      durationMs: elapsed,
    },
    summary: {
      totalPaths,
      exercised,
      reachablePassed,
      reachableFailed,
      unreachable,
      unreachablePaths: UNREACHABLE_PATHS.map(p => ({ id: p.id, reason: p.reason })),
      percentage: exercised > 0 ? Math.round((reachablePassed / exercised) * 100) : 0,
      systemChecksPassed: RESULTS.filter(r => r.pathId.startsWith('system:') && r.ok).length,
      systemChecksFailed: RESULTS.filter(r => r.pathId.startsWith('system:') && !r.ok).length,
    },
    results: RESULTS,
  };

  // Write JSON report
  const fs = require('fs');
  const path = require('path');
  const outDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'coverage-matrix-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\n  JSON report: ${jsonPath}`);

  // Write Markdown report
  const mdPath = path.join(outDir, 'coverage-matrix-report.md');
  const lines = [];
  lines.push(`# Observability Coverage Matrix Report`);
  lines.push(``);
  lines.push(`- **Target**: \`${BASE}\``);
  lines.push(`- **Date**: ${new Date().toISOString()}`);
  lines.push(`- **Duration**: ${elapsed}ms`);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Total defined paths | ${totalPaths} |`);
  lines.push(`| Reachable (exercisable) | ${exercised} |`);
  lines.push(`| Unreachable (env/edge) | ${unreachable} |`);
  lines.push(`| Reachable passed | ${reachablePassed} |`);
  lines.push(`| Reachable failed | ${reachableFailed} |`);
  lines.push(`| System checks passed | ${RESULTS.filter(r => r.pathId.startsWith('system:') && r.ok).length} |`);
  lines.push(`| System checks failed | ${RESULTS.filter(r => r.pathId.startsWith('system:') && !r.ok).length} |`);
  lines.push(`| Coverage | ${coverageData ? `${coverageData.percentage}%` : 'N/A'} |`);
  lines.push(``);
  lines.push(`## Path Results`);
  lines.push(``);
  lines.push(`| Path ID | Expected | Actual | Status | Note |`);
  lines.push(`|---|---|---|---|---|`);
  for (const r of standardResults) {
    lines.push(`| ${r.pathId} | ${r.expectedStatus} | ${r.actualStatus} | ${r.ok ? '✅' : '❌'} | ${r.note} |`);
  }
  if (rateLimitPaths.length > 0) {
    lines.push(``);
    lines.push(`### Rate Limit Paths (require delay)`);
    lines.push(``);
    lines.push(`| Path ID | Expected | Actual | Status | Note |`);
    lines.push(`|---|---|---|---|---|`);
    for (const r of rateLimitPaths) {
      lines.push(`| ${r.pathId} | ${r.expectedStatus} | ${r.actualStatus} | ${r.ok ? '✅' : '❌'} | ${r.note} |`);
    }
  }
  lines.push(``);
  lines.push(`### Unreachable Paths`);
  lines.push(``);
  lines.push(`| Path ID | Reason |`);
  lines.push(`|---|---|`);
  for (const p of UNREACHABLE_PATHS) {
    lines.push(`| ${p.id} | ${p.reason} |`);
  }
  lines.push(``);
  lines.push(`## Endpoint Validation`);
  lines.push(``);
  lines.push(`| Endpoint | Status |`);
  lines.push(`|---|---|`);
  lines.push(`| \`/api/traces?coverage=true\` | ${cov.status} |`);
  lines.push(`| \`/api/traces?heatmap=true\` | ${heatmap.status} |`);
  lines.push(`| \`/api/traces?timeline=true\` | ${timeline.status} |`);
  lines.push(`| \`/api/telemetry?type=health\` | ${health.status} |`);
  lines.push(``);
  lines.push(`## Leakage Audit`);
  lines.push(``);
  lines.push(`| Check | Status |`);
  lines.push(`|---|---|`);
  lines.push(`| No sensitive data in bodies | ${leaked.length === 0 ? '✅ Pass' : '❌ Fail'} |`);
  lines.push(`| No sensitive headers leaked | ${leaked.length === 0 ? '✅ Pass' : '❌ Fail'} |`);
  lines.push(``);
  lines.push(`_Generated by \`scripts/run-coverage-matrix.js\`_`);

  fs.writeFileSync(mdPath, lines.join('\n'));
  console.log(`  Markdown report: ${mdPath}\n`);

  // Summary line
  const pct = exercised > 0 ? Math.round((reachablePassed / exercised) * 100) : 0;
  console.log(`=== Coverage Matrix: ${reachablePassed}/${exercised} reachable paths passed (${pct}%) ===`);
  if (reachableFailed > 0) {
    console.log(`FAILED paths:`);
    for (const r of RESULTS.filter(r => !r.ok && PATHS.some(p => p.id === r.pathId))) {
      console.log(`  - ${r.pathId}: ${r.note}`);
    }
  }
  process.exit(reachableFailed > 0 ? 1 : 0);
}

main();
