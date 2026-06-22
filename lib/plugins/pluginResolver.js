class PluginResolver {
  constructor(options = {}) {
    this._registry = options.registry;
    this._compatibility = options.compatibility;
  }

  resolve(id, version) {
    const plugin = this._registry.getPluginRaw(id);
    if (!plugin) return null;
    if (version && plugin.manifest.version !== version) return null;
    return plugin;
  }

  resolveDependencies(plugin) {
    const deps = plugin.manifest.dependencies || {};
    const resolved = {};
    const missing = [];
    const circular = [];
    const visited = new Set();

    const resolveChain = (depId, depVersion, chain) => {
      if (chain.includes(depId)) { circular.push(depId); return; }
      const dep = this._registry.getPluginRaw(depId);
      if (!dep) { missing.push(depId); return; }
      if (depVersion && dep.manifest.version !== depVersion) { missing.push(`${depId}@${depVersion} (found ${dep.manifest.version})`); return; }
      if (visited.has(depId)) return;
      visited.add(depId);
      resolved[depId] = dep;
      const subDeps = dep.manifest.dependencies || {};
      Object.entries(subDeps).forEach(([subId, subVer]) => resolveChain(subId, subVer, [...chain, depId]));
    };

    Object.entries(deps).forEach(([depId, depVer]) => resolveChain(depId, depVer, [plugin.id]));
    return { resolved, missing, circular };
  }

  find(term) {
    const lower = term.toLowerCase();
    return this._registry.listPlugins().filter(p =>
      p.id.toLowerCase().includes(lower) ||
      (p.manifest.name || '').toLowerCase().includes(lower) ||
      (p.manifest.description || '').toLowerCase().includes(lower)
    );
  }
}

module.exports = { PluginResolver };
