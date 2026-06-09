// verify-exports.js — Runtime module export contract verification
// Run: node scripts/verify-exports.js

const { deepStrictEqual, strictEqual, throws } = require('assert');

console.log('=== Runtime Export Contract Verification ===\n');

// 1. Both require paths resolve to the same singleton
const r1 = require('../lib/runtime');
const r2 = require('../lib/runtime/index');
strictEqual(r1, r2, 'require("./lib/runtime") !== require("./lib/runtime/index") — module cache divergence');
console.log('[PASS] Both require paths resolve to same singleton');

// 2. All required exports exist and are functions
const EXPECTED_FUNCTIONS = [
  'createProject', 'runPipeline', 'approveProject',
  'getProjectById', 'getProjectInputs', 'listWorkspaceProjects',
  'getExecutionById', 'getProjectPreviews', 'getPreviewById',
  'getDecisionsForProject', 'getProjectStates', 'extractRuntimeState',
  'assertExecutionStatus', 'makeError',
];

for (const key of EXPECTED_FUNCTIONS) {
  const msg = typeof r1[key] === 'function'
    ? `[PASS] ${key} is function`
    : `[FAIL] ${key} is ${typeof r1[key]}`;
  console.log(msg);
  strictEqual(typeof r1[key], 'function', `${key} must be a function`);
}

// 3. Constants exist
strictEqual(typeof r1.EXECUTION_STATUSES, 'object', 'EXECUTION_STATUSES must be object');
strictEqual(Array.isArray(r1.VALID_EXECUTION_STATUSES), true, 'VALID_EXECUTION_STATUSES must be array');
console.log('[PASS] EXECUTION_STATUSES is object');
console.log('[PASS] VALID_EXECUTION_STATUSES is array');

// 4. assertExecutionStatus contract
const { assertExecutionStatus, EXECUTION_STATUSES } = r1;
const VALID = ['queued', 'processing', 'success', 'failed'];
const INVALID = ['completed', 'cancelled', 'bogus', '', null, undefined, 0];

for (const s of VALID) {
  assertExecutionStatus(s, 'test');
}
console.log('[PASS] assertExecutionStatus accepts all valid statuses');

for (const s of INVALID) {
  throws(
    () => assertExecutionStatus(s, 'execution_status'),
    { code: 'INVALID_EXECUTION_STATUS', field: 'execution_status' },
    `Should throw INVALID_EXECUTION_STATUS for "${s}"`
  );
}
console.log('[PASS] assertExecutionStatus rejects all invalid statuses with correct error code');

// 5. EXECUTION_STATUSES contains exactly the 4 valid values
const enumValues = Object.values(EXECUTION_STATUSES).sort();
deepStrictEqual(enumValues, VALID.sort(), 'EXECUTION_STATUSES values mismatch');
console.log('[PASS] EXECUTION_STATUSES enum matches exact whitelist');

// 6. No legacy statuses remain in enum
for (const legacy of ['completed', 'cancelled']) {
  strictEqual(
    enumValues.includes(legacy), false,
    `Legacy status "${legacy}" must not be in EXECUTION_STATUSES`
  );
}
console.log('[PASS] No legacy statuses (completed/cancelled) in enum');

// 7. events bus is exported
strictEqual(typeof r1.events, 'object', 'events must be object');
strictEqual(typeof r1.events.on, 'function', 'events.on must be function');
strictEqual(typeof r1.events.emit, 'function', 'events.emit must be function');
console.log('[PASS] events bus is accessible');

console.log('\n=== All export contract verifications passed ===');
