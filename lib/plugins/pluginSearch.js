class PluginSearch {
  constructor(options = {}) {
    this._registry = options.registry;
    this._marketplace = options.marketplace;
  }

  search(query, options = {}) {
    const q = query.toLowerCase();
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const local = this._registry.listPlugins().filter(p => this._matches(p, q));
    const marketplace = this._marketplace ? this._marketplace.listListings({ search: q }) : [];

    const results = [
      ...local.map(p => ({ id: p.id, name: p.manifest.name, type: 'installed', version: p.manifest.version })),
      ...marketplace.map(m => ({ id: m.id, name: m.name, type: 'marketplace', version: m.version }))
    ];

    if (options.sort === 'name') results.sort((a, b) => a.name.localeCompare(b.name));
    else if (options.sort === 'version') results.sort((a, b) => b.version.localeCompare(a.version));

    const total = results.length;
    return { results: results.slice(offset, offset + limit), total, offset, limit };
  }

  searchByCategory(category, options = {}) {
    const limit = options.limit || 20;
    const local = this._registry.getPluginsByCategory(category) || [];
    const marketplace = this._marketplace ? this._marketplace.listListings({ category }) : [];
    return {
      local: local.map(p => ({ id: p.id, name: p.manifest.name })),
      marketplace: marketplace.map(m => ({ id: m.id, name: m.name })),
      total: local.length + marketplace.length
    };
  }

  _matches(plugin, query) {
    const m = plugin.manifest;
    return m.id.toLowerCase().includes(query) ||
      m.name.toLowerCase().includes(query) ||
      (m.description || '').toLowerCase().includes(query) ||
      (m.author || '').toLowerCase().includes(query) ||
      (m.keywords || []).some(k => k.toLowerCase().includes(query));
  }
}

module.exports = { PluginSearch };
