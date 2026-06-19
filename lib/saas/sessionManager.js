const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const auditLog = require('./auditLog');

const STORAGE = path.resolve(__dirname, '../../data/sessions.json');

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

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function createSession(userId, { ip, userAgent, device } = {}) {
  if (!userId) throw new Error('userId is required');
  const now = Date.now();
  const session = {
    id: `sess-${crypto.randomBytes(16).toString('hex')}`,
    userId,
    token: crypto.randomBytes(32).toString('hex'),
    refreshToken: crypto.randomBytes(32).toString('hex'),
    ip: ip || null,
    userAgent: userAgent || null,
    device: device || null,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    refreshExpiresAt: new Date(now + REFRESH_TTL_MS).toISOString(),
    lastActivity: new Date(now).toISOString(),
  };

  const list = _readAll();
  list.push(session);
  _writeAll(list);

  auditLog.record({ action: 'session.created', actor: userId, resource: 'session', resourceId: session.id, details: { ip, device } });
  return session;
}

function validateSession(token) {
  if (!token) return null;
  const list = _readAll();
  const session = list.find(s => s.token === token);
  if (!session) return null;
  if (Date.now() > new Date(session.expiresAt).getTime()) return null;
  session.lastActivity = new Date().toISOString();
  _writeAll(list);
  return session;
}

function refreshSession(refreshToken) {
  if (!refreshToken) return null;
  const list = _readAll();
  const session = list.find(s => s.refreshToken === refreshToken);
  if (!session) return null;
  if (Date.now() > new Date(session.refreshExpiresAt).getTime()) return null;
  session.token = crypto.randomBytes(32).toString('hex');
  session.expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  session.lastActivity = new Date().toISOString();
  _writeAll(list);
  return session;
}

function destroySession(token) {
  if (!token) return { success: false };
  const list = _readAll();
  const idx = list.findIndex(s => s.token === token);
  if (idx === -1) return { success: false };
  list.splice(idx, 1);
  _writeAll(list);
  return { success: true };
}

function destroyAllSessions(userId) {
  if (!userId) return { success: false, count: 0 };
  const list = _readAll();
  const before = list.length;
  const filtered = list.filter(s => s.userId !== userId);
  const removed = before - filtered.length;
  _writeAll(filtered);
  return { success: true, count: removed };
}

function listSessions(userId) {
  if (!userId) return [];
  const now = Date.now();
  return _readAll().filter(s => s.userId === userId && now < new Date(s.expiresAt).getTime());
}

function cleanupExpired() {
  const list = _readAll();
  const now = Date.now();
  const active = list.filter(s => now < new Date(s.expiresAt).getTime());
  _writeAll(active);
  return { removed: list.length - active.length, active: active.length };
}

module.exports = { createSession, validateSession, refreshSession, destroySession, destroyAllSessions, listSessions, cleanupExpired };
