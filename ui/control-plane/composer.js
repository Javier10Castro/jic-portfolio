const ComposerCenter = {
  currentTab: 'overview',
  data: {},
  init() { this.render(); this.loadData(); },
  async loadData() {
    try { const r = await fetch('/api/v1/composer'); this.data = await r.json(); this.render(); } catch(e) { console.error('Composer load failed', e); }
  },
  render() {
    const c = document.getElementById('composer-center') || this.createContainer();
    c.innerHTML = '<div class="cc-header"><h1>Application Composer Center</h1><button class="cc-btn cc-btn-secondary" onclick="ComposerCenter.loadData()">Refresh</button></div>'
      + this.renderTabs() + this.renderContent();
  },
  renderTabs() {
    const tabs = ['overview','applications','templates','composition-graph','capabilities','simulation','validation','exports'];
    return '<div class="cc-tabs">' + tabs.map(t =>
      '<button class="cc-tab ' + (this.currentTab===t?'active':'') + '" onclick="ComposerCenter.switchTab(\'' + t + '\')">' + t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ') + '</button>'
    ).join('') + '</div>';
  },
  renderContent() {
    const panels = {
      overview: () => '<div class="cc-widgets">'
        + '<div class="cc-widget"><div class="cc-widget-icon">📦</div><div class="cc-widget-value">' + (this.data.applications || 0) + '</div><div class="cc-widget-label">Applications</div></div>'
        + '<div class="cc-widget"><div class="cc-widget-icon">🧩</div><div class="cc-widget-value">' + (this.data.capabilities || 0) + '</div><div class="cc-widget-label">Capabilities</div></div>'
        + '<div class="cc-widget"><div class="cc-widget-icon">🔗</div><div class="cc-widget-value">' + (this.data.dependencies || 0) + '</div><div class="cc-widget-label">Dependencies</div></div>'
        + '<div class="cc-widget"><div class="cc-widget-icon">✅</div><div class="cc-widget-value">' + (this.data.compositions || 0) + '</div><div class="cc-widget-label">Compositions</div></div>'
        + '<div class="cc-widget"><div class="cc-widget-icon">📋</div><div class="cc-widget-value">' + (this.data.templates || 0) + '</div><div class="cc-widget-label">Templates</div></div>'
        + '<div class="cc-widget"><div class="cc-widget-icon">📊</div><div class="cc-widget-value">' + (this.data.simulations || 0) + '</div><div class="cc-widget-label">Simulations</div></div>'
        + '<div class="cc-widget"><div class="cc-widget-icon">📈</div><div class="cc-widget-value">' + (this.data.metrics || 0) + '</div><div class="cc-widget-label">Metrics</div></div>'
        + '<div class="cc-widget"><div class="cc-widget-icon">🚀</div><div class="cc-widget-value">' + (this.data.deployments || 0) + '</div><div class="cc-widget-label">Deployments</div></div>'
        + '</div>',
      applications: () => '<div class="cc-panel"><h2>Applications</h2><p>Composed application management</p></div>',
      templates: () => '<div class="cc-panel"><h2>Templates</h2><p>Application templates and blueprints</p></div>',
      'composition-graph': () => '<div class="cc-panel"><h2>Composition Graph</h2><p>Application dependency and composition graph</p></div>',
      capabilities: () => '<div class="cc-panel"><h2>Capabilities</h2><p>Capability registry and discovery</p></div>',
      simulation: () => '<div class="cc-panel"><h2>Simulation</h2><p>Composition simulation and dry-run</p></div>',
      validation: () => '<div class="cc-panel"><h2>Validation</h2><p>Composition validation and policy checks</p></div>',
      exports: () => '<div class="cc-panel"><h2>Exports</h2><p>Export application manifests</p></div>',
    };
    return (panels[this.currentTab] || panels.overview)();
  },
  switchTab(tab) { this.currentTab = tab; this.render(); },
  createContainer() { const d = document.createElement('div'); d.id = 'composer-center'; d.className = 'composer-center'; document.body.appendChild(d); return d; },
};
if (typeof module !== 'undefined' && module.exports) { module.exports = { ComposerCenter }; }
