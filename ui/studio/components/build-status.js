(function() {
  const BuildStatus = {
    render(build) {
      if (!build) return '<div class="st-empty">No build data.</div>';
      const icons = { pending: '○', running: '◌', completed: '●', failed: '✕' };
      const colors = { pending: '#6b7280', running: '#3b82f6', completed: '#22c55e', failed: '#ef4444' };
      const stages = (build.stages || []).map(s => ({
        ...s,
        icon: icons[s.status] || '○',
        color: colors[s.status] || '#6b7280'
      }));
      return `
        <div class="st-build-status">
          <div class="st-build-header">
            <span class="st-build-id">Build: ${build.id}</span>
            <span class="st-badge" style="background:${colors[build.status] || '#6b7280'};color:#fff">${build.status}</span>
          </div>
          <div class="st-build-stages">
            ${stages.map(s => `
              <div class="st-stage-row">
                <span style="color:${s.color}">${s.icon}</span>
                <span>${s.name}</span>
                <span style="color:${s.color};font-size:0.8em">${s.status}</span>
              </div>
            `).join('')}
          </div>
          <div class="st-build-times">
            <span>Started: ${build.startedAt ? new Date(build.startedAt).toLocaleString() : '—'}</span>
            ${build.completedAt ? '<span>Completed: '+new Date(build.completedAt).toLocaleString()+'</span>' : ''}
          </div>
        </div>
      `;
    }
  };

  window.BuildStatus = BuildStatus;
})();
