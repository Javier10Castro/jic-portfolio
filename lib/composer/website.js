class Website {
  getName() {
    return 'Website';
  }

  getDescription() {
    return 'A website application template';
  }

  getModules() {
    return ['pages', 'components', 'routing', 'seo', 'analytics'];
  }

  getCapabilities() {
    return ['page-management', 'component-library', 'routing-engine', 'seo-optimization', 'analytics-tracking'];
  }

  getConfig() {
    return {
      name: 'Website',
      pages: [],
      components: [],
      routing: { mode: 'hash' },
      seo: { enabled: true, sitemap: true },
      analytics: { enabled: false, provider: null },
    };
  }

  apply(customizations) {
    if (!customizations) return this.getConfig();
    const base = this.getConfig();
    return { ...base, ...customizations };
  }
}

module.exports = { Website };
