class EventVersioning {
  constructor() {
    this._versions = new Map();
    this._migrations = new Map();
  }

  registerVersion(eventType, version, schema) {
    if (!this._versions.has(eventType)) this._versions.set(eventType, new Map());
    this._versions.get(eventType).set(version, schema);
  }

  getVersion(eventType, version) {
    const versions = this._versions.get(eventType);
    if (!versions) return null;
    return versions.get(version) || null;
  }

  getLatestVersion(eventType) {
    const versions = this._versions.get(eventType);
    if (!versions || versions.size === 0) return null;
    const maxVersion = Math.max(...Array.from(versions.keys()));
    return { version: maxVersion, schema: versions.get(maxVersion) };
  }

  registerMigration(eventType, fromVersion, toVersion, migrateFn) {
    const key = `${eventType}:${fromVersion}->${toVersion}`;
    this._migrations.set(key, migrateFn);
  }

  async migrate(event, toVersion) {
    const currentVersion = event.version || 1;
    if (currentVersion === toVersion) return event;

    const eventType = event.type;
    const path = this._findMigrationPath(eventType, currentVersion, toVersion);
    if (!path) throw new Error(`No migration path from v${currentVersion} to v${toVersion} for ${eventType}`);

    let result = { ...event };
    for (const step of path) {
      const key = `${eventType}:${step.from}->${step.to}`;
      const migrateFn = this._migrations.get(key);
      if (migrateFn) result = await migrateFn(result);
      result.version = step.to;
    }
    return result;
  }

  _findMigrationPath(eventType, from, to) {
    if (from === to) return [];
    const visited = new Set();
    const queue = [[from, []]];
    while (queue.length > 0) {
      const [current, path] = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      const versions = this._versions.get(eventType);
      if (!versions) continue;
      for (const version of versions.keys()) {
        const key = `${eventType}:${current}->${version}`;
        if (this._migrations.has(key)) {
          const newPath = [...path, { from: current, to: version }];
          if (version === to) return newPath;
          queue.push([version, newPath]);
        }
      }
    }
    return null;
  }

  listVersions(eventType) {
    const versions = this._versions.get(eventType);
    if (!versions) return [];
    return Array.from(versions.keys()).sort((a, b) => a - b);
  }

  listEventTypes() {
    return Array.from(this._versions.keys());
  }

  hasVersion(eventType, version) {
    const versions = this._versions.get(eventType);
    return versions ? versions.has(version) : false;
  }

  removeEventType(eventType) {
    this._versions.delete(eventType);
    for (const key of this._migrations.keys()) {
      if (key.startsWith(`${eventType}:`)) this._migrations.delete(key);
    }
  }
}

module.exports = EventVersioning;
