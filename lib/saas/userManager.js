const fs = require('fs');
const path = require('path');
const auditLog = require('./auditLog');

const STORAGE = path.resolve(__dirname, '../../data/users.json');

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

function createUser({ email, name, authProvider, preferences }) {
  if (!email) throw new Error('email is required');
  const existing = findByEmail(email);
  if (existing) throw new Error(`User with email "${email}" already exists`);

  const user = {
    id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    email,
    name: name || email.split('@')[0],
    authProvider: authProvider || 'email',
    preferences: {
      preferredLang: 'en',
      theme: 'light',
      notificationSettings: { email: true, inApp: true, digest: 'daily' },
      ...(preferences || {}),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const list = _readAll();
  list.push(user);
  _writeAll(list);

  auditLog.record({ action: 'user.created', actor: user.id, resource: 'user', resourceId: user.id, details: { email, authProvider } });
  return user;
}

function getUser(id) {
  if (!id) return null;
  return _readAll().find(u => u.id === id) || null;
}

function findByEmail(email) {
  if (!email) return null;
  return _readAll().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function updateUser(id, updates) {
  const list = _readAll();
  const user = list.find(u => u.id === id);
  if (!user) throw new Error(`User "${id}" not found`);
  const allowed = ['name', 'email', 'preferences'];
  for (const key of Object.keys(updates)) {
    if (allowed.includes(key)) {
      if (key === 'preferences' && typeof updates[key] === 'object') {
        user.preferences = { ...user.preferences, ...updates[key] };
      } else {
        user[key] = updates[key];
      }
    }
  }
  user.updatedAt = new Date().toISOString();
  _writeAll(list);
  auditLog.record({ action: 'user.updated', actor: id, resource: 'user', resourceId: id, details: { changes: Object.keys(updates) } });
  return user;
}

function deleteUser(id) {
  const list = _readAll();
  const idx = list.findIndex(u => u.id === id);
  if (idx === -1) throw new Error(`User "${id}" not found`);
  list.splice(idx, 1);
  _writeAll(list);
  auditLog.record({ action: 'user.deleted', actor: 'system', resource: 'user', resourceId: id });
  return { success: true };
}

function listUsers(filters = {}) {
  let list = _readAll();
  if (filters.authProvider) list = list.filter(u => u.authProvider === filters.authProvider);
  return list;
}

module.exports = { createUser, getUser, findByEmail, updateUser, deleteUser, listUsers };
