const fs = require('fs');
const path = require('path');

const STORAGE = path.resolve(__dirname, '../../data/audit.json');

function _ensureStorage() {
  const dir = path.dirname(STORAGE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORAGE)) fs.writeFileSync(STORAGE, '[]', 'utf-8');
}

function _readAll() {
  _ensureStorage();
  try { return JSON.parse(fs.readFileSync(STORAGE, 'utf-8')); } catch { return []; }
}

function _writeAll(list) {
  _ensureStorage();
  fs.writeFileSync(STORAGE, JSON.stringify(list, null, 2), 'utf-8');
}

function record({ action, actor, resource, resourceId, details, ip, organization, workspace }) {
  if (!action) throw new Error('action is required');
  const entry = {
    id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    actor: actor || 'system',
    resource: resource || 'unknown',
    resourceId: resourceId || null,
    details: details || null,
    ip: ip || null,
    organization: organization || null,
    workspace: workspace || null,
    timestamp: new Date().toISOString(),
  };
  const list = _readAll();
  list.push(entry);
  _writeAll(list);
  return entry;
}

function getLog({ limit, offset, actor, action, resource, organization } = {}) {
  let list = _readAll();
  if (actor) list = list.filter(e => e.actor === actor);
  if (action) list = list.filter(e => e.action === action);
  if (resource) list = list.filter(e => e.resource === resource);
  if (organization) list = list.filter(e => e.organization === organization);
  list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const off = offset || 0;
  const lim = limit || 100;
  return list.slice(off, off + lim);
}

function findByResource(resourceId) {
  if (!resourceId) return [];
  return _readAll().filter(e => e.resourceId === resourceId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function findByActor(actor) {
  if (!actor) return [];
  return _readAll().filter(e => e.actor === actor).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

module.exports = { record, getLog, findByResource, findByActor };
