const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const auditLog = require('./auditLog');

const STORAGE = path.resolve(__dirname, '../../data/apiKeys.json');

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

function generateKey() {
  return 'jic_' + crypto.randomBytes(24).toString('hex');
}

function createApiKey({ name, userId, organizationId, permissions, expiresInDays }) {
  if (!name) throw new Error('name is required');
  if (!userId) throw new Error('userId is required');

  const now = Date.now();
  const key = {
    id: `key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    key: generateKey(),
    userId,
    organizationId: organizationId || null,
    permissions: permissions || ['projects:read', 'deployments:read'],
    createdAt: new Date(now).toISOString(),
    expiresAt: expiresInDays ? new Date(now + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null,
    lastUsedAt: null,
    revoked: false,
  };

  const list = _readAll();
  list.push(key);
  _writeAll(list);

  auditLog.record({ action: 'apikey.created', actor: userId, resource: 'apikey', resourceId: key.id, details: { name, permissions: key.permissions } });
  return { ...key, key: key.key };
}

function validateApiKey(key) {
  if (!key) return null;
  const list = _readAll();
  const entry = list.find(k => k.key === key);
  if (!entry) return null;
  if (entry.revoked) return null;
  if (entry.expiresAt && Date.now() > new Date(entry.expiresAt).getTime()) return null;

  entry.lastUsedAt = new Date().toISOString();
  _writeAll(list);
  return { id: entry.id, name: entry.name, userId: entry.userId, organizationId: entry.organizationId, permissions: entry.permissions };
}

function revokeApiKey(id, userId) {
  const list = _readAll();
  const entry = list.find(k => k.id === id);
  if (!entry) throw new Error(`API key "${id}" not found`);
  entry.revoked = true;
  _writeAll(list);

  auditLog.record({ action: 'apikey.revoked', actor: userId, resource: 'apikey', resourceId: id, details: { name: entry.name } });
  return { success: true };
}

function rotateApiKey(id, userId) {
  const list = _readAll();
  const entry = list.find(k => k.id === id);
  if (!entry) throw new Error(`API key "${id}" not found`);
  const oldKey = entry.key;
  entry.key = generateKey();
  _writeAll(list);

  auditLog.record({ action: 'apikey.rotated', actor: userId, resource: 'apikey', resourceId: id });
  return { ...entry, key: entry.key, previousKey: oldKey };
}

function listApiKeys(userId) {
  if (!userId) return _readAll();
  return _readAll().filter(k => k.userId === userId).map(({ id, name, permissions, createdAt, expiresAt, lastUsedAt, revoked }) => ({ id, name, permissions, createdAt, expiresAt, lastUsedAt, revoked }));
}

module.exports = { createApiKey, validateApiKey, revokeApiKey, rotateApiKey, listApiKeys };
