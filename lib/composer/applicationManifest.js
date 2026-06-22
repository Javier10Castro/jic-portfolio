class ApplicationManifest {
  constructor() {
    this._manifests = new Map();
  }

  create(applicationId, manifest = {}) {
    if (!applicationId) {
      throw new Error('applicationId is required');
    }
    const entry = {
      appId: applicationId,
      name: manifest.name || '',
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      author: manifest.author || '',
      modules: Array.isArray(manifest.modules) ? [...manifest.modules] : [],
      capabilities: Array.isArray(manifest.capabilities) ? [...manifest.capabilities] : [],
      dependencies: Array.isArray(manifest.dependencies) ? [...manifest.dependencies] : [],
      tags: Array.isArray(manifest.tags) ? [...manifest.tags] : [],
      createdAt: new Date().toISOString()
    };
    this._manifests.set(applicationId, entry);
    return entry;
  }

  get(appId) {
    if (!appId) return null;
    return this._manifests.get(appId) || null;
  }

  update(appId, changes) {
    if (!appId || !changes) {
      throw new Error('appId and changes are required');
    }
    const manifest = this._manifests.get(appId);
    if (!manifest) return null;

    const allowed = ['name', 'version', 'description', 'author', 'modules', 'capabilities', 'dependencies', 'tags'];
    for (const key of Object.keys(changes)) {
      if (allowed.includes(key)) {
        manifest[key] = changes[key];
      }
    }
    return manifest;
  }

  export(appId, format = 'json') {
    if (!appId) {
      throw new Error('appId is required');
    }
    const manifest = this._manifests.get(appId);
    if (!manifest) return null;

    if (format === 'yaml') {
      const yaml = this._toYaml(manifest);
      return { data: yaml, format: 'yaml' };
    }

    return { data: JSON.parse(JSON.stringify(manifest)), format: 'json' };
  }

  _toYaml(obj, indent = 0) {
    const prefix = '  '.repeat(indent);
    const lines = [];
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        lines.push(`${prefix}${key}:`);
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            lines.push(`${prefix}- ${this._toYaml(item, indent + 1).trim()}`);
          } else {
            lines.push(`${prefix}- ${item}`);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        lines.push(`${prefix}${key}:`);
        lines.push(this._toYaml(value, indent + 1));
      } else {
        lines.push(`${prefix}${key}: ${value}`);
      }
    }
    return lines.join('\n');
  }

  clear() {
    this._manifests.clear();
  }
}

module.exports = { ApplicationManifest };
