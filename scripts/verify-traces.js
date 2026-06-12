/**
 * verify-traces.js — Trace coverage verification
 *
 * Reads /api/traces?coverage=true and checks that all 23 validation paths
 * have been executed (memory + Neon history merged).
 *
 * Also falls back to /api/logs?limit=50 if /api/traces is not deployed yet.
 *
 * Usage: node scripts/verify-traces.js
 * Environment: Node 18+ (uses global fetch)
 */

const BASE_URL = "https://web-portfolio-kappa-wheat.vercel.app";

async function getCoverage() {
  const res = await fetch(BASE_URL + "/api/traces?coverage=true");
  if (!res.ok) return null;
  return res.json();
}

async function getLogs() {
  const res = await fetch(BASE_URL + "/api/logs?limit=50");
  if (!res.ok) return [];
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data.entries) return data.entries;
  if (data.logs) return data.logs;
  return [];
}

(async () => {
  console.log(`\n  TRACE COVERAGE VERIFICATION`);
  console.log(`  Target: ${BASE_URL}/api/traces?coverage=true`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('');

  const data = await getCoverage();

  if (!data || !data.coverage) {
    console.log('  \u26a0\ufe0f  /api/traces endpoint not deployed yet (404)');
    console.log('  Falling back to /api/logs for coverage estimation...');
    console.log('');

    const logs = await getLogs();
    const stages = new Set(logs.filter(l => l.validationStage).map(l => l.validationStage));
    const endpoints = new Set(logs.filter(l => l.endpoint).map(l => l.endpoint));

    console.log(`  Logs sampled:       ${logs.length}`);
    console.log(`  Unique endpoints:   ${[...endpoints].join(', ')}`);
    console.log(`  Unique stages seen: ${stages.size}`);
    console.log('');
    console.log('  Validation stages found in recent history:');
    for (const s of [...stages].sort()) {
      console.log(`    ✅ ${s}`);
    }
    console.log('');
    console.log('  ⚠️  Deploy /api/traces.js to unlock full coverage endpoint');
    console.log('  Note: Trace events accumulate in memory + Neon,');
    console.log('  so coverage will be available after deployment.');
    console.log('');
    return;
  }

  const cov = data.coverage;

  console.log(`  Source:             ${cov.source}`);
  console.log(`  Total paths:        ${cov.total}`);
  console.log(`  Executed paths:     ${cov.executed}`);
  console.log(`  Covered:            ${cov.covered}/${cov.total} (${cov.percentage}%)`);
  console.log('');

  if (cov.memory) {
    console.log(`  Memory (live):      ${cov.memory.executed} paths (${cov.memory.percentage}%)`);
  }
  if (cov.neon) {
    console.log(`  Neon (24h):         ${cov.neon.executed} paths (${cov.neon.percentage}%)`);
  }
  console.log('');

  if (cov.coveredPaths && cov.coveredPaths.length > 0) {
    console.log('  Covered paths:');
    for (const p of cov.coveredPaths) {
      console.log(`    ✅ ${p}`);
    }
    console.log('');
  }

  if (cov.missingPaths && cov.missingPaths.length > 0) {
    console.log('  Missing paths:');
    for (const p of cov.missingPaths) {
      console.log(`    ⬜ ${p}`);
    }
    console.log('');
  }

  if (cov.percentage >= 100) {
    console.log('  ✅ PASS: Full coverage — all 23 paths verified');
  } else if (cov.percentage >= 90) {
    console.log('  ⚠️  WARN: Near-full coverage — remaining paths likely require manual trigger');
  } else {
    console.log('  ❌ FAIL: Coverage gap — investigate missing paths');
  }
  console.log('');
})();
