(function() {
  const StudioTemplates = {
    templates: [
      { name: 'Web App', description: 'Full-stack web application with React + Node.js', icon: '🌐' },
      { name: 'API Service', description: 'REST API with Express + MongoDB', icon: '🔌' },
      { name: 'CLI Tool', description: 'Command-line tool with Node.js', icon: '⌨️' },
      { name: 'Dashboard', description: 'Analytics dashboard with charts', icon: '📊' },
      { name: 'Microservice', description: 'Modular microservice architecture', icon: '⚙️' },
      { name: 'Static Site', description: 'Static site with HTML/CSS/JS', icon: '📄' }
    ],

    render() {
      return `
        <div class="st-templates">
          <h3>Start from a Template</h3>
          <p class="st-subtitle">Choose a template to jump-start your project.</p>
          <div class="st-template-grid">
            ${this.templates.map(t => `
              <div class="st-template-card" onclick="StudioTemplates.useTemplate('${t.name}')">
                <div class="st-template-icon">${t.icon}</div>
                <div class="st-template-name">${t.name}</div>
                <div class="st-template-desc">${t.description}</div>
              </div>
            `).join('')}
          </div>
          <div id="st-template-result"></div>
        </div>
      `;
    },

    useTemplate(name) {
      const prompt = document.getElementById('st-prompt');
      if (prompt) {
        const t = this.templates.find(t => t.name === name);
        prompt.value = 'Build a ' + name + ': ' + (t ? t.description : '');
      }
      StudioApp.switchView('create');
    }
  };

  window.StudioTemplates = StudioTemplates;
})();
