// verify-project-status-constraint.js
// Queries pg_constraint to verify projects.status CHECK constraint allows only:
//   draft, preview, approved, deployed
// Exits with code 0 on success, 1 on failure.

const { query } = require('../lib/db');

const ALLOWED = ['draft', 'preview', 'approved', 'deployed'];

async function verify() {
  console.log('=== Project Status Constraint Verification ===\n');

  // 1. Query pg_constraint for the projects status check
  const r = await query(`
    SELECT conname, pg_get_constraintdef(oid) AS condef
    FROM pg_constraint
    WHERE conrelid = 'projects'::regclass
      AND contype = 'c'
      AND conname LIKE '%status%'
  `);

  if (!r.rows.length) {
    console.error('[FAIL] No CHECK constraint found on projects.status');
    process.exit(1);
  }

  console.log(`Constraint name: ${r.rows[0].conname}`);
  console.log(`Definition:      ${r.rows[0].condef}\n`);

  const condef = r.rows[0].condef;

  // 2. Verify only the 4 allowed states are mentioned
  for (const s of ALLOWED) {
    if (!condef.includes(`'${s}'`)) {
      console.error(`[FAIL] Allowed state '${s}' not found in constraint`);
      process.exit(1);
    }
  }

  // 3. Check that no legacy states are allowed
  const LEGACY = ['processing', 'deploying', 'failed', 'cancelled'];
  for (const s of LEGACY) {
    if (condef.includes(`'${s}'`)) {
      console.error(`[FAIL] Legacy state '${s}' still present in constraint`);
      process.exit(1);
    }
  }

  // 4. No other states beyond the 4 (set comparison, order-independent)
  const found = condef.match(/'([^']+)'/g) || [];
  const unique = [...new Set(found.map(f => f.replace(/'/g, '')))].sort();
  const expected = [...ALLOWED].sort();
  if (unique.length !== expected.length || unique.some((v, i) => v !== expected[i])) {
    console.error(`[FAIL] States in constraint: ${unique.join(', ')}`);
    console.error(`[FAIL] Expected set:       ${expected.join(', ')}`);
    process.exit(1);
  }

  console.log(`[PASS] Constraint allows exactly: draft, preview, approved, deployed`);
  console.log(`[PASS] No legacy states present (processing, deploying, failed, cancelled)`);
  console.log(`\n=== Verification passed ===`);
  process.exit(0);
}

verify().catch(err => {
  console.error(`[FAIL] ${err.message}`);
  process.exit(1);
});
