(function() {
  const StudioApp = {
    currentView: 'dashboard',
    data: null,

    init() {
      this.render();
      this.loadMetrics();
    },

    switchView(view) {
      this.currentView = view;
      this.render();
    },

    async loadMetrics() {
      try {
        const r = await fetch('/api/studio');
        const json = await r.json();
        if (json.success) {
          this.data = json.data;
          this.renderMetrics();
        }
      } catch (e) {}
    },

    render() {
      const container = document.getElementById('studio-dashboard');
      if (!container) return;
      container.innerHTML = `
        <style>${window.__studioCSS || ''}</style>
        <div class="st-container">
          <div class="st-header">
            <h2 class="st-title">AI Product Studio</h2>
            <div class="st-actions">
              <button class="st-btn st-btn-primary" onclick="StudioApp.switchView('create')">+ New Project</button>
            </div>
          </div>
          <div class="st-tabs">
            ${['dashboard','create','pipeline','editor','preview','archives','templates','settings','analytics'].map(v =>
              `<button class="st-tab${v===this.currentView?' active':''}" onclick="StudioApp.switchView('${v}')">${v.charAt(0).toUpperCase()+v.slice(1)}</button>`
            ).join('')}
          </div>
          <div class="st-content">${this.renderView()}</div>
        </div>
      `;
    },

    renderView() {
      const views = {
        dashboard: `<div class="st-grid" id="st-metrics"></div><div class="st-section"><h3>Your Projects</h3><div id="st-project-list">${window.ProjectCard ? window.ProjectCard.renderList([]) : 'Loading...'}</div></div>`,
        create: window.StudioCreate ? window.StudioCreate.render() : '<p>Loading create view...</p>',
        pipeline: window.StudioPipeline ? window.StudioPipeline.render() : '<p>Loading pipeline view...</p>',
        editor: window.StudioEditor ? window.StudioEditor.render() : '<p>Loading editor...</p>',
        preview: window.StudioPreview ? window.StudioPreview.render() : '<p>Loading preview...</p>',
        archives: window.StudioArchives ? window.StudioArchives.render() : '<p>Loading archives...</p>',
        templates: window.StudioTemplates ? window.StudioTemplates.render() : '<p>Loading templates...</p>',
        settings: window.StudioSettings ? window.StudioSettings.render() : '<p>Loading settings...</p>',
        analytics: window.StudioAnalytics ? window.StudioAnalytics.render() : '<p>Loading analytics...</p>'
      };
      return views[this.currentView] || views.dashboard;
    },

    renderMetrics() {
      const el = document.getElementById('st-metrics');
      if (!el) return;
      if (window.MetricsPanel) {
        el.innerHTML = window.MetricsPanel.render(this.data);
      } else {
        const projects = this.data && this.data.projects ? this.data.projects.length : 0;
        el.innerHTML = `
          <div class="st-card"><div class="st-metric-value">${projects}</div><div class="st-metric-label">Projects</div></div>
          <div class="st-card"><div class="st-metric-value">${this.data && this.data.status ? 'Online' : 'Initializing'}</div><div class="st-metric-label">Studio Status</div></div>
        `;
      }
    }
  };

  window.StudioApp = StudioApp;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StudioApp.init());
  } else {
    StudioApp.init();
  }
})();
