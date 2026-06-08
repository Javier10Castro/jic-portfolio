const fs = require('fs');
const path = require('path');

const STORAGE = path.resolve(__dirname, '../../data/decisions.json');

function ensureStorage() {
  const dir = path.dirname(STORAGE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORAGE)) fs.writeFileSync(STORAGE, '[]', 'utf-8');
}

function readAll() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(STORAGE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(decisions) {
  ensureStorage();
  fs.writeFileSync(STORAGE, JSON.stringify(decisions, null, 2), 'utf-8');
}

function registerDecision({ id, title, reason, impact, modules_affected, version }) {
  if (!id || !title) throw new Error('id and title are required');

  const validImpacts = ['low', 'medium', 'high'];
  const normalizedImpact = (impact || 'low').toLowerCase();
  if (!validImpacts.includes(normalizedImpact)) throw new Error('impact must be low, medium, or high');

  const decisions = readAll();

  if (decisions.find(d => d.id === id)) throw new Error(`Decision "${id}" already exists`);

  const entry = {
    id,
    title,
    reason: reason || '',
    impact: normalizedImpact,
    modules_affected: modules_affected || [],
    version: version || 'unknown',
    timestamp: new Date().toISOString(),
  };

  decisions.push(entry);
  writeAll(decisions);
  return entry;
}

function listDecisions() {
  return readAll();
}

function getDecision(id) {
  return readAll().find(d => d.id === id) || null;
}

function clearAll() {
  writeAll([]);
}

module.exports = { registerDecision, listDecisions, getDecision, clearAll };
