const path = require('path');
const fs = require('fs');

const CACHE_DIR = path.resolve(__dirname, '../../data/cache/pipeline');

function _ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function _cacheKey(runId, stage) {
  return `${runId}-${stage}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function _cachePath(key) {
  return path.join(CACHE_DIR, `${key}.json`);
}

function get(runId, stage) {
  _ensureDir();
  const fp = _cachePath(_cacheKey(runId, stage));
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch { return null; }
}

function set(runId, stage, data) {
  _ensureDir();
  fs.writeFileSync(_cachePath(_cacheKey(runId, stage)), JSON.stringify(data, null, 2), 'utf-8');
}

function invalidate(runId, stage) {
  _ensureDir();
  const fp = _cachePath(_cacheKey(runId, stage));
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

function invalidateAll(runId) {
  _ensureDir();
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith(runId));
  for (const f of files) fs.unlinkSync(path.join(CACHE_DIR, f));
}

function stats() {
  _ensureDir();
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'));
  return { count: files.length, size: files.reduce((sum, f) => sum + (fs.statSync(path.join(CACHE_DIR, f)).size || 0), 0) };
}

const STAGE_TTL = {
  'context_builder': 300000,
  'planner': 300000,
  'design_strategy': 600000,
  'content_generator': 600000,
};

function isExpired(runId, stage) {
  const data = get(runId, stage);
  if (!data) return true;
  const ttl = STAGE_TTL[stage] || 600000;
  return Date.now() - new Date(data._cachedAt).getTime() > ttl;
}

module.exports = { get, set, invalidate, invalidateAll, stats, isExpired };
