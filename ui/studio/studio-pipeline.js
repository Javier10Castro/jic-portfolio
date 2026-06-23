(function() {
  const StudioPipeline = {
    currentBuildId: null,
    pollTimer: null,

    render() {
      return `
        <div class="st-pipeline">
          <h3>Build Pipeline</h3>
          <p class="st-subtitle">Track your application build from idea to deployment across all stages.</p>
          <div class="st-form-row">
            <div class="st-form-group" style="flex:1">
              <label>Project ID</label>
              <input id="st-build-project-id" class="st-input" placeholder="Enter project ID to track" />
            </div>
            <div style="display:flex;align-items:flex-end">
              <button class="st-btn st-btn-primary" onclick="StudioPipeline.trackBuild()">Track</button>
            </div>
          </div>
          <div id="st-pipeline-visualization">
            <div class="st-empty">Enter a project ID above to track its build pipeline.</div>
          </div>
        </div>
      `;
    },

    async trackBuild() {
      const input = document.getElementById('st-build-project-id');
      if (!input || !input.value.trim()) return;
      this.currentBuildId = input.value.trim();
      this.pollTimer = setInterval(() => this.fetchBuild(), 2000);
      this.fetchBuild();
    },

    async fetchBuild() {
      if (!this.currentBuildId) return;
      try {
        const r = await fetch('/api/studio/project/' + encodeURIComponent(this.currentBuildId) + '/build');
        const json = await r.json();
        if (json.success && json.data) {
          if (window.StageProgress) {
            window.StageProgress.render(json.data, 'st-pipeline-visualization');
          } else {
            this.renderSimple(json.data);
          }
          if (json.data.build && (json.data.build.status === 'completed' || json.data.build.status === 'failed')) {
            clearInterval(this.pollTimer);
          }
        } else {
          document.getElementById('st-pipeline-visualization').innerHTML = '<div class="st-empty">Build not found for project: ' + this.currentBuildId + '</div>';
        }
      } catch (e) {
        document.getElementById('st-pipeline-visualization').innerHTML = '<div class="st-empty">Error: ' + e.message + '</div>';
      }
    },

    renderSimple(data) {
      const el = document.getElementById('st-pipeline-visualization');
      if (!el) return;
      const build = data.build || data;
      const stages = build.stages || [];
      let html = '<div class="st-pipeline-stages">';
      const stageNames = ['conversation','questions','context','architecture','knowledge','composer','generator','evaluation','deployment','workspace'];
      stageNames.forEach(s => {
        const stage = stages.find(st => st.name === s) || { name: s, status: 'pending' };
        const icons = { pending: '○', running: '◌', completed: '●', failed: '✕' };
        html += `<div class="st-stage ${stage.status}"><span class="st-stage-icon">${icons[stage.status] || '○'}</span><span class="st-stage-name">${s}</span><span class="st-stage-status">${stage.status}</span></div>`;
      });
      html += '</div>';
      html += `<div class="st-progress-bar"><div class="st-progress-fill" style="width:${data.progress ? data.progress.percent : 0}%"></div></div>`;
      html += `<div class="st-build-meta">Status: <strong>${build.status}</strong> | Progress: ${data.progress ? data.progress.percent : 0}%</div>`;
      el.innerHTML = html;
    }
  };

  window.StudioPipeline = StudioPipeline;
})();
