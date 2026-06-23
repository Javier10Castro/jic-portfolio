(function() {
  const StudioCreate = {
    render() {
      return `
        <div class="st-create">
          <h3>Create New Application</h3>
          <p class="st-subtitle">Describe your application and we'll build it from idea to deployment.</p>
          <div class="st-form-group">
            <label>What do you want to build?</label>
            <textarea id="st-prompt" class="st-textarea" rows="6" placeholder="e.g., A customer portal with React frontend, Node.js backend, PostgreSQL database, with user authentication and billing integration..."></textarea>
          </div>
          <div class="st-form-row">
            <div class="st-form-group" style="flex:1">
              <label>Project Name (optional)</label>
              <input id="st-project-name" class="st-input" placeholder="Leave blank to auto-generate" />
            </div>
          </div>
          <div class="st-form-actions">
            <button class="st-btn st-btn-primary st-btn-lg" onclick="StudioCreate.startBuild()">Start Building</button>
            <button class="st-btn" onclick="StudioApp.switchView('dashboard')">Cancel</button>
          </div>
          <div id="st-create-result"></div>
        </div>
      `;
    },

    async startBuild() {
      const prompt = document.getElementById('st-prompt');
      const name = document.getElementById('st-project-name');
      if (!prompt || !prompt.value.trim()) {
        alert('Please describe what you want to build.');
        return;
      }
      const btn = document.querySelector('.st-create .st-btn-primary');
      if (btn) { btn.disabled = true; btn.textContent = 'Starting build...'; }
      try {
        const r = await fetch('/api/studio/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.value.trim(), options: { name: name ? name.value.trim() : undefined } })
        });
        const json = await r.json();
        if (json.success) {
          const result = document.getElementById('st-create-result');
          if (result) {
            result.innerHTML = '<div class="st-success">Project created! <button class="st-btn st-btn-sm" onclick="StudioApp.switchView(\'pipeline\')">View Build Pipeline</button></div>';
          }
        } else {
          alert('Error: ' + (json.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Error: ' + e.message);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Start Building'; }
      }
    }
  };

  window.StudioCreate = StudioCreate;
})();
