(function() {
  const StageProgress = {
    render(data, targetId) {
      const el = typeof targetId === 'string' ? document.getElementById(targetId) : targetId;
      if (!el) return;
      const build = data.build || data;
      const progress = data.progress || {};
      const stages = build.stages || [];
      const stageNames = ['conversation','questions','context','architecture','knowledge','composer','generator','evaluation','deployment','workspace'];
      let html = '<div class="st-pipeline-stages">';
      stageNames.forEach(s => {
        const stage = stages.find(st => st.name === s) || { name: s, status: 'pending' };
        const icons = { pending: '○', running: '◌', completed: '●', failed: '✕' };
        html += `<div class="st-stage st-stage-${stage.status}"><span class="st-stage-icon">${icons[stage.status] || '○'}</span><span class="st-stage-name">${s}</span><span class="st-stage-status">${stage.status}</span></div>`;
      });
      html += '</div>';
      html += `<div class="st-progress-bar"><div class="st-progress-fill" style="width:${progress.percent || 0}%"></div></div>`;
      html += `<div class="st-build-meta">Status: <strong>${build.status}</strong> | Progress: ${progress.percent || 0}% | Current: ${build.currentStage || '—'}</div>`;
      el.innerHTML = html;
    }
  };

  window.StageProgress = StageProgress;
})();
