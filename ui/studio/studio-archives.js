(function() {
  const StudioArchives = {
    render() {
      return `
        <div class="st-archives">
          <h3>Project Archives</h3>
          <p class="st-subtitle">Browse all your studio projects and their history.</p>
          <div id="st-archive-list">
            <div class="st-empty">Loading projects...</div>
          </div>
        </div>
      `;
    },

    async load() {
      try {
        const r = await fetch('/api/studio/projects');
        const json = await r.json();
        const el = document.getElementById('st-archive-list');
        if (!el) return;
        if (json.success && json.data && json.data.projects) {
          if (window.ProjectCard) {
            el.innerHTML = window.ProjectCard.renderList(json.data.projects);
          } else {
            el.innerHTML = json.data.projects.map(p => `
              <div class="st-card st-card-clickable" onclick="StudioArchives.viewProject('${p.id}')">
                <div class="st-card-header"><strong>${p.name || 'Untitled'}</strong> <span class="st-badge st-badge-${p.status}">${p.status}</span></div>
                <div class="st-card-body"><p class="st-subtitle">${p.prompt.substring(0, 100)}${p.prompt.length > 100 ? '...' : ''}</p></div>
                <div class="st-card-footer"><span class="st-text-muted">Created: ${new Date(p.createdAt).toLocaleString()}</span></div>
              </div>
            `).join('');
          }
        } else {
          el.innerHTML = '<div class="st-empty">No projects found.</div>';
        }
      } catch (e) {
        const el = document.getElementById('st-archive-list');
        if (el) el.innerHTML = '<div class="st-empty">Error loading projects.</div>';
      }
    }
  };

  window.StudioArchives = StudioArchives;
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
      if (document.getElementById('st-archive-list')) {
        StudioArchives.load();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
