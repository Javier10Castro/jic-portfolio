class EntraProvider {
  constructor(options = {}) {
    this._config = {
      tenantId: options.tenantId || '00000000-0000-0000-0000-000000000000',
      clientId: options.clientId || 'dev-entra-client-id',
      domain: options.domain || 'company.onmicrosoft.com'
    };
    this._users = new Map();
    this._groups = new Map();
    this._connected = false;
  }

  connect() {
    this._connected = true;
    return { success: true, tenantId: this._config.tenantId, domain: this._config.domain };
  }

  disconnect() { this._connected = false; return true; }
  isConnected() { return this._connected; }

  createUser(entry) {
    const id = entry.id || `entra-${Date.now()}`;
    const user = {
      id, userPrincipalName: entry.userPrincipalName || `${entry.displayName?.replace(/\s/g, '.')}@${this._config.domain}`,
      displayName: entry.displayName, mail: entry.mail, jobTitle: entry.jobTitle || '',
      department: entry.department || '', userType: entry.userType || 'Member',
      accountEnabled: entry.accountEnabled !== false,
      identities: entry.identities || [{ signInType: 'emailAddress', issuer: this._config.domain }],
      createdAt: Date.now()
    };
    this._users.set(id, user);
    return user;
  }

  findByUpn(upn) {
    for (const user of this._users.values()) {
      if (user.userPrincipalName === upn || user.mail === upn) return user;
    }
    return null;
  }

  listUsers(filter = {}) {
    let results = Array.from(this._users.values());
    if (filter.accountEnabled !== undefined) results = results.filter(u => u.accountEnabled === filter.accountEnabled);
    if (filter.userType) results = results.filter(u => u.userType === filter.userType);
    if (filter.department) results = results.filter(u => u.department === filter.department);
    return results;
  }

  createGroup(entry) {
    const group = {
      id: `entra-group-${Date.now()}`, displayName: entry.displayName, mail: entry.mail || '',
      description: entry.description || '', members: entry.members || [],
      groupTypes: entry.groupTypes || ['Unified'], securityEnabled: entry.securityEnabled !== false,
      createdAt: Date.now()
    };
    this._groups.set(group.id, group);
    return group;
  }

  listGroups() { return Array.from(this._groups.values()); }

  addMember(groupId, userId) {
    const group = this._groups.get(groupId);
    if (!group) return false;
    if (!group.members.includes(userId)) group.members.push(userId);
    const user = this._users.get(userId);
    if (user && !user.memberOf) user.memberOf = [];
    if (user && !user.memberOf.includes(groupId)) user.memberOf.push(groupId);
    return true;
  }

  getUserGroups(userId) {
    const user = this._users.get(userId);
    if (!user || !user.memberOf) return [];
    return user.memberOf.map(gid => this._groups.get(gid)).filter(Boolean);
  }

  assignLicense(userId, sku) {
    const user = this._users.get(userId);
    if (!user) return false;
    if (!user.licenses) user.licenses = [];
    user.licenses.push({ sku, assignedAt: Date.now() });
    return true;
  }

  sync(users) {
    let created = 0, updated = 0;
    for (const u of users) {
      const existing = this.findByUpn(u.userPrincipalName || u.mail);
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

module.exports = { EntraProvider };
