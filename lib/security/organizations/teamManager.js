const crypto = require('crypto');

class TeamManager {
  constructor() {
    this._teams = new Map();
    this._teamMembers = new Map();
  }

  create(input) {
    const id = input.id || `team-${crypto.randomUUID().substring(0, 8)}`;
    const team = {
      id, name: input.name, description: input.description || '',
      organizationId: input.organizationId, parentTeamId: input.parentTeamId || null,
      settings: input.settings || {}, createdAt: Date.now()
    };
    this._teams.set(id, team);
    return team;
  }

  get(id) {
    return this._teams.get(id) || null;
  }

  update(id, updates) {
    const team = this._teams.get(id);
    if (!team) return null;
    Object.assign(team, updates);
    return team;
  }

  delete(id) {
    this._teamMembers.delete(id);
    return this._teams.delete(id);
  }

  listByOrganization(orgId) {
    return Array.from(this._teams.values()).filter(t => t.organizationId === orgId);
  }

  addMember(teamId, userId, role = 'member') {
    if (!this._teams.has(teamId)) return false;
    if (!this._teamMembers.has(teamId)) this._teamMembers.set(teamId, new Map());
    this._teamMembers.get(teamId).set(userId, { userId, role, joinedAt: Date.now() });
    return true;
  }

  removeMember(teamId, userId) {
    const members = this._teamMembers.get(teamId);
    if (!members) return false;
    return members.delete(userId);
  }

  getMembers(teamId) {
    const members = this._teamMembers.get(teamId);
    return members ? Array.from(members.values()) : [];
  }

  getUserTeams(userId) {
    const result = [];
    for (const [teamId, members] of this._teamMembers) {
      if (members.has(userId)) result.push({ teamId, role: members.get(userId).role });
    }
    return result;
  }

  updateMemberRole(teamId, userId, role) {
    const members = this._teamMembers.get(teamId);
    if (!members || !members.has(userId)) return false;
    members.get(userId).role = role;
    return true;
  }

  clear() {
    this._teams.clear();
    this._teamMembers.clear();
  }
}

module.exports = { TeamManager };
