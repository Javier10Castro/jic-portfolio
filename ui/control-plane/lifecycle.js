const LifecycleCenter = {
  currentTab: 'overview',
  data: {},

  init() { this.render(); this.loadData(); },

  async loadData() {
    try {
      const res = await fetch('/api/v1/lifecycle');
      this.data = await res.json();
      this.render();
    } catch(e) { console.error('Lifecycle load failed', e); }
  },

  render() {
    const c = document.getElementById('lifecycle-center') || this.createContainer();
    c.innerHTML = '<div class="lc-header"><h1>Lifecycle Center</h1><button class="lc-btn lc-btn-secondary" onclick="LifecycleCenter.loadData()">Refresh</button></div>'
      + this.renderTabs() + this.renderContent();
  },

  renderTabs() {
    const tabs = ['overview','environments','releases','promotions','snapshots','templates','imports','exports','history'];
    return '<div class="lc-tabs">' + tabs.map(t =>
      `<button class="lc-tab ${this.currentTab===t?'active':''}" onclick="LifecycleCenter.switchTab('${t}')">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`
    ).join('') + '</div>';
  },

  renderContent() {
    const panels = {
      overview: () => `<div class="lc-widgets">
        <div class="lc-widget"><div class="lc-widget-icon">📅</div><div class="lc-widget-value">${this.data.releases?.length || 0}</div><div class="lc-widget-label">Release Timeline</div></div>
        <div class="lc-widget"><div class="lc-widget-icon">🌐</div><div class="lc-widget-value">${this.data.environments?.length || 0}</div><div class="lc-widget-label">Environment Status</div></div>
        <div class="lc-widget"><div class="lc-widget-icon">⬆️</div><div class="lc-widget-value">${this.data.pendingPromotions || 0}</div><div class="lc-widget-label">Promotion Queue</div></div>
        <div class="lc-widget"><div class="lc-widget-icon">📸</div><div class="lc-widget-value">${this.data.snapshots?.length || 0}</div><div class="lc-widget-label">Latest Snapshots</div></div>
        <div class="lc-widget"><div class="lc-widget-icon">↩️</div><div class="lc-widget-value">${this.data.rollbackPoints || 0}</div><div class="lc-widget-label">Rollback Points</div></div>
        <div class="lc-widget"><div class="lc-widget-icon">🚀</div><div class="lc-widget-value">${this.data.deploymentHistory || 0}</div><div class="lc-widget-label">Deployment History</div></div>
        <div class="lc-widget"><div class="lc-widget-icon">📊</div><div class="lc-widget-value">${this.data.versionGraph || 'N/A'}</div><div class="lc-widget-label">Version Graph</div></div>
        <div class="lc-widget"><div class="lc-widget-icon">📈</div><div class="lc-widget-value">${this.data.metrics?.total || 0}</div><div class="lc-widget-label">Lifecycle Metrics</div></div>
      </div>`,
      environments: () => '<div class="lc-panel"><h2>Environments</h2><p>Development, Preview, QA, Staging, Production management</p></div>',
      releases: () => '<div class="lc-panel"><h2>Releases</h2><p>Release management with semantic versioning</p></div>',
      promotions: () => '<div class="lc-panel"><h2>Promotions</h2><p>Environment promotion pipeline</p></div>',
      snapshots: () => '<div class="lc-panel"><h2>Snapshots</h2><p>Project, workflow, config, runtime snapshots</p></div>',
      templates: () => '<div class="lc-panel"><h2>Templates</h2><p>Project templates and starter kits</p></div>',
      imports: () => '<div class="lc-panel"><h2>Imports</h2><p>Import projects via ZIP, JSON, YAML</p></div>',
      exports: () => '<div class="lc-panel"><h2>Exports</h2><p>Export projects and bundles</p></div>',
      history: () => '<div class="lc-panel"><h2>History</h2><p>Project lifecycle history and audit</p></div>',
    };
    return (panels[this.currentTab] || panels.overview)();
  },

  switchTab(tab) { this.currentTab = tab; this.render(); },
  createContainer() { const d = document.createElement('div'); d.id = 'lifecycle-center'; d.className = 'lifecycle-center'; document.body.appendChild(d); return d; },
};
if (typeof module !== 'undefined' && module.exports) { module.exports = { LifecycleCenter }; }
