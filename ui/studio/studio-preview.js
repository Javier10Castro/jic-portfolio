(function() {
  const StudioPreview = {
    currentPreviewUrl: null,

    render() {
      return `
        <div class="st-preview">
          <h3>Preview & Deploy</h3>
          <p class="st-subtitle">Preview your application and deploy it with one click.</p>
          <div class="st-form-row">
            <div class="st-form-group" style="flex:1">
              <label>Project ID</label>
              <input id="st-preview-project-id" class="st-input" placeholder="Enter project ID" />
            </div>
            <div style="display:flex;align-items:flex-end;gap:8px">
              <button class="st-btn st-btn-primary" onclick="StudioPreview.loadPreview()">Load Preview</button>
            </div>
          </div>
          <div id="st-preview-content">
            <div class="st-empty">Load a project to preview.</div>
          </div>
        </div>
      `;
    },

    async loadPreview() {
      const input = document.getElementById('st-preview-project-id');
      if (!input || !input.value.trim()) return;
      try {
        const r = await fetch('/api/studio/project/' + encodeURIComponent(input.value.trim()));
        const json = await r.json();
        if (json.success && json.data) {
          const { project, workspace } = json.data;
          const el = document.getElementById('st-preview-content');
          if (window.DeployPanel) {
            el.innerHTML = window.DeployPanel.render(project, workspace);
          } else {
            el.innerHTML = `
              <div class="st-card"><h4>${project.name || 'Untitled'}</h4>
              <p><strong>Status:</strong> ${project.status}</p>
              <p><strong>Prompt:</strong> ${project.prompt}</p>
              ${project.previewUrl ? '<p><strong>Preview URL:</strong> <a href="'+project.previewUrl+'" target="_blank">'+project.previewUrl+'</a></p>' : ''}
              ${project.liveUrl ? '<p><strong>Live URL:</strong> <a href="'+project.liveUrl+'" target="_blank">'+project.liveUrl+'</a></p>' : ''}
              ${workspace && workspace.files ? '<p><strong>Files:</strong> '+workspace.files.length+'</p>' : ''}
              </div>
            `;
          }
        }
      } catch (e) {
        document.getElementById('st-preview-content').innerHTML = '<div class="st-empty">Error: ' + e.message + '</div>';
      }
    }
  };

  window.StudioPreview = StudioPreview;
})();
