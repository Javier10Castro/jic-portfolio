class MembershipManager {
  constructor() {
    this._memberships = new Map();
  }

  addMember(orgId, userId, role = 'member') {
    const key = `${orgId}:${userId}`;
    this._memberships.set(key, { orgId, userId, role, joinedAt: Date.now(), status: 'active' });
    return true;
  }

  removeMember(orgId, userId) {
    const key = `${orgId}:${userId}`;
    return this._memberships.delete(key);
  }

  updateRole(orgId, userId, role) {
    const key = `${orgId}:${userId}`;
    const membership = this._memberships.get(key);
    if (!membership) return false;
    membership.role = role;
    return true;
  }

  getMember(orgId, userId) {
    return this._memberships.get(`${orgId}:${userId}`) || null;
  }

  getOrganizationMembers(orgId) {
    return Array.from(this._memberships.values()).filter(m => m.orgId === orgId);
  }

  getUserOrganizations(userId) {
    return Array.from(this._memberships.values()).filter(m => m.userId === userId);
  }

  suspendMember(orgId, userId) {
    const membership = this._memberships.get(`${orgId}:${userId}`);
    if (!membership) return false;
    membership.status = 'suspended';
    return true;
  }

  activateMember(orgId, userId) {
    const membership = this._memberships.get(`${orgId}:${userId}`);
    if (!membership) return false;
    membership.status = 'active';
    return true;
  }

  countMembers(orgId) {
    return this.getOrganizationMembers(orgId).length;
  }

  clear() {
    this._memberships.clear();
  }
}

module.exports = { MembershipManager };
