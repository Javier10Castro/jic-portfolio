/**
 * scripts/loadtest.js — Node.js load test for /api/sendContact and /api/sendBrief.
 *
 * No external dependencies — uses built-in http/https + crypto.
 * Windows, macOS, Linux compatible.
 *
 * Usage:
 *   node scripts\loadtest.js                          # default: contact, 20 conn, 10s
 *   node scripts\loadtest.js --endpoint sendBrief     # test brief endpoint
 *   node scripts\loadtest.js --concurrency 50 --duration 30
 *   node scripts\loadtest.js --url http://localhost:3000
 *   node scripts\loadtest.js --json payload.json      # custom payload file
 *   node scripts\loadtest.js --help                   # all options
 */

const http = require('http');
const https = require('https');
const urlMod = require('url');

// ── Defaults ─────────────────────────────────────────────────────
const DEFAULTS = {
  url: 'https://web-portfolio-kappa-wheat.vercel.app',
  endpoint: 'sendContact',
  concurrency: 20,
  duration: 10,
};

// ── CLI parsing ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = { ...DEFAULTS };
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--url': opts.url = args[++i]; break;
    case '--endpoint': opts.endpoint = args[++i]; break;
    case '--concurrency': opts.concurrency = parseInt(args[++i], 10); break;
    case '--duration': opts.duration = parseInt(args[++i], 10); break;
    case '--json': opts.jsonFile = args[++i]; break;
    case '--help':
      console.log(`
Usage: node scripts/loadtest.js [options]

Options:
  --url <url>              Base URL (default: ${DEFAULTS.url})
  --endpoint <name>        'sendContact' or 'sendBrief' (default: ${DEFAULTS.endpoint})
  --concurrency <num>      Concurrent connections (default: ${DEFAULTS.concurrency})
  --duration <sec>         Test duration (default: ${DEFAULTS.duration}s)
  --json <path>            JSON payload file (optional)
  --help                   This help
`);
      process.exit(0);
  }
}

// ── Build payload ────────────────────────────────────────────────
const isBrief = opts.endpoint === 'sendBrief';

function makePayload() {
  const base = {
    submittedAt: Date.now(),
    lang: 'en',
    name: 'Load Test',
    email: `loadtest_${Date.now()}@example.com`,
  };
  if (isBrief) {
    return { ...base, company: 'LoadTest Inc', prompt: 'This is a test prompt for performance benchmarking.' };
  }
  return { ...base, company: 'LoadTest Inc', message: 'Performance test message — please ignore.' };
}

// ── HTTP helpers ─────────────────────────────────────────────────
function parseUrl(u) {
  const p = urlMod.parse(u);
  return {
    hostname: p.hostname,
    port: p.port || (p.protocol === 'https:' ? 443 : 80),
    protocol: p.protocol,
    path: p.path,
    transport: p.protocol === 'https:' ? https : http,
  };
}

function sendRequest(targetUrl, payload) {
  return new Promise((resolve) => {
    const start = Date.now();
    const body = JSON.stringify(payload);
    const urlInfo = parseUrl(targetUrl);
    const transport = urlInfo.transport;

    const req = transport.request({
      hostname: urlInfo.hostname,
      port: urlInfo.port,
      path: urlInfo.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'LoadTest/1.0',
      },
      timeout: 30000,
    }, (res) => {
      const statusCode = res.statusCode;
      const limit = res.headers['x-ratelimit-limit'];
      const remaining = res.headers['x-ratelimit-remaining'];
      const retryAfter = res.headers['retry-after'];
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode,
          latency: Date.now() - start,
          limit: limit || '',
          remaining: remaining || '',
          retryAfter: retryAfter || '',
          body: data,
        });
      });
      res.on('error', () => resolve({ statusCode: 0, latency: Date.now() - start, limit: '', remaining: '', retryAfter: '', body: '' }));
    });
    req.on('error', () => resolve({ statusCode: 0, latency: Date.now() - start, limit: '', remaining: '', retryAfter: '', body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ statusCode: 0, latency: Date.now() - start, limit: '', remaining: '', retryAfter: '', body: '' }); });
    req.write(body);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────
(async () => {
  const targetUrl = `${opts.url.replace(/\/+$/, '')}/api/${opts.endpoint}`;

  console.log('');
  console.log('='.repeat(55));
  console.log('  LOAD TEST');
  console.log('='.repeat(55));
  console.log(`  Target:      ${targetUrl}`);
  console.log(`  Concurrency: ${opts.concurrency}`);
  console.log(`  Duration:    ${opts.duration}s`);
  console.log(`  Endpoint:    ${opts.endpoint}`);
  console.log('='.repeat(55));
  console.log('');

  let running = true;
  const results = { 200: 0, 400: 0, 429: 0, 500: 0, 502: 0, other: 0, timeout: 0 };
  const latencies = [];
  const headerSamples = [];
  let totalSent = 0;

  // Worker function
  async function worker() {
    while (running) {
      const payload = makePayload();
      totalSent++;
      const r = await sendRequest(targetUrl, payload);
      const code = r.statusCode;
      if (code === 0) results.timeout++;
      else if (results[code] !== undefined) results[code]++;
      else results.other++;
      latencies.push(r.latency);
      if (r.limit || r.retryAfter) {
        headerSamples.push(`${code}|${r.limit}|${r.remaining}|${r.retryAfter}`);
      }
      if (running && r.statusCode === 429) {
        // Brief backoff to avoid hammering
        await new Promise(r2 => setTimeout(r2, 100));
      }
    }
  }

  // Launch workers
  const workers = [];
  for (let i = 0; i < opts.concurrency; i++) {
    workers.push(worker());
  }

  // Run for duration
  await new Promise(r => setTimeout(r, opts.duration * 1000));
  running = false;

  // Wait for workers to drain
  await Promise.all(workers);

  // ── Report ─────────────────────────────────────────────────────
  const total = Object.values(results).reduce((a, b) => a + b, 0);
  const avgLat = latencies.length ? (latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const maxLat = latencies.length ? Math.max(...latencies) : 0;
  const minLat = latencies.length ? Math.min(...latencies) : 0;

  // Sort latencies for percentiles
  latencies.sort((a, b) => a - b);
  const p50 = latencies.length ? latencies[Math.floor(latencies.length * 0.5)] : 0;
  const p95 = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const p99 = latencies.length ? latencies[Math.floor(latencies.length * 0.99)] : 0;

  console.log('');
  console.log('='.repeat(55));
  console.log('  RESULTS');
  console.log('='.repeat(55));
  console.log(`  Total requests    : ${total}`);
  console.log(`  200 Success       : ${results[200]}`);
  console.log(`  400 Bad Request   : ${results[400]}`);
  console.log(`  429 Rate Limited  : ${results[429]}`);
  console.log(`  500 Server Error  : ${results[500] + (results[502] || 0)}`);
  console.log(`  Timeout           : ${results.timeout}`);
  console.log(`  Other             : ${results.other}`);
  console.log('');
  console.log('  Latency (ms):');
  console.log(`    avg: ${avgLat.toFixed(1)}  min: ${minLat}  max: ${maxLat}`);
  console.log(`    p50: ${p50}  p95: ${p95}  p99: ${p99}`);
  console.log('');
  console.log('  Rate limit headers (top 5 patterns):');
  const groups = {};
  for (const s of headerSamples) { groups[s] = (groups[s] || 0) + 1; }
  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 5);
  for (const [key, count] of sorted) {
    const [code, limit, remaining, retryAfter] = key.split('|');
    console.log(`    Status=${code} Limit=${limit} Remaining=${remaining} RetryAfter=${retryAfter}s — ${count}x`);
  }
  console.log('');
  console.log('  Done.');
  console.log('');
})();
