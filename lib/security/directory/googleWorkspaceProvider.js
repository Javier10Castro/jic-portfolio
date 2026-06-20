class GoogleWorkspaceProvider {
  constructor(options = {}) {
    this._config = {
      domain: options.domain || 'company.com',
      adminEmail: options.adminEmail || 'admin@company.com',
      customerId: options.customerId || 'C000000'
    };
    this._users = new Map();
    this._groups = new Map();
    this._connected = false;
    this._syncToken = null;
  }

  connect() {
    this._connected = true;
    return { success: true, domain: this._config.domain, customerId: this._config.customerId };
  }

  disconnect() { this._connected = false; return true; }
  isConnected() { return this._connected; }

  createUser(entry) {
    const id = entry.id || `google-user-${Date.now()}`;
    const user = {
      id, primaryEmail: entry.primaryEmail,
      firstName: entry.name?.givenName || entry.firstName || '',
      lastName: entry.name?.familyName || entry.lastName || '',
      suspended: entry.suspended || false,
      orgUnitPath: entry.orgUnitPath || '/',
      departments: entry.departments || [],
      groups: entry.groups || [],
      createdAt: Date.now()
    };
    this._users.set(id, user);
    return user;
  }

  findByEmail(email) {
    for (const user of this._users.values()) {
      if (user.primaryEmail === email) return user;
    }
    return null;
  }

  listUsers(filter = {}) {
    let results = Array.from(this._users.values());
    if (filter.suspended !== undefined) results = results.filter(u => u.suspended === filter.suspended);
    if (filter.orgUnitPath) results = results.filter(u => u.orgUnitPath.startsWith(filter.orgUnitPath));
    return results;
  }

  suspendUser(id) {
    const user = this._users.get(id);
    if (!user) return false;
    user.suspended = true;
    return true;
  }

  restoreUser(id) {
    const user = this._users.get(id);
    if (!user) return false;
    user.suspended = false;
    return true;
  }

  createGroup(entry) {
    const group = {
      id: `google-group-${Date.now()}`, email: entry.email, name: entry.name,
      description: entry.description || '', members: entry.members || [],
      createdAt: Date.now()
    };
    this._groups.set(group.id, group);
    return group;
  }

  listGroups() { return Array.from(this._groups.values()); }

  addMember(groupId, memberEmail) {
    const group = this._groups.get(groupId);
    if (!group) return false;
    if (!group.members.includes(memberEmail)) group.members.push(memberEmail);
    return true;
  }

  sync(users, groups) {
    let created = 0, updated = 0;
    for (const u of users) {
      const existing = this.findByEmail(u.primaryEmail);
      if (existing) { Object.assign(existing, u); updated++; }
      else { this.createUser(u); created++; }
    }
    for (const g of (groups || [])) this.createGroup(g);
    this._syncToken = `sync-token-${Date.now()}`;
    return { created, updated, groupsCreated: groups?.length || 0, syncToken: this._syncToken };
  }

  clear() {
    this._users.clear();
    this._groups.clear();
    this._connected = false;
    this._syncToken = null;
  }
}

module.exports = { GoogleWorkspaceProvider };
