class ActiveDirectoryProvider {
  constructor(options = {}) {
    this._config = {
      domain: options.domain || 'company.local',
      server: options.server || 'ldap://ad.company.local',
      baseDn: options.baseDn || 'DC=company,DC=local',
      adminUser: options.adminUser || 'admin@company.local'
    };
    this._users = new Map();
    this._groups = new Map();
    this._connected = false;
  }

  connect() {
    this._connected = true;
    return { success: true, domain: this._config.domain, server: this._config.server };
  }

  disconnect() { this._connected = false; return true; }
  isConnected() { return this._connected; }

  authenticate(upn, password) {
    if (!this._connected) return { success: false, error: 'Not connected to Active Directory' };
    if (!password) return { success: false, error: 'Password required' };
    const user = this.findByUpn(upn);
    if (!user) return { success: false, error: 'User not found' };
    return { success: true, user, token: `ad-token-${Date.now()}` };
  }

  findByUpn(upn) {
    for (const user of this._users.values()) {
      if (user.userPrincipalName === upn || user.mail === upn) return user;
    }
    return null;
  }

  createUser(entry) {
    const id = `ad-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const user = {
      id, objectGuid: id,
      userPrincipalName: entry.userPrincipalName || `${entry.samAccountName}@${this._config.domain}`,
      samAccountName: entry.samAccountName, mail: entry.mail, displayName: entry.displayName,
      department: entry.department || '', title: entry.title || '',
      memberOf: entry.memberOf || [], enabled: entry.enabled !== false,
      createdAt: Date.now()
    };
    this._users.set(id, user);
    return user;
  }

  createGroup(entry) {
    const group = {
      id: `ad-group-${Date.now()}`, name: entry.name, description: entry.description || '',
      members: entry.members || [], type: entry.type || 'security',
      createdAt: Date.now()
    };
    this._groups.set(group.id, group);
    return group;
  }

  getGroups() { return Array.from(this._groups.values()); }

  addMemberToGroup(groupId, userId) {
    const group = this._groups.get(groupId);
    if (!group) return false;
    if (!group.members.includes(userId)) group.members.push(userId);
    return true;
  }

  listUsers() { return Array.from(this._users.values()); }

  searchUsers(filter = {}) {
    let results = Array.from(this._users.values());
    if (filter.department) results = results.filter(u => u.department === filter.department);
    if (filter.enabled !== undefined) results = results.filter(u => u.enabled === filter.enabled);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(u => u.displayName?.toLowerCase().includes(q) || u.mail?.toLowerCase().includes(q));
    }
    return results;
  }

  syncUsers(users) {
    let created = 0, updated = 0;
    for (const u of users) {
      const existing = this.findByUpn(u.userPrincipalName);
      if (existing) { Object.assign(existing, u); updated++; }
      else { this.createUser(u); created++; }
    }
    return { created, updated, total: users.length };
  }

  clear() {
    this._users.clear();
    this._groups.clear();
    this._connected = false;
  }
}

module.exports = { ActiveDirectoryProvider };
