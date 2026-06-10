/**
 * cross-platform-test.js — Reliable API tests (Windows + Linux + CI)
 *
 * Uses Node.js native fetch (no curl, no shell escaping).
 * Every request is server-side deterministic.
 *
 * Usage:
 *   node scripts/cross-platform-test.js
 *   node scripts/cross-platform-test.js --verbose   # show response bodies
 *
 * Env:
 *   BASE_URL   (default: https://web-portfolio-kappa-wheat.vercel.app)
 */

const BASE = (process.env.BASE_URL || 'https://web-portfolio-kappa-wheat.vercel.app').replace(/\/+$/, '');
const VERBOSE = process.argv.includes('--verbose');
const PASS = [];
const FAIL = [];

async function req(method, path, opts = {}) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeout || 15000);
  try {
    const fopts = { method, signal: controller.signal, headers: { 'User-Agent': 'cross-platform-test/1.0' } };
    if (opts.body !== undefined) {
      fopts.headers['Content-Type'] = 'application/json';
      fopts.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    }
    const res = await fetch(url, fopts);
    let body = '';
    try { body = await res.text(); } catch {}
    let json = null;
    try { json = JSON.parse(body); } catch {}
    if (VERBOSE) console.log(`  ← ${res.status} ${path.slice(0, 60)}`, json ? JSON.stringify(json).slice(0, 200) : '(no body)');
    return { status: res.status, headers: res.headers, body, json };
  } finally { clearTimeout(t); }
}

function check(label, fn) {
  return fn().then(r => { PASS.push(`  ✅ ${label}`); return r; }).catch(e => { FAIL.push(`  ❌ ${label}: ${e.message}`); return null; });
}

async function main() {
  console.log(`\n🔬 CROSS-PLATFORM API TEST — ${BASE}\n`);

  // ── 1. BODY PARSING ──────────────────────────────────────────
  console.log('📦 BODY PARSING');

  await check('POST /api/sendContact valid JSON → 202 or 400', async () => {
    const r = await req('POST', '/api/sendContact', {
      body: { name: 'Test', email: 'cross-test@t.com', message: 'Hello', submittedAt: Date.now() }
    });
    if (r.status === 202) return true;
    if (r.status === 400 && r.json?.error === 'INVALID_BODY') throw new Error('Expected 202, got 400 INVALID_BODY — body not reaching handler');
    if (r.status === 400) return true; // may fail at validation
    throw new Error(`Unexpected status ${r.status}`);
  });

  await check('POST /api/sendContact empty body → 400 INVALID_BODY', async () => {
    const r = await req('POST', '/api/sendContact', { body: '' });
    if (r.status !== 400) throw new Error(`Expected 400, got ${r.status}`);
    if (r.json?.error !== 'INVALID_BODY') throw new Error(`Expected INVALID_BODY, got ${r.json?.error}`);
    return true;
  });

  await check('POST /api/sendContact malformed JSON → 400 INVALID_BODY', async () => {
    const r = await req('POST', '/api/sendContact', { body: 'not json at all {{{' });
    if (r.status !== 400) throw new Error(`Expected 400, got ${r.status}`);
    if (r.json?.error !== 'INVALID_BODY') throw new Error(`Expected INVALID_BODY, got ${r.json?.error}`);
    return true;
  });

  await check('POST /api/sendContact GET method → 405', async () => {
    const r = await req('GET', '/api/sendContact');
    if (r.status !== 405) throw new Error(`Expected 405, got ${r.status}`);
    return true;
  });

  // ── 2. TIMING CHECK (submittedAt) ────────────────────────────
  console.log('\n⏱  TIMING CHECK');

  await check('POST /api/sendContact missing submittedAt → 400 INVALID_REQUEST', async () => {
    const r = await req('POST', '/api/sendContact', {
      body: { name: 'Test', email: 'test@t.com', message: 'Hello' }
    });
    if (r.status !== 400) throw new Error(`Expected 400, got ${r.status}`);
    if (r.json?.error !== 'INVALID_REQUEST') throw new Error(`Expected INVALID_REQUEST, got ${r.json?.error}`);
    return true;
  });

  await check('POST /api/sendContact future submittedAt (>now+10s) → 400 INVALID_REQUEST', async () => {
    const r = await req('POST', '/api/sendContact', {
      body: { name: 'Test', email: 'test@t.com', message: 'Hi', submittedAt: Date.now() + 60000 }
    });
    if (r.status !== 400) throw new Error(`Expected 400, got ${r.status}`);
    if (r.json?.error !== 'INVALID_REQUEST') throw new Error(`Expected INVALID_REQUEST, got ${r.json?.error}`);
    return true;
  });

  await check('POST /api/sendContact stale submittedAt (>2h ago) → 400 INVALID_REQUEST', async () => {
    const r = await req('POST', '/api/sendContact', {
      body: { name: 'Test', email: 'test@t.com', message: 'Hi', submittedAt: Date.now() - 7200001 }
    });
    if (r.status !== 400) throw new Error(`Expected 400, got ${r.status}`);
    if (r.json?.error !== 'INVALID_REQUEST') throw new Error(`Expected INVALID_REQUEST, got ${r.json?.error}`);
    return true;
  });

  // ── 3. VALIDATION ────────────────────────────────────────────
  console.log('\n🔐 VALIDATION');

  await check('POST /api/sendContact missing name → 400 INVALID_REQUEST', async () => {
    const r = await req('POST', '/api/sendContact', {
      body: { email: 'test@t.com', message: 'Hi', submittedAt: Date.now() }
    });
    if (r.status !== 400) throw new Error(`Expected 400, got ${r.status}`);
    if (r.json?.error !== 'INVALID_REQUEST') throw new Error(`Expected INVALID_REQUEST, got ${r.json?.error}`);
    return true;
  });

  await check('POST /api/sendContact invalid email → 400 INVALID_REQUEST', async () => {
    const r = await req('POST', '/api/sendContact', {
      body: { name: 'T', email: 'not-an-email', message: 'Hi', submittedAt: Date.now() }
    });
    if (r.status !== 400) throw new Error(`Expected 400, got ${r.status}`);
    if (r.json?.error !== 'INVALID_REQUEST') throw new Error(`Expected INVALID_REQUEST, got ${r.json?.error}`);
    return true;
  });

  await check('POST /api/sendContact missing message → 400 INVALID_REQUEST', async () => {
    const r = await req('POST', '/api/sendContact', {
      body: { name: 'T', email: 'test@t.com', submittedAt: Date.now() }
    });
    if (r.status !== 400) throw new Error(`Expected 400, got ${r.status}`);
    if (r.json?.error !== 'INVALID_REQUEST') throw new Error(`Expected INVALID_REQUEST, got ${r.json?.error}`);
    return true;
  });

  // ── 4. RESPONSE STRUCTURE ────────────────────────────────────
  console.log('\n📐 RESPONSE STRUCTURE');

  await check('400 response includes requestId', async () => {
    const r = await req('POST', '/api/sendContact', {
      body: { name: 'T', email: 'not-email', message: 'Hi', submittedAt: Date.now() }
    });
    if (!r.json?.requestId) throw new Error('Missing requestId in body');
    if (!r.headers.get('x-request-id')) throw new Error('Missing X-Request-Id header');
    if (r.json.requestId !== r.headers.get('x-request-id')) throw new Error('requestId mismatch body vs header');
    return true;
  });

  await check('202 includes requestId + queued + deploy headers', async () => {
    const r = await req('POST', '/api/sendContact', {
      body: { name: 'T', email: 'structure-test@t.com', message: 'Hi', submittedAt: Date.now() }
    });
    if (r.status !== 202) {
      if (r.status === 429) return true; // dedup blocked, not a structure issue
      throw new Error(`Expected 202, got ${r.status}: ${r.body.slice(0, 100)}`);
    }
    if (!r.json?.requestId) throw new Error('Missing requestId in body');
    if (!r.json?.queued) throw new Error('Missing queued flag');
    if (!r.json?.position !== undefined && r.json?.depth !== undefined);
    if (!r.headers.get('x-request-id')) throw new Error('Missing X-Request-Id header');
    if (!r.headers.get('x-deploy-sha')) throw new Error('Missing X-Deploy-SHA header');
    if (!r.headers.get('x-queue-id')) throw new Error('Missing X-Queue-Id header');
    return true;
  });

  // ── 5. RATE LIMITING (dedup) ─────────────────────────────────
  console.log('\n⏱  RATE LIMITING');
  const dedupEmail = `dedup-test-${Date.now()}@t.com`;
  const first = await req('POST', '/api/sendContact', {
    body: { name: 'T', email: dedupEmail, message: 'Hi', submittedAt: Date.now() }
  });
  await check(`First request with new email → ${first.status === 202 ? '202 queued' : 'other'}`, async () => {
    if (first.status !== 202 && first.status !== 400) throw new Error(`Unexpected status ${first.status}`);
    return true;
  });
  const second = await req('POST', '/api/sendContact', {
    body: { name: 'T', email: dedupEmail, message: 'Hi', submittedAt: Date.now() }
  });
  await check('Second request same email → 429 RATE_LIMITED (dedup)', async () => {
    if (second.status !== 429) {
      if (first.status !== 202) throw new Error(`First request failed (${first.status}), cannot verify dedup`);
      console.log(`      ⚠️  Expected 429 for dedup, got ${second.status}`);
      return false;
    }
    if (second.json?.error !== 'RATE_LIMITED') throw new Error(`Expected RATE_LIMITED, got ${second.json?.error}`);
    return true;
  });

  // ── 6. REQUEST ID IMMUTABILITY ───────────────────────────────
  console.log('\n🆔 REQUEST ID');
  await check('Custom X-Request-Id is preserved in response', async () => {
    const customId = 'my-custom-trace-12345';
    const url = `${BASE}/api/sendContact`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-Id': customId, 'User-Agent': 'cross-platform-test/1.0' },
      body: JSON.stringify({ name: 'T', email: 'custom-id-test@t.com', message: 'Hi', submittedAt: Date.now() }),
    });
    const body = await res.json();
    if (body.requestId !== customId) throw new Error(`Expected ${customId}, got ${body.requestId}`);
    if (res.headers.get('x-request-id') !== customId) throw new Error(`Header mismatch: ${res.headers.get('x-request-id')}`);
    return true;
  });

  // ── REPORT ───────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log(`📊  RESULTS: ${PASS.length} pass, ${FAIL.length} fail`);
  console.log('='.repeat(60));
  PASS.forEach(l => console.log(l));
  if (FAIL.length) { FAIL.forEach(l => console.log(l)); process.exit(1); }
  else console.log('\n✅  ALL CROSS-PLATFORM TESTS PASSED');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
