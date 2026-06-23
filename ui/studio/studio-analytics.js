(function() {
  const StudioAnalytics = {
    render() {
      return `
        <div class="st-analytics">
          <h3>Studio Analytics</h3>
          <div class="st-grid" id="st-analytics-metrics">
            <div class="st-card"><div class="st-metric-value">—</div><div class="st-metric-label">Total Projects</div></div>
            <div class="st-card"><div class="st-metric-value">—</div><div class="st-metric-label">Avg Build Time</div></div>
            <div class="st-card"><div class="st-metric-value">—</div><div class="st-metric-label">Success Rate</div></div>
            <div class="st-card"><div class="st-metric-value">—</div><div class="st-metric-label">Active Builds</div></div>
          </div>
          <div class="st-section">
            <h4>Build History</h4>
            <div id="st-analytics-history">${window.HistoryTimeline ? window.HistoryTimeline.render([]) : '<div class="st-empty">No build history yet.</div>'}</div>
          </div>
        </div>
      `;
    },

    async load() {
      try {
        const r = await fetch('/api/studio');
        const json = await r.json();
        if (json.success && json.data) {
          const { projects, status } = json.data;
          const projArr = projects || [];
          const active = projArr.filter(p => p.status === 'building').length;
          document.querySelector('#st-analytics-metrics .st-card:nth-child(1) .st-metric-value').textContent = projArr.length;
          document.querySelector('#st-analytics-metrics .st-card:nth-child(4) .st-metric-value').textContent = active;
        }
      } catch (e) {}
    }
  };

  window.StudioAnalytics = StudioAnalytics;
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
      if (document.getElementById('st-analytics-metrics')) {
        StudioAnalytics.load();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
