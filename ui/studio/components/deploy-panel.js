(function() {
  const DeployPanel = {
    render(project, workspace) {
      if (!project) return '<div class="st-empty">No project data.</div>';
      const statusColors = { building: '#3b82f6', completed: '#22c55e', failed: '#ef4444', draft: '#6b7280' };
      return `
        <div class="st-deploy-panel">
          <div class="st-deploy-info">
            <h4>${project.name || 'Untitled'}</h4>
            <div class="st-deploy-meta">
              <span class="st-badge" style="background:${statusColors[project.status] || '#6b7280'};color:#fff">${project.status}</span>
              <span>${new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <p class="st-deploy-prompt">${project.prompt}</p>
          </div>
          <div class="st-deploy-urls">
            ${project.previewUrl ? `<div class="st-url-row"><span>Preview:</span><a href="${project.previewUrl}" target="_blank" rel="noopener">${project.previewUrl}</a></div>` : ''}
            ${project.liveUrl ? `<div class="st-url-row"><span>Live:</span><a href="${project.liveUrl}" target="_blank" rel="noopener">${project.liveUrl}</a></div>` : ''}
          </div>
          ${workspace && workspace.files ? `<div class="st-deploy-files"><strong>Files:</strong> ${workspace.files.length} generated</div>` : ''}
          <div class="st-deploy-actions">
            <button class="st-btn st-btn-primary" ${project.status !== 'completed' ? 'disabled' : ''} onclick="DeployPanel.deploy('${project.id}')">Deploy Now</button>
            <button class="st-btn" onclick="DeployPanel.rollback('${project.id}')">Rollback</button>
          </div>
          <div id="st-deploy-result"></div>
        </div>
      `;
    },

    deploy(projectId) {
      const el = document.getElementById('st-deploy-result');
      if (el) el.innerHTML = '<div class="st-success">Deployment started for project ' + projectId + '.</div>';
    },

    rollback(projectId) {
      const el = document.getElementById('st-deploy-result');
      if (el) el.innerHTML = '<div class="st-warning">Rollback initiated for project ' + projectId + '.</div>';
    }
  };

  window.DeployPanel = DeployPanel;
})();
