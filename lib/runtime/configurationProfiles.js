class ConfigurationProfiles {
  constructor() {
    this._profiles = new Map();
    this._activeProfile = null;
  }

  createProfile(name, configs) {
    if (!name) {
      throw new Error('name is required');
    }
    if (this._profiles.has(name)) {
      throw new Error(`Profile '${name}' already exists`);
    }
    this._profiles.set(name, {
      name,
      configs: configs && typeof configs === 'object' ? { ...configs } : {},
      createdAt: new Date().toISOString()
    });
  }

  getProfile(name) {
    if (!name) return null;
    const profile = this._profiles.get(name);
    return profile ? { ...profile, configs: { ...profile.configs } } : null;
  }

  listProfiles() {
    return Array.from(this._profiles.values()).map(p => ({ name: p.name, createdAt: p.createdAt }));
  }

  activateProfile(name) {
    if (!name) {
      throw new Error('name is required');
    }
    if (!this._profiles.has(name)) {
      throw new Error(`Profile '${name}' does not exist`);
    }
    this._activeProfile = name;
  }

  getActiveProfile() {
    return this._activeProfile;
  }

  deleteProfile(name) {
    if (!name) return false;
    if (this._activeProfile === name) {
      this._activeProfile = null;
    }
    return this._profiles.delete(name);
  }

  clear() {
    this._profiles.clear();
    this._activeProfile = null;
  }
}

module.exports = { ConfigurationProfiles };
