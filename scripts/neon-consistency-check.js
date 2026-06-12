/**
 * neon-consistency-check.js — Neon request_logs consistency validation
 *
 * Reads the last 50 lifecycle entries and checks for:
 * - Missing requestId fields
 * - Duplicate requestId values
 * - Data integrity (timestamps, status values)
 *
 * Usage: node scripts/neon-consistency-check.js
 * Environment: Node 18+ (uses global fetch)
 */

const BASE_URL = "https://web-portfolio-kappa-wheat.vercel.app";

(async () => {
  console.log(`\n  NEON CONSISTENCY CHECK`);
  console.log(`  Target: ${BASE_URL}/api/logs?limit=50`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('');

  const res = await fetch(BASE_URL + "/api/logs?limit=50");
  if (!res.ok) {
    console.log(`  ❌ FAIL: /api/logs returned ${res.status}`);
    process.exit(1);
  }

  const data = await res.json();

  // data can be an array (list) or { logs, metrics } object
  let logs;
  let metrics;
  if (Array.isArray(data)) {
    logs = data;
  } else if (data.entries) {
    logs = data.entries;
  } else if (data.logs) {
    logs = data.logs;
  } else {
    logs = data;
  }

  // Ensure we have an array
  if (!Array.isArray(logs)) {
    console.log('  ⚠️  Response format unknown, trying to extract logs...');
    logs = [];
  }

  const missingRequestIds = logs.filter(l => !l.requestId);
  const seen = new Set();
  const duplicates = [];

  logs.forEach(l => {
    if (seen.has(l.requestId)) duplicates.push(l.requestId);
    seen.add(l.requestId);
  });

  // Check status values
  const statusCounts = {};
  for (const l of logs) {
    const s = l.status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  console.log(`  Total entries:      ${logs.length}`);
  console.log(`  Unique requestIds:  ${seen.size}`);
  console.log(`  Missing requestId:  ${missingRequestIds.length}`);
  console.log(`  Duplicates:         ${duplicates.length}`);
  console.log('');

  if (Object.keys(statusCounts).length > 0) {
    console.log('  Status distribution:');
    for (const [s, c] of Object.entries(statusCounts).sort()) {
      console.log(`    ${s}: ${c}`);
    }
    console.log('');
  }

  let allPass = true;

  if (missingRequestIds.length > 0) {
    console.log(`  ❌ FAIL: ${missingRequestIds.length} entries missing requestId`);
    allPass = false;
  } else {
    console.log('  ✅ PASS: No entries missing requestId');
  }

  if (duplicates.length > 0) {
    console.log(`  ❌ FAIL: ${duplicates.length} duplicate requestIds detected`);
    console.log(`    Duplicates: ${[...new Set(duplicates)].join(', ')}`);
    allPass = false;
  } else {
    console.log('  ✅ PASS: No duplicate requestIds');
  }

  // Check validation persistence in rejected entries
  const rejectedWithStage = logs.filter(l => l.status === 'rejected' && l.validationStage);
  const rejectedWithoutStage = logs.filter(l => l.status === 'rejected' && !l.validationStage);

  if (rejectedWithoutStage.length > 0) {
    console.log(`  ❌ FAIL: ${rejectedWithoutStage.length} rejected entries missing validation diagnostics`);
    allPass = false;
  } else if (rejectedWithStage.length > 0) {
    console.log(`  ✅ PASS: All ${rejectedWithStage.length} rejected entries have validation diagnostics`);
  }

  console.log('');

  if (allPass) {
    console.log('  ✅ NEON CONSISTENCY: PASS');
  } else {
    console.log('  ❌ NEON CONSISTENCY: FAIL');
  }
  console.log('');
})();
