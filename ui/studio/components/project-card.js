(function() {
  const ProjectCard = {
    render(project) {
      if (!project) return '';
      const statusColors = { building: '#3b82f6', completed: '#22c55e', failed: '#ef4444', draft: '#6b7280' };
      return `
        <div class="st-card st-card-clickable" onclick="ProjectCard.onClick('${project.id}')">
          <div class="st-card-header">
            <strong>${project.name || 'Untitled'}</strong>
            <span class="st-badge" style="background:${statusColors[project.status] || '#6b7280'};color:#fff">${project.status}</span>
          </div>
          <div class="st-card-body">
            <p class="st-subtitle">${(project.prompt || '').substring(0, 120)}${(project.prompt || '').length > 120 ? '...' : ''}</p>
          </div>
          <div class="st-card-footer">
            <span class="st-text-muted">${new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      `;
    },

    renderList(projects) {
      if (!projects || projects.length === 0) return '<div class="st-empty">No projects yet. Create your first project!</div>';
      return projects.map(p => this.render(p)).join('');
    },

    onClick(projectId) {
      const input = document.getElementById('st-build-project-id');
      if (input) { input.value = projectId; }
      StudioApp.switchView('pipeline');
      setTimeout(() => {
        if (window.StudioPipeline) StudioPipeline.trackBuild();
      }, 100);
    }
  };

  window.ProjectCard = ProjectCard;
})();
