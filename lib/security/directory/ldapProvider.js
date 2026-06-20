class LdapProvider {
  constructor(options = {}) {
    this._config = {
      url: options.url || 'ldap://localhost:389',
      baseDn: options.baseDn || 'dc=example,dc=com',
      bindDn: options.bindDn || 'cn=admin,dc=example,dc=com',
      bindPassword: options.bindPassword || 'admin',
      timeout: options.timeout || 5000
    };
    this._users = new Map();
    this._connected = false;
  }

  connect() {
    this._connected = true;
    return { success: true, server: this._config.url };
  }

  disconnect() {
    this._connected = false;
    return true;
  }

  isConnected() { return this._connected; }

  authenticate(username, password) {
    if (!this._connected) return { success: false, error: 'Not connected' };
    if (!password || password.length < 1) return { success: false, error: 'Invalid credentials' };
    const user = this.findUser(username);
    if (!user) return { success: false, error: 'User not found' };
    return { success: true, user, dn: `uid=${username},${this._config.baseDn}` };
  }

  findUser(username) {
    for (const user of this._users.values()) {
      if (user.uid === username || user.mail === username) return user;
    }
    return null;
  }

  createUser(entry) {
    const dn = `uid=${entry.uid || entry.username},${this._config.baseDn}`;
    const user = {
      dn, uid: entry.uid || entry.username, cn: entry.cn || entry.name,
      sn: entry.sn || '', mail: entry.mail || entry.email,
      memberOf: entry.memberOf || [],
      objectClass: ['inetOrgPerson', 'posixAccount'],
      createdAt: Date.now()
    };
    this._users.set(dn, user);
    return user;
  }

  listUsers(baseDn = null) {
    const dn = baseDn || this._config.baseDn;
    return Array.from(this._users.values()).filter(u => u.dn.endsWith(dn));
  }

  search(filter = {}) {
    let results = Array.from(this._users.values());
    if (filter.username) results = results.filter(u => u.uid === filter.username);
    if (filter.email) results = results.filter(u => u.mail === filter.email);
    if (filter.group) results = results.filter(u => u.memberOf.includes(filter.group));
    return results;
  }

  getGroups() {
    const groups = new Set();
    for (const user of this._users.values()) {
      for (const g of user.memberOf) groups.add(g);
    }
    return Array.from(groups);
  }

  clear() {
    this._users.clear();
    this._connected = false;
  }
}

module.exports = { LdapProvider };
