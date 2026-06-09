const log = require('./logger');

async function readStream(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
  }
  return raw;
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && !Array.isArray(req.body)) {
    log.debugLog(req, 'parseBody:from_req_body_object', { type: 'object' });
    req._bodyParseMethod = 'object';
    req._bodyParseOk = true;
    return req.body;
  }

  if (typeof req.body === 'string') {
    log.debugLog(req, 'parseBody:from_req_body_string', { length: req.body.length });
    try {
      const parsed = JSON.parse(req.body);
      req._bodyParseMethod = 'string';
      req._bodyParseOk = true;
      return parsed;
    } catch (e) {
      log.debugLog(req, 'parseBody:parse_failed', { source: 'req.body', error: e.message, preview: req.body.slice(0, 200) });
      req._bodyParseMethod = 'string';
      req._bodyParseOk = false;
      return null;
    }
  }

  let raw;
  try {
    raw = await readStream(req);
  } catch (e) {
    log.debugLog(req, 'parseBody:stream_error', { error: e.message });
    req._bodyParseMethod = 'stream';
    req._bodyParseOk = false;
    return null;
  }

  if (!raw || !raw.trim()) {
    log.debugLog(req, 'parseBody:empty_body', {});
    req._bodyParseMethod = 'stream';
    req._bodyParseOk = false;
    return null;
  }

  log.debugLog(req, 'parseBody:from_stream', { length: raw.length, preview: raw.slice(0, 100) });
  try {
    const parsed = JSON.parse(raw);
    req._bodyParseMethod = 'stream';
    req._bodyParseOk = true;
    return parsed;
  } catch (e) {
    log.debugLog(req, 'parseBody:parse_failed', { source: 'stream', error: e.message, preview: raw.slice(0, 200) });
    req._bodyParseMethod = 'stream';
    req._bodyParseOk = false;
    return null;
  }
}

function deployInfo() {
  return {
    sha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'local-dev',
    env: process.env.VERCEL_ENV || 'local',
    region: process.env.VERCEL_REGION || 'unknown',
  };
}

module.exports = { parseBody, deployInfo };

/* ─── Test Scenarios ───────────────────────────────────────────────

   ✅ Correct usage (valid JSON via curl):
   curl -X POST https://web-portfolio-kappa-wheat.vercel.app/api/sendContact \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","message":"Hello"}'
   → 202 { "success": true, "queued": true }

   ✅ Correct usage (sendBrief):
   curl -X POST https://web-portfolio-kappa-wheat.vercel.app/api/sendBrief \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"t@t.com","prompt":"Build a site","lang":"en","formData":{}}'
   → 202 { "success": true, "queued": true }

   ❌ Malformed JSON:
   curl -X POST https://web-portfolio-kappa-wheat.vercel.app/api/sendContact \
     -H "Content-Type: application/json" \
     -d 'not json'
   → 400 { "error": "INVALID_BODY" }

   ❌ Empty body:
   curl -X POST https://web-portfolio-kappa-wheat.vercel.app/api/sendContact \
     -H "Content-Type: application/json" \
     -d ''
   → 400 { "error": "INVALID_BODY" }

   ✅ Vercel pre-parsed body (req.body is already an object):
   Works automatically — parseBody detects typeof === 'object'
   and returns immediately without stream read.
*/
