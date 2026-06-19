const fs = require('fs');
const path = require('path');
const auditLog = require('./auditLog');
const workspaceManager = require('./workspaceManager');

const STORAGE = path.resolve(__dirname, '../../data/projects.json');

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

const STATUSES = { DRAFT: 'draft', PROCESSING: 'processing', PREVIEW: 'preview', APPROVED: 'approved', DEPLOYED: 'deployed', FAILED: 'failed', ARCHIVED: 'archived' };

function createProject({ name, owner, organization, workspaceId, type, settings }) {
  if (!name) throw new Error('name is required');
  if (!workspaceId) throw new Error('workspaceId is required');

  const project = {
    id: `prj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    owner: owner || null,
    organization: organization || null,
    workspaceId,
    type: type || 'website',
    status: STATUSES.DRAFT,
    settings: settings || {
      deploymentDefaults: { provider: 'vercel', autoDeploy: false },
      aiDefaults: { model: 'standard', maxGenerations: 10 },
    },
    deploymentHistory: [],
    generationHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const list = _readAll();
  list.push(project);
  _writeAll(list);

  workspaceManager.incrementProjectCount(workspaceId);

  auditLog.record({ action: 'project.created', actor: owner || 'system', resource: 'project', resourceId: project.id, details: { workspace: workspaceId, type } });
  return project;
}

function getProject(id) {
  if (!id) return null;
  return _readAll().find(p => p.id === id) || null;
}

function updateProject(id, updates) {
  const list = _readAll();
  const project = list.find(p => p.id === id);
  if (!project) throw new Error(`Project "${id}" not found`);
  const allowed = ['name', 'type', 'status', 'settings'];
  for (const key of Object.keys(updates)) {
    if (allowed.includes(key)) {
      if (key === 'settings' && typeof updates[key] === 'object') {
        project.settings = { ...project.settings, ...updates[key] };
      } else {
        project[key] = updates[key];
      }
    }
  }
  project.updatedAt = new Date().toISOString();
  _writeAll(list);

  auditLog.record({ action: 'project.updated', actor: 'system', resource: 'project', resourceId: id, details: { changes: Object.keys(updates) } });
  return project;
}

function deleteProject(id) {
  const list = _readAll();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) throw new Error(`Project "${id}" not found`);
  const project = list[idx];
  list.splice(idx, 1);
  _writeAll(list);

  auditLog.record({ action: 'project.deleted', actor: 'system', resource: 'project', resourceId: id, details: { name: project.name } });
  return { success: true };
}

function duplicateProject(id) {
  const original = getProject(id);
  if (!original) throw new Error(`Project "${id}" not found`);
  const dup = createProject({
    name: `${original.name} (copy)`,
    owner: original.owner,
    organization: original.organization,
    workspaceId: original.workspaceId,
    type: original.type,
    settings: JSON.parse(JSON.stringify(original.settings)),
  });
  auditLog.record({ action: 'project.duplicated', actor: 'system', resource: 'project', resourceId: dup.id, details: { sourceId: id, sourceName: original.name } });
  return dup;
}

function archiveProject(id) {
  return updateProject(id, { status: STATUSES.ARCHIVED });
}

function listProjects(workspaceId, filters = {}) {
  let list = _readAll();
  if (workspaceId) list = list.filter(p => p.workspaceId === workspaceId);
  if (filters.status) list = list.filter(p => p.status === filters.status);
  if (filters.owner) list = list.filter(p => p.owner === filters.owner);
  if (filters.type) list = list.filter(p => p.type === filters.type);
  list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return list;
}

module.exports = { createProject, getProject, updateProject, deleteProject, duplicateProject, archiveProject, listProjects, STATUSES };
