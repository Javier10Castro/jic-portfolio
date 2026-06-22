class Dashboard {
  getName() {
    return 'Dashboard';
  }

  getDescription() {
    return 'A dashboard application template';
  }

  getModules() {
    return ['widgets', 'data-sources', 'charts', 'filters', 'export', 'sharing', 'settings'];
  }

  getCapabilities() {
    return ['widget-management', 'data-source-integration', 'chart-rendering', 'filter-engine', 'export', 'sharing', 'settings-management'];
  }

  getConfig() {
    return {
      name: 'Dashboard',
      widgets: { layout: 'grid', maxWidgets: 20 },
      dataSources: { refreshInterval: 60 },
      charts: { library: 'chartjs' },
      filters: { enabled: true },
      export: { formats: ['pdf', 'csv', 'png'] },
      sharing: { enabled: false },
      settings: { theme: 'light' },
    };
  }

  apply(customizations) {
    if (!customizations) return this.getConfig();
    const base = this.getConfig();
    return { ...base, ...customizations };
  }
}

module.exports = { Dashboard };
