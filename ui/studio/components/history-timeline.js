(function() {
  const HistoryTimeline = {
    render(builds) {
      if (!builds || builds.length === 0) return '<div class="st-empty">No build history yet.</div>';
      const sorted = [...builds].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
      let html = '<div class="st-timeline">';
      sorted.slice(0, 20).forEach(b => {
        const icons = { pending: '○', running: '◌', completed: '●', failed: '✕' };
        const icon = icons[b.status] || '○';
        const cls = b.status === 'failed' ? 'error' : b.status === 'completed' ? 'success' : b.status === 'running' ? 'warning' : '';
        html += `<div class="st-timeline-item ${cls}">
          <span class="st-timeline-icon">${icon}</span>
          <div class="st-timeline-content">
            <div class="st-timeline-title">Build ${b.id}</div>
            <div class="st-timeline-meta">${b.status} | ${b.startedAt ? new Date(b.startedAt).toLocaleString() : '—'}</div>
          </div>
        </div>`;
      });
      html += '</div>';
      return html;
    }
  };

  window.HistoryTimeline = HistoryTimeline;
})();
