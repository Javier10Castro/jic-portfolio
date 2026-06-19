const fs = require('fs');
const path = require('path');

const STORAGE = path.resolve(__dirname, '../../data/settings.json');

function _ensureStorage() {
  const dir = path.dirname(STORAGE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORAGE)) fs.writeFileSync(STORAGE, '{}', 'utf-8');
}

function _readAll() {
  _ensureStorage();
  try { return JSON.parse(fs.readFileSync(STORAGE, 'utf-8')); } catch { return {}; }
}

function _writeAll(data) {
  _ensureStorage();
  fs.writeFileSync(STORAGE, JSON.stringify(data, null, 2), 'utf-8');
}

function _scopeKey(scope, scopeId) {
  return `${scope}:${scopeId}`;
}

function getSettings(scope, scopeId) {
  const all = _readAll();
  return all[_scopeKey(scope, scopeId)] || _defaults(scope);
}

function updateSettings(scope, scopeId, updates) {
  const all = _readAll();
  const key = _scopeKey(scope, scopeId);
  const current = all[key] || _defaults(scope);
  all[key] = { ...current, ...updates, updatedAt: new Date().toISOString() };
  _writeAll(all);
  return all[key];
}

function deleteSettings(scope, scopeId) {
  const all = _readAll();
  delete all[_scopeKey(scope, scopeId)];
  _writeAll(all);
  return { success: true };
}

function _defaults(scope) {
  const DEFAULTS = {
    workspace: {
      deploymentDefaults: { provider: 'vercel', autoDeploy: false },
      brandingDefaults: { hidePoweredBy: false },
      aiDefaults: { model: 'standard', maxGenerations: 100 },
    },
    project: {
      deploymentDefaults: { provider: 'vercel', autoDeploy: false },
      aiDefaults: { model: 'standard', maxGenerations: 10 },
    },
    organization: {
      maxProjects: 50, maxMembers: 20,
      allowedAuthProviders: ['email'],
      ssoEnabled: false,
    },
    user: {
      preferredLang: 'en', theme: 'light',
      notificationSettings: { email: true, inApp: true, digest: 'daily' },
    },
  };
  return DEFAULTS[scope] || {};
}

module.exports = { getSettings, updateSettings, deleteSettings };
