const DataCenter = {
  currentTab: 'overview',
  data: { storage: {}, cache: {}, vectors: [], knowledge: [], search: {}, backups: [], analytics: {} },

  init() { this.render(); this.loadData(); },

  async loadData() {
    try {
      const overview = await fetch('/api/v1/data').then(r => r.json());
      this.data = { ...this.data, ...overview };
      this.render();
    } catch(e) { console.error('Failed to load data center', e); }
  },

  render() {
    const container = document.getElementById('data-center') || this.createContainer();
    container.innerHTML = this.renderHeader() + this.renderTabs() + this.renderContent();
  },

  renderHeader() { return '<div class="dc-header"><h1>Data Platform Center</h1><button class="dc-btn dc-btn-secondary" onclick="DataCenter.loadData()">Refresh</button></div>'; },

  renderTabs() {
    const tabs = ['overview', 'storage', 'databases', 'vectors', 'knowledge', 'cache', 'analytics', 'backups', 'search'];
    return '<div class="dc-tabs">' + tabs.map(t => `<button class="dc-tab ${this.currentTab === t ? 'active' : ''}" onclick="DataCenter.switchTab('${t}')">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`).join('') + '</div>';
  },

  renderContent() {
    switch(this.currentTab) {
      case 'overview': return this.renderOverview();
      case 'storage': return '<div class="dc-panel"><h2>Storage</h2><pre>' + JSON.stringify(this.data.storage, null, 2) + '</pre></div>';
      case 'databases': return '<div class="dc-panel"><h2>Databases</h2><p>Connected databases and providers</p></div>';
      case 'vectors': return '<div class="dc-panel"><h2>Vector Search</h2><p>Vector indexes: ' + (this.data.vectors?.length || 0) + '</p></div>';
      case 'knowledge': return '<div class="dc-panel"><h2>Knowledge Base</h2><p>Knowledge documents and search</p></div>';
      case 'cache': return '<div class="dc-panel"><h2>Cache</h2><pre>' + JSON.stringify(this.data.cache, null, 2) + '</pre></div>';
      case 'analytics': return '<div class="dc-panel"><h2>Analytics</h2><pre>' + JSON.stringify(this.data.analytics, null, 2) + '</pre></div>';
      case 'backups': return '<div class="dc-panel"><h2>Backups</h2><p>Backup management and restore</p></div>';
      case 'search': return '<div class="dc-panel"><h2>Search</h2><p>Full-text and hybrid search</p></div>';
    }
  },

  renderOverview() {
    return `
      <div class="dc-widgets">
        <div class="dc-widget"><div class="dc-widget-icon">💾</div><div class="dc-widget-value">${Object.keys(this.data.storage || {}).length || 0}</div><div class="dc-widget-label">Storage Objects</div></div>
        <div class="dc-widget"><div class="dc-widget-icon">⚡</div><div class="dc-widget-value">${this.data.cache?.hitRate || '0%'}</div><div class="dc-widget-label">Cache Hit Ratio</div></div>
        <div class="dc-widget"><div class="dc-widget-icon">📐</div><div class="dc-widget-value">${this.data.vectors?.length || 0}</div><div class="dc-widget-label">Vector Indexes</div></div>
        <div class="dc-widget"><div class="dc-widget-icon">📚</div><div class="dc-widget-value">${this.data.knowledge?.documents || 0}</div><div class="dc-widget-label">Knowledge Documents</div></div>
        <div class="dc-widget"><div class="dc-widget-icon">🔍</div><div class="dc-widget-value">${this.data.search?.queries || 0}</div><div class="dc-widget-label">Search Queries</div></div>
        <div class="dc-widget"><div class="dc-widget-icon">📦</div><div class="dc-widget-value">${this.data.backups?.length || 0}</div><div class="dc-widget-label">Backups</div></div>
        <div class="dc-widget"><div class="dc-widget-icon">🔄</div><div class="dc-widget-value">${this.data.replication?.status || 'Active'}</div><div class="dc-widget-label">Replication Health</div></div>
        <div class="dc-widget"><div class="dc-widget-icon">❤️</div><div class="dc-widget-value">${this.data.health?.score || '100%'}</div><div class="dc-widget-label">Database Health</div></div>
      </div>`;
  },

  switchTab(tab) { this.currentTab = tab; this.render(); },
  createContainer() { const d = document.createElement('div'); d.id = 'data-center'; d.className = 'data-center'; document.body.appendChild(d); return d; }
};
