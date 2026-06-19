const fs = require('fs');
const path = require('path');
const auditLog = require('./auditLog');

const STORAGE = path.resolve(__dirname, '../../data/workspaces.json');

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

const TYPES = { PERSONAL: 'personal', ORGANIZATION: 'organization', TEAM: 'team' };

function createWorkspace({ name, type, ownerId, organizationId }) {
  if (!name) throw new Error('name is required');
  if (!type) throw new Error('type is required');
  if (!ownerId) throw new Error('ownerId is required');
  if (!Object.values(TYPES).includes(type)) throw new Error(`Invalid type "${type}". Must be one of: ${Object.values(TYPES).join(', ')}`);

  const workspace = {
    id: `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    type,
    ownerId,
    organizationId: type === TYPES.ORGANIZATION ? organizationId : null,
    projectCount: 0,
    settings: {
      deploymentDefaults: { provider: 'vercel', autoDeploy: false },
      brandingDefaults: { hidePoweredBy: false },
      aiDefaults: { model: 'standard', maxGenerations: 100 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const list = _readAll();
  list.push(workspace);
  _writeAll(list);

  auditLog.record({ action: 'workspace.created', actor: ownerId, resource: 'workspace', resourceId: workspace.id, details: { type, organizationId } });
  return workspace;
}

function getWorkspace(id) {
  if (!id) return null;
  return _readAll().find(w => w.id === id) || null;
}

function updateWorkspace(id, updates) {
  const list = _readAll();
  const ws = list.find(w => w.id === id);
  if (!ws) throw new Error(`Workspace "${id}" not found`);
  const allowed = ['name', 'settings'];
  for (const key of Object.keys(updates)) {
    if (allowed.includes(key)) {
      if (key === 'settings' && typeof updates[key] === 'object') {
        ws.settings = { ...ws.settings, ...updates[key] };
      } else {
        ws[key] = updates[key];
      }
    }
    if (key === '_projectCountIncrement') {
      ws.projectCount = (ws.projectCount || 0) + 1;
    }
  }
  ws.updatedAt = new Date().toISOString();
  _writeAll(list);
  auditLog.record({ action: 'workspace.updated', actor: 'system', resource: 'workspace', resourceId: id, details: { changes: Object.keys(updates).filter(k => k !== '_actor') } });
  return ws;
}

function incrementProjectCount(id) {
  return updateWorkspace(id, { _projectCountIncrement: true });
}

function deleteWorkspace(id) {
  const list = _readAll();
  const idx = list.findIndex(w => w.id === id);
  if (idx === -1) throw new Error(`Workspace "${id}" not found`);
  list.splice(idx, 1);
  _writeAll(list);
  auditLog.record({ action: 'workspace.deleted', actor: 'system', resource: 'workspace', resourceId: id });
  return { success: true };
}

function listWorkspaces(ownerId, organizationId) {
  let list = _readAll();
  if (ownerId) list = list.filter(w => w.ownerId === ownerId);
  if (organizationId) list = list.filter(w => w.organizationId === organizationId);
  return list;
}

module.exports = { createWorkspace, getWorkspace, updateWorkspace, incrementProjectCount, deleteWorkspace, listWorkspaces, TYPES };
