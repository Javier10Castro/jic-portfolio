const runtime = require('./lib/runtime');

console.log('=== Runtime Safe Test ===\n');

const TESTS = [];

function test(name, fn) {
  TESTS.push({ name, fn });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const t of TESTS) {
    try {
      await t.fn();
      console.log(`  ✓ ${t.name}`);
      passed++;
    } catch (e) {
      console.log(`  ✗ ${t.name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${TESTS.length} total ===`);
  process.exit(failed > 0 ? 1 : 0);
}

// === BOOTSTRAP TESTS ===

test('bootstrap loads without error', () => {
  const bootstrap = require('./lib/runtime/bootstrap');
  if (typeof bootstrap !== 'function') throw new Error('bootstrap is not a function');
});

test('bootstrap is idempotent (calling twice is safe)', () => {
  const bootstrap = require('./lib/runtime/bootstrap');
  const r1 = bootstrap();
  const r2 = bootstrap();
  if (r1 !== r2) throw new Error('bootstrap returned different results on second call');
});

// === VALIDATOR TESTS ===

test('assertRequired throws on undefined', () => {
  const v = require('./lib/runtime/validators');
  let threw = false;
  try { v.assertRequired(undefined, 'name'); } catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong error code: ' + e.code); }
  if (!threw) throw new Error('Should have thrown');
});

test('assertRequired throws on null', () => {
  const v = require('./lib/runtime/validators');
  let threw = false;
  try { v.assertRequired(null, 'name'); } catch (e) { threw = true; }
  if (!threw) throw new Error('Should have thrown');
});

test('assertRequired throws on empty string', () => {
  const v = require('./lib/runtime/validators');
  let threw = false;
  try { v.assertRequired('', 'name'); } catch (e) { threw = true; }
  if (!threw) throw new Error('Should have thrown');
});

test('assertRequired passes on valid string', () => {
  const v = require('./lib/runtime/validators');
  const result = v.assertRequired('hello', 'name');
  if (result !== 'hello') throw new Error('Should return the value');
});

test('assertString passes trimmed value', () => {
  const v = require('./lib/runtime/validators');
  const result = v.assertString('  hello  ', 'name');
  if (result !== 'hello') throw new Error('Should trim: got "' + result + '"');
});

test('assertString throws on number', () => {
  const v = require('./lib/runtime/validators');
  let threw = false;
  try { v.assertString(42, 'name'); } catch (e) { threw = true; }
  if (!threw) throw new Error('Should have thrown');
});

test('assertUUID validates format', () => {
  const v = require('./lib/runtime/validators');
  let threw = false;
  try { v.assertUUID('not-a-uuid', 'id'); } catch (e) { threw = true; }
  if (!threw) throw new Error('Should have thrown on invalid UUID');
});

test('assertUUID accepts valid UUID', () => {
  const v = require('./lib/runtime/validators');
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  const result = v.assertUUID(uuid, 'id');
  if (result !== uuid) throw new Error('Should return the UUID');
});

test('makeError produces structured error', () => {
  const v = require('./lib/runtime/validators');
  const err = v.makeError('TEST_CODE', 'test message', 'test_field');
  if (!err.error) throw new Error('Missing error flag');
  if (err.code !== 'TEST_CODE') throw new Error('Wrong code');
  if (err.field !== 'test_field') throw new Error('Wrong field');
  if (!err.timestamp) throw new Error('Missing timestamp');
});

// === createProject VALIDATION TESTS ===

test('createProject throws on missing workspace_id', async () => {
  let threw = false;
  try { await runtime.createProject(undefined, '550e8400-e29b-41d4-a716-446655440000', 'Test Project'); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); if (!e.field) throw new Error('Missing field'); }
  if (!threw) throw new Error('Should have thrown');
});

test('createProject throws on missing user_id', async () => {
  let threw = false;
  try { await runtime.createProject('550e8400-e29b-41d4-a716-446655440000', undefined, 'Test Project'); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should have thrown');
});

test('createProject throws on missing name', async () => {
  let threw = false;
  try { await runtime.createProject('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', undefined); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); if (e.field !== 'name') throw new Error('Wrong field: ' + e.field); }
  if (!threw) throw new Error('Should have thrown');
});

test('createProject throws on empty name', async () => {
  let threw = false;
  try { await runtime.createProject('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', ''); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should have thrown');
});

test('createProject throws on non-UUID workspace_id', async () => {
  let threw = false;
  try { await runtime.createProject('not-a-uuid', '550e8400-e29b-41d4-a716-446655440000', 'Test'); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); if (e.field !== 'workspace_id') throw new Error('Wrong field: ' + e.field); }
  if (!threw) throw new Error('Should have thrown');
});

// === runPipeline VALIDATION TESTS ===

test('runPipeline throws on missing project_id', async () => {
  let threw = false;
  try { await runtime.runPipeline(undefined, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); if (e.field !== 'project_id') throw new Error('Wrong field: ' + e.field); }
  if (!threw) throw new Error('Should have thrown');
});

test('runPipeline throws on missing workspace_id', async () => {
  let threw = false;
  try { await runtime.runPipeline('550e8400-e29b-41d4-a716-446655440000', undefined, '550e8400-e29b-41d4-a716-446655440000'); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should have thrown');
});

test('runPipeline throws on missing execution_id', async () => {
  let threw = false;
  try { await runtime.runPipeline('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', undefined); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); if (e.field !== 'execution_id') throw new Error('Wrong field: ' + e.field); }
  if (!threw) throw new Error('Should have thrown');
});

// === approveProject VALIDATION TESTS ===

test('approveProject throws on missing project_id', async () => {
  let threw = false;
  try { await runtime.approveProject(undefined, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should have thrown');
});

test('approveProject throws on missing workspace_id', async () => {
  let threw = false;
  try { await runtime.approveProject('550e8400-e29b-41d4-a716-446655440000', undefined, '550e8400-e29b-41d4-a716-446655440000'); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should have thrown');
});

test('approveProject throws on missing user_id', async () => {
  let threw = false;
  try { await runtime.approveProject('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', undefined); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should have thrown');
});

// === structured error format test ===

test('runtime exports makeError', () => {
  if (typeof runtime.makeError !== 'function') throw new Error('makeError not exported');
  const err = runtime.makeError('TEST', 'msg', 'f');
  if (!err.error) throw new Error('error flag missing');
  if (!err.timestamp) throw new Error('timestamp missing');
  if (err.code !== 'TEST') throw new Error('code mismatch');
});

// === ENGINE INTEGRITY TESTS ===

test('runtime exports all original functions', () => {
  const expected = ['createProject', 'runPipeline', 'approveProject', 'getProjectById',
    'getProjectInputs', 'listWorkspaceProjects', 'getExecutionById',
    'getProjectPreviews', 'getPreviewById', 'getDecisionsForProject',
    'getProjectStates', 'extractRuntimeState', 'makeError'];
  const missing = expected.filter(n => typeof runtime[n] !== 'function');
  if (missing.length) throw new Error('Missing: ' + missing.join(', '));
  if (typeof runtime.events !== 'object' || runtime.events === null) throw new Error('events should be an object');
});

test('runtime events bus is accessible', () => {
  if (!runtime.events) throw new Error('events not exported');
  if (typeof runtime.events.emit !== 'function') throw new Error('events.emit not a function');
  if (typeof runtime.events.on !== 'function') throw new Error('events.on not a function');
});

test('plan engine is untouched', () => {
  const plan = require('./lib/plan');
  if (typeof plan.compile !== 'function') throw new Error('plan.compile not a function');
});

test('design-system engine is untouched', () => {
  const ds = require('./lib/design-system');
  if (typeof ds.buildDesignSystem !== 'function') throw new Error('ds.buildDesignSystem not a function');
});

runTests();
