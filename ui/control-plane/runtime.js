const RuntimeCenter = {
  currentTab: 'overview',
  data: {},

  init() { this.render(); this.loadData(); },

  async loadData() {
    try {
      const res = await fetch('/api/v1/runtime');
      this.data = await res.json();
      this.render();
    } catch(e) { console.error('Runtime center load failed', e); }
  },

  render() {
    const c = document.getElementById('runtime-center') || this.createContainer();
    c.innerHTML = '<div class="rc-header"><h1>Runtime Center</h1><button class="rc-btn rc-btn-secondary" onclick="RuntimeCenter.loadData()">Refresh</button></div>'
      + this.renderTabs() + this.renderContent();
  },

  renderTabs() {
    const tabs = ['overview','flags','configuration','secrets','services','rollouts','policies','emergency'];
    return '<div class="rc-tabs">' + tabs.map(t =>
      `<button class="rc-tab ${this.currentTab===t?'active':''}" onclick="RuntimeCenter.switchTab('${t}')">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`
    ).join('') + '</div>';
  },

  renderContent() {
    const panels = {
      overview: () => `<div class="rc-widgets">
        <div class="rc-widget"><div class="rc-widget-icon">🚩</div><div class="rc-widget-value">${this.data.activeFlags?.total || 0}</div><div class="rc-widget-label">Active Flags</div></div>
        <div class="rc-widget"><div class="rc-widget-icon">⚙️</div><div class="rc-widget-value">${this.data.activeConfigs?.total || 0}</div><div class="rc-widget-label">Configuration Drift</div></div>
        <div class="rc-widget"><div class="rc-widget-icon">🔑</div><div class="rc-widget-value">${this.data.secrets?.rotations || 0}</div><div class="rc-widget-label">Secret Rotation</div></div>
        <div class="rc-widget"><div class="rc-widget-icon">🔍</div><div class="rc-widget-value">${this.data.components?.health || 'OK'}</div><div class="rc-widget-label">Service Health</div></div>
        <div class="rc-widget"><div class="rc-widget-icon">📦</div><div class="rc-widget-value">${this.data.activeRollouts || 0}</div><div class="rc-widget-label">Rollout Progress</div></div>
        <div class="rc-widget"><div class="rc-widget-icon">🔴</div><div class="rc-widget-value">${this.data.killSwitch || 0}</div><div class="rc-widget-label">Kill Switch Status</div></div>
        <div class="rc-widget"><div class="rc-widget-icon">📝</div><div class="rc-widget-value">${this.data.overrides || 0}</div><div class="rc-widget-label">Runtime Overrides</div></div>
        <div class="rc-widget"><div class="rc-widget-icon">💡</div><div class="rc-widget-value">${this.data.activeConfigs?.overrides || 0}</div><div class="rc-widget-label">Live Configuration</div></div>
      </div>`,
      flags: () => '<div class="rc-panel"><h2>Feature Flags</h2><p>Manage feature flags and experiments</p></div>',
      configuration: () => '<div class="rc-panel"><h2>Configuration</h2><p>Dynamic configuration management</p></div>',
      secrets: () => '<div class="rc-panel"><h2>Secrets</h2><p>Secret management and rotation</p></div>',
      services: () => '<div class="rc-panel"><h2>Services</h2><p>Service discovery and health</p></div>',
      rollouts: () => '<div class="rc-panel"><h2>Rollouts</h2><p>Canary, blue/green, progressive rollouts</p></div>',
      policies: () => '<div class="rc-panel"><h2>Runtime Policies</h2><p>Runtime policy management</p></div>',
      emergency: () => '<div class="rc-panel"><h2>Emergency Controls</h2><p>Kill switches, safe mode, emergency controls</p></div>',
    };
    return (panels[this.currentTab] || panels.overview)();
  },

  switchTab(tab) { this.currentTab = tab; this.render(); },
  createContainer() { const d = document.createElement('div'); d.id = 'runtime-center'; d.className = 'runtime-center'; document.body.appendChild(d); return d; },
};
