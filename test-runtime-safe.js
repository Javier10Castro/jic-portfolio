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
  catch (e) { threw = true; if (e.code !== 'INVALID_ID_FORMAT') throw new Error('Wrong code: ' + e.code); }
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

test('normalizeId throws on non-UUID workspace_id', async () => {
  let threw = false;
  try { normalizer.normalizeId('not-a-uuid', 'workspace_id'); } catch (e) { threw = true; if (e.code !== 'INVALID_ID_FORMAT') throw new Error('Wrong code: ' + e.code); if (e.field !== 'workspace_id') throw new Error('Wrong field: ' + e.field); }
  if (!threw) throw new Error('Should have thrown on non-UUID string');
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

test('runPipeline accepts undefined execution_id (auto-generates)', async () => {
  let execIdError = false;
  try { await runtime.runPipeline('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', undefined); }
  catch (e) { if (e.code === 'INVALID_INPUT' && e.field === 'execution_id') execIdError = true; }
  if (execIdError) throw new Error('execution_id should be optional — undefined must auto-generate');
});

test('runPipeline accepts null execution_id (auto-generates)', async () => {
  let execIdError = false;
  try { await runtime.runPipeline('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', null); }
  catch (e) { if (e.code === 'INVALID_INPUT' && e.field === 'execution_id') execIdError = true; }
  if (execIdError) throw new Error('execution_id should be optional — null must auto-generate');
});

test('runPipeline accepts empty string execution_id (auto-generates)', async () => {
  let execIdError = false;
  try { await runtime.runPipeline('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', ''); }
  catch (e) { if (e.code === 'INVALID_INPUT' && e.field === 'execution_id') execIdError = true; }
  if (execIdError) throw new Error('execution_id should be optional — empty string must auto-generate');
});

test('runPipeline normalizes non-UUID execution_id to UUID', async () => {
  let execIdError = false;
  try { await runtime.runPipeline('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'my-custom-id'); }
  catch (e) { if (e.code === 'INVALID_INPUT' && e.field === 'execution_id') execIdError = true; }
  if (execIdError) throw new Error('non-UUID execution_id should auto-normalize to UUID');
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
  catch (e) { threw = true; if (e.code !== 'INVALID_ID_FORMAT') throw new Error('Wrong code: ' + e.code); }
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
    'getProjectStates', 'extractRuntimeState', 'formDataToPromptMaestro', 'makeError'];
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

test('formDataToPromptMaestro produces parsable sections format', () => {
  const rt = require('./lib/runtime');
  if (typeof rt.formDataToPromptMaestro !== 'function') throw new Error('formDataToPromptMaestro not exported');
  const fd = { biz_name: 'Test Co', arq_paginas: ['A','B'], seo_keywords: ['k1','k2'], conv_cta: 'CTA', brand_estilo: ['moderno'], brand_nivel: '4' };
  const pm = rt.formDataToPromptMaestro(fd);
  if (!pm.startsWith('# PROMPT MAESTRO')) throw new Error('Should start with header');
  if (!/^## \d+\.\s+.+/m.test(pm)) throw new Error('Missing section header');
  if (!/^\*\*.+?:\*\*\s+.+/m.test(pm)) throw new Error('Missing field format');
  if (!pm.includes('Test Co')) throw new Error('Should include biz_name');
  if (!pm.includes('A, B')) throw new Error('Should include arq_paginas as comma-separated');
  const plan = require('./lib/plan');
  const ir = plan.compile(pm);
  if (!ir.project.identity || !ir.project.identity.business_name) throw new Error('plan.compile should extract business_name');
  if (!ir.project.structure || !ir.project.structure.pages) throw new Error('plan.compile should extract pages');
  if (!ir.project.conversion || !ir.project.conversion.main_cta) throw new Error('plan.compile should extract main_cta');
});

test('formDataToPromptMaestro returns safe fallback for null input', () => {
  const rt = require('./lib/runtime');
  const pm = rt.formDataToPromptMaestro(null);
  if (typeof pm !== 'string' || !pm.startsWith('#')) throw new Error('Should return safe fallback: ' + pm);
  const pm2 = rt.formDataToPromptMaestro(undefined);
  if (typeof pm2 !== 'string' || !pm2.startsWith('#')) throw new Error('Should return safe fallback for undefined');
  const pm3 = rt.formDataToPromptMaestro('not an object');
  if (typeof pm3 !== 'string' || !pm3.startsWith('#')) throw new Error('Should return safe fallback for string');
});

test('formDataToPromptMaestro handles empty arrays as No especificado', () => {
  const rt = require('./lib/runtime');
  const pm = rt.formDataToPromptMaestro({ biz_name: 'X', arq_paginas: [], seo_keywords: [] });
  const plan = require('./lib/plan');
  const ir = plan.compile(pm);
  if (ir.project.identity.business_name !== 'X') throw new Error('Should extract biz_name');
  if (!pm.includes('No especificado')) throw new Error('Should include fallback for empty arrays');
});

// === RESOLVER SAFE TESTS ===

const resolver = require('./lib/resolver');

test('resolver exports all functions', () => {
  const expected = ['resolveWorkspace', 'resolveUser', 'resolveContext', 'clearCache'];
  const missing = expected.filter(n => typeof resolver[n] !== 'function');
  if (missing.length) throw new Error('Missing: ' + missing.join(', '));
});

test('resolveWorkspace throws with no args', async () => {
  let threw = false;
  try { await resolver.resolveWorkspace({}); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should have thrown');
});

test('resolveWorkspace throws on invalid UUID format for workspace_id', async () => {
  let threw = false;
  try { await resolver.resolveWorkspace({ workspace_id: 'not-a-uuid' }); }
  catch (e) { threw = true; if (e.code !== 'INVALID_ID_FORMAT') throw new Error('Wrong code: ' + e.code); if (e.field !== 'workspace_id') throw new Error('Wrong field: ' + e.field); }
  if (!threw) throw new Error('Should have thrown');
});

test('resolveUser throws with no user_id', async () => {
  let threw = false;
  try { await resolver.resolveUser({ workspace_id: '550e8400-e29b-41d4-a716-446655440000' }); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); if (e.field !== 'user_id') throw new Error('Wrong field: ' + e.field); }
  if (!threw) throw new Error('Should have thrown');
});

test('resolveUser throws with no workspace_id', async () => {
  let threw = false;
  try { await resolver.resolveUser({ user_id: '550e8400-e29b-41d4-a716-446655440000' }); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); if (e.field !== 'workspace_id') throw new Error('Wrong field: ' + e.field); }
  if (!threw) throw new Error('Should have thrown');
});

test('resolveContext throws on missing workspace (no slug, no id)', async () => {
  let threw = false;
  try { await resolver.resolveContext({ user_id: '550e8400-e29b-41d4-a716-446655440000' }); }
  catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); if (e.field !== 'workspace_id') throw new Error('Wrong field: ' + e.field); }
  if (!threw) throw new Error('Should have thrown');
});

test('clearCache resets without error', () => {
  resolver.clearCache();
});

// === ID NORMALIZER TESTS ===

const normalizer = require('./lib/runtime/id-normalizer');

test('id-normalizer exports all functions', () => {
  const expected = ['isUUID', 'normalizeId', 'normalizeProjectId', 'safeUUID', 'uuidv5', 'UUID_REGEX'];
  const missing = expected.filter(n => typeof normalizer[n] === 'undefined');
  if (missing.length) throw new Error('Missing exports: ' + missing.join(', '));
});

test('isUUID detects valid UUID v4', () => {
  if (!normalizer.isUUID('550e8400-e29b-41d4-a716-446655440000')) throw new Error('Should accept valid UUID');
  if (!normalizer.isUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')) throw new Error('Should accept valid UUID');
  if (!normalizer.isUUID('00000000-0000-4000-8000-000000000000')) throw new Error('Should accept nil UUID v4 variant');
});

test('isUUID rejects non-UUID strings', () => {
  if (normalizer.isUUID('not-a-uuid')) throw new Error('Should reject plain string');
  if (normalizer.isUUID('proj_test_001')) throw new Error('Should reject custom ID format');
  if (normalizer.isUUID('')) throw new Error('Should reject empty string');
  if (normalizer.isUUID(123)) throw new Error('Should reject number');
  if (normalizer.isUUID(null)) throw new Error('Should reject null');
  if (normalizer.isUUID(undefined)) throw new Error('Should reject undefined');
});

test('normalizeId passes through valid UUID unchanged', () => {
  const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  const result = normalizer.normalizeId(uuid, 'test_id');
  if (result !== uuid) throw new Error('Should return UUID unchanged: got ' + result);
});

test('normalizeId throws on null/undefined', () => {
  let threw = false;
  try { normalizer.normalizeId(null, 'field'); } catch (e) { threw = true; if (e.code !== 'INVALID_ID_FORMAT') throw new Error('Wrong code'); }
  if (!threw) throw new Error('Should throw on null');

  threw = false;
  try { normalizer.normalizeId(undefined, 'field'); } catch (e) { threw = true; }
  if (!threw) throw new Error('Should throw on undefined');
});

test('normalizeId throws on non-string type', () => {
  let threw = false;
  try { normalizer.normalizeId(42, 'field'); } catch (e) { threw = true; if (e.code !== 'INVALID_ID_FORMAT') throw new Error('Wrong code'); }
  if (!threw) throw new Error('Should throw on number');
});

test('normalizeId throws on non-UUID project_id', () => {
  let threw = false;
  try { normalizer.normalizeId('proj_test_001', 'project_id'); } catch (e) { threw = true; if (e.code !== 'INVALID_ID_FORMAT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should throw on non-UUID string');
});

test('normalizeId throws on non-UUID string regardless of field', () => {
  let threw = false;
  try { normalizer.normalizeId('test_001', 'project_id'); } catch (e) { threw = true; if (e.code !== 'INVALID_ID_FORMAT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should throw on non-UUID string for project_id');
  threw = false;
  try { normalizer.normalizeId('test_001', 'workspace_id'); } catch (e) { threw = true; if (e.code !== 'INVALID_ID_FORMAT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should throw on non-UUID string for workspace_id');
});

test('normalizeId throws on non-UUID even in production NODE_ENV', () => {
  const prevEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const normalizerProd = require('./lib/runtime/id-normalizer');
    let threw = false;
    try { normalizerProd.normalizeId('ws_demo_001', 'workspace_id'); } catch (e) { threw = true; if (e.code !== 'INVALID_ID_FORMAT') throw new Error('Wrong code: ' + e.code); }
    if (!threw) throw new Error('Should throw in production mode');
  } finally {
    process.env.NODE_ENV = prevEnv;
  }
});

test('safeUUID returns null for invalid input', () => {
  if (normalizer.safeUUID(null, 'field') !== null) throw new Error('Should return null for null');
  if (normalizer.safeUUID(undefined, 'field') !== null) throw new Error('Should return null for undefined');
  if (normalizer.safeUUID(42, 'field') !== null) throw new Error('Should return null for number');
});

test('safeUUID passes through valid UUID', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  const result = normalizer.safeUUID(uuid, 'field');
  if (result !== uuid) throw new Error('Should return UUID unchanged');
});

test('normalizeId throws on empty string', () => {
  let threw = false;
  try { normalizer.normalizeId('', 'field'); } catch (e) { threw = true; }
  if (!threw) throw new Error('Should throw on empty string');
});

test('normalizeProjectId accepts non-UUID string', () => {
  const r1 = normalizer.normalizeProjectId('test');
  if (r1 !== 'test') throw new Error('Should return as-is: got ' + r1);
  const r2 = normalizer.normalizeProjectId('proj_test_001');
  if (r2 !== 'proj_test_001') throw new Error('Should return as-is: got ' + r2);
});

test('normalizeProjectId passes through valid UUID', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  const r = normalizer.normalizeProjectId(uuid);
  if (r !== uuid) throw new Error('Should return UUID unchanged: got ' + r);
});

test('normalizeProjectId throws on null/undefined', () => {
  let threw = false;
  try { normalizer.normalizeProjectId(null); } catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should throw on null');
  threw = false;
  try { normalizer.normalizeProjectId(undefined); } catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should throw on undefined');
});

test('normalizeProjectId throws on empty string', () => {
  let threw = false;
  try { normalizer.normalizeProjectId(''); } catch (e) { threw = true; if (e.code !== 'INVALID_INPUT') throw new Error('Wrong code: ' + e.code); }
  if (!threw) throw new Error('Should throw on empty string');
});

test('normalizeProjectId trims whitespace', () => {
  const r = normalizer.normalizeProjectId('  test  ');
  if (r !== 'test') throw new Error('Should trim: got "' + r + '"');
});

runTests();
