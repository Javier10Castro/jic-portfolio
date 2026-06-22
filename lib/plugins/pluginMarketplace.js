class PluginMarketplace {
  constructor(options = {}) {
    this._registry = options.registry;
    this._events = options.events;
    this._listings = {};
  }

  publish(listing) {
    const entry = {
      id: listing.id,
      name: listing.name, description: listing.description,
      author: listing.author, version: listing.version,
      categories: listing.categories || [],
      tags: listing.tags || [],
      downloads: 0, rating: 0, reviewCount: 0,
      homepage: listing.homepage, repository: listing.repository,
      license: listing.license, verified: false,
      publishedAt: Date.now(), updatedAt: Date.now()
    };
    this._listings[entry.id] = entry;
    return entry;
  }

  getListing(id) { return this._listings[id] ? { ...this._listings[id] } : null; }
  listListings(filter) {
    let items = Object.values(this._listings);
    if (filter) {
      if (filter.category) items = items.filter(l => l.categories.includes(filter.category));
      if (filter.verified !== undefined) items = items.filter(l => l.verified === filter.verified);
      if (filter.search) {
        const s = filter.search.toLowerCase();
        items = items.filter(l => l.name.toLowerCase().includes(s) || l.description.toLowerCase().includes(s) || l.tags.some(t => t.toLowerCase().includes(s)));
      }
    }
    return items.map(i => ({ ...i }));
  }

  incrementDownloads(id) {
    if (this._listings[id]) this._listings[id].downloads++;
  }

  verify(id) { if (this._listings[id]) this._listings[id].verified = true; }
  unverify(id) { if (this._listings[id]) this._listings[id].verified = false; }

  getFeatured() {
    return Object.values(this._listings)
      .filter(l => l.verified && l.rating >= 4)
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 10);
  }

  getTopRated(limit = 10) {
    return Object.values(this._listings)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  getRecentlyUpdated(limit = 10) {
    return Object.values(this._listings)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  clear() { this._listings = {}; }
}

module.exports = { PluginMarketplace };
