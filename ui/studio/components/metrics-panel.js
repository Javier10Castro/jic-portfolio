(function() {
  const MetricsPanel = {
    render(data) {
      const projects = data && data.projects ? data.projects : [];
      const status = data && data.status ? data.status : {};
      const submodules = status.submodules || {};
      const onlineCount = Object.values(submodules).filter(Boolean).length;
      return `
        <div class="st-card"><div class="st-metric-value">${projects.length}</div><div class="st-metric-label">Total Projects</div></div>
        <div class="st-card"><div class="st-metric-value">${projects.filter(p => p.status === 'completed').length}</div><div class="st-metric-label">Completed</div></div>
        <div class="st-card"><div class="st-metric-value">${projects.filter(p => p.status === 'building').length}</div><div class="st-metric-label">In Progress</div></div>
        <div class="st-card"><div class="st-metric-value">${projects.filter(p => p.status === 'failed').length}</div><div class="st-metric-label">Failed</div></div>
        <div class="st-card"><div class="st-metric-value">${onlineCount}/6</div><div class="st-metric-label">Subsystems Online</div></div>
        <div class="st-card"><div class="st-metric-value">${data && data.status && data.status.initialized ? 'Online' : 'Offline'}</div><div class="st-metric-label">Studio Status</div></div>
      `;
    }
  };

  window.MetricsPanel = MetricsPanel;
})();
