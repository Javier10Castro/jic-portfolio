const crypto = require('crypto');

class ScimProvider {
  constructor() {
    this._users = new Map();
    this._groups = new Map();
    this._syncHistory = [];
  }

  createUser(user) {
    const id = user.id || crypto.randomUUID();
    const entry = {
      id, userName: user.userName, name: user.name || { givenName: '', familyName: '' },
      emails: user.emails || [], phoneNumbers: user.phoneNumbers || [],
      active: user.active !== false, groups: [],
      meta: { resourceType: 'User', created: new Date().toISOString(), lastModified: new Date().toISOString() }
    };
    this._users.set(id, entry);
    return entry;
  }

  getUser(id) {
    return this._users.get(id) || null;
  }

  listUsers(filter = {}) {
    let results = Array.from(this._users.values());
    if (filter.active !== undefined) results = results.filter(u => u.active === filter.active);
    if (filter.userName) results = results.filter(u => u.userName?.toLowerCase().includes(filter.userName.toLowerCase()));
    return results;
  }

  updateUser(id, updates) {
    const user = this._users.get(id);
    if (!user) return null;
    Object.assign(user, updates);
    user.meta.lastModified = new Date().toISOString();
    return user;
  }

  deleteUser(id) {
    return this._users.delete(id);
  }

  createGroup(group) {
    const id = group.id || crypto.randomUUID();
    const entry = { id, displayName: group.displayName, members: group.members || [], meta: { resourceType: 'Group', created: new Date().toISOString(), lastModified: new Date().toISOString() } };
    this._groups.set(id, entry);
    return entry;
  }

  getGroup(id) {
    return this._groups.get(id) || null;
  }

  listGroups() {
    return Array.from(this._groups.values());
  }

  addMember(groupId, userId) {
    const group = this._groups.get(groupId);
    if (!group) return false;
    if (!group.members.find(m => m.value === userId)) {
      group.members.push({ value: userId, $ref: `Users/${userId}` });
      group.meta.lastModified = new Date().toISOString();
    }
    const user = this._users.get(userId);
    if (user && !user.groups.find(g => g.value === groupId)) {
      user.groups.push({ value: groupId, $ref: `Groups/${groupId}` });
    }
    return true;
  }

  recordSync(result) {
    this._syncHistory.push({ ...result, timestamp: Date.now() });
  }

  getSyncHistory(limit = 10) {
    return this._syncHistory.slice(-limit);
  }

  clear() {
    this._users.clear();
    this._groups.clear();
    this._syncHistory = [];
  }
}

module.exports = { ScimProvider };
