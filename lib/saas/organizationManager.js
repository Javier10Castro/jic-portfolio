const fs = require('fs');
const path = require('path');
const auditLog = require('./auditLog');

const STORAGE = path.resolve(__dirname, '../../data/organizations.json');

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

const ROLES = ['owner', 'admin', 'editor', 'viewer'];

function createOrganization({ name, ownerId, settings }) {
  if (!name) throw new Error('name is required');
  if (!ownerId) throw new Error('ownerId is required');

  const org = {
    id: `org-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    ownerId,
    members: [{ userId: ownerId, role: 'owner', joinedAt: new Date().toISOString() }],
    settings: settings || { maxProjects: 50, maxMembers: 20, allowedAuthProviders: ['email'], ssoEnabled: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const list = _readAll();
  list.push(org);
  _writeAll(list);

  auditLog.record({ action: 'organization.created', actor: ownerId, resource: 'organization', resourceId: org.id, details: { name } });
  return org;
}

function getOrganization(id) {
  if (!id) return null;
  return _readAll().find(o => o.id === id) || null;
}

function addMember(orgId, userId, role = 'viewer') {
  const list = _readAll();
  const org = list.find(o => o.id === orgId);
  if (!org) throw new Error(`Organization "${orgId}" not found`);
  if (org.members.some(m => m.userId === userId)) throw new Error('User is already a member');
  if (!ROLES.includes(role)) throw new Error(`Invalid role "${role}". Must be one of: ${ROLES.join(', ')}`);

  org.members.push({ userId, role, joinedAt: new Date().toISOString() });
  org.updatedAt = new Date().toISOString();
  _writeAll(list);

  auditLog.record({ action: 'organization.member.added', actor: 'system', resource: 'organization', resourceId: orgId, details: { userId, role } });
  return org;
}

function removeMember(orgId, userId) {
  const list = _readAll();
  const org = list.find(o => o.id === orgId);
  if (!org) throw new Error(`Organization "${orgId}" not found`);
  const member = org.members.find(m => m.userId === userId);
  if (!member) throw new Error('User is not a member');
  if (member.role === 'owner') throw new Error('Cannot remove the owner');
  org.members = org.members.filter(m => m.userId !== userId);
  org.updatedAt = new Date().toISOString();
  _writeAll(list);

  auditLog.record({ action: 'organization.member.removed', actor: 'system', resource: 'organization', resourceId: orgId, details: { userId } });
  return org;
}

function changeMemberRole(orgId, userId, newRole) {
  if (!ROLES.includes(newRole)) throw new Error(`Invalid role "${newRole}". Must be one of: ${ROLES.join(', ')}`);
  const list = _readAll();
  const org = list.find(o => o.id === orgId);
  if (!org) throw new Error(`Organization "${orgId}" not found`);
  const member = org.members.find(m => m.userId === userId);
  if (!member) throw new Error('User is not a member');
  if (member.role === 'owner') throw new Error('Cannot change the owner role');
  member.role = newRole;
  org.updatedAt = new Date().toISOString();
  _writeAll(list);

  auditLog.record({ action: 'organization.member.roleChanged', actor: 'system', resource: 'organization', resourceId: orgId, details: { userId, newRole } });
  return org;
}

function listOrganizations(userId) {
  return _readAll().filter(o => o.members.some(m => m.userId === userId));
}

function deleteOrganization(orgId) {
  const list = _readAll();
  const idx = list.findIndex(o => o.id === orgId);
  if (idx === -1) throw new Error(`Organization "${orgId}" not found`);
  list.splice(idx, 1);
  _writeAll(list);
  auditLog.record({ action: 'organization.deleted', actor: 'system', resource: 'organization', resourceId: orgId });
  return { success: true };
}

module.exports = { createOrganization, getOrganization, addMember, removeMember, changeMemberRole, listOrganizations, deleteOrganization, ROLES };
