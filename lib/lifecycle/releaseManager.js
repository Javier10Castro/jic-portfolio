class ReleaseManager {
  constructor() {
    this._releases = new Map();
  }

  _key(projectId, version) {
    return `${projectId}::${version}`;
  }

  createRelease(projectId, version, config) {
    if (!projectId || !version) throw new Error('Project ID and version are required');
    const key = this._key(projectId, version);
    if (this._releases.has(key)) {
      throw new Error(`Release "${version}" already exists for project "${projectId}"`);
    }
    const release = {
      projectId,
      version,
      status: 'draft',
      config: config || {},
      changelog: [],
      milestones: [],
      tags: [],
      createdAt: new Date().toISOString()
    };
    this._releases.set(key, release);
    return release;
  }

  getRelease(projectId, version) {
    return this._releases.get(this._key(projectId, version)) || null;
  }

  listReleases(projectId) {
    return Array.from(this._releases.values()).filter(r => r.projectId === projectId);
  }

  updateStatus(projectId, version, status) {
    const key = this._key(projectId, version);
    if (!this._releases.has(key)) {
      throw new Error(`Release "${version}" not found for project "${projectId}"`);
    }
    const validStatuses = ['draft', 'released', 'rolled_back', 'hotfix'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
    }
    this._releases.get(key).status = status;
  }

  addReleaseNote(projectId, version, note) {
    const key = this._key(projectId, version);
    if (!this._releases.has(key)) {
      throw new Error(`Release "${version}" not found for project "${projectId}"`);
    }
    this._releases.get(key).changelog.push({ note, timestamp: new Date().toISOString() });
  }

  getReleaseNotes(projectId, version) {
    const release = this._releases.get(this._key(projectId, version));
    return release ? [...release.changelog] : [];
  }

  addMilestone(projectId, version, milestone) {
    const key = this._key(projectId, version);
    if (!this._releases.has(key)) {
      throw new Error(`Release "${version}" not found for project "${projectId}"`);
    }
    this._releases.get(key).milestones.push({ milestone, timestamp: new Date().toISOString() });
  }

  getMilestones(projectId, version) {
    const release = this._releases.get(this._key(projectId, version));
    return release ? [...release.milestones] : [];
  }

  addTag(projectId, version, tag) {
    const key = this._key(projectId, version);
    if (!this._releases.has(key)) {
      throw new Error(`Release "${version}" not found for project "${projectId}"`);
    }
    this._releases.get(key).tags.push(tag);
  }

  getTags(projectId, version) {
    const release = this._releases.get(this._key(projectId, version));
    return release ? [...release.tags] : [];
  }

  createHotfix(projectId, version, fixVersion) {
    const sourceKey = this._key(projectId, version);
    if (!this._releases.has(sourceKey)) {
      throw new Error(`Release "${version}" not found for project "${projectId}"`);
    }
    const source = this._releases.get(sourceKey);
    const fixKey = this._key(projectId, fixVersion);
    if (this._releases.has(fixKey)) {
      throw new Error(`Release "${fixVersion}" already exists for project "${projectId}"`);
    }
    const hotfix = {
      projectId,
      version: fixVersion,
      status: 'hotfix',
      config: { ...source.config },
      changelog: [...source.changelog],
      milestones: [...source.milestones],
      tags: [...source.tags],
      createdAt: new Date().toISOString()
    };
    this._releases.set(fixKey, hotfix);
    return hotfix;
  }

  clear() {
    this._releases.clear();
  }
}

module.exports = { ReleaseManager };
