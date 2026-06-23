(function() {
  const TemplateGallery = {
    templates: [
      { name: 'Web App', icon: '🌐', desc: 'React + Node.js full-stack', category: 'fullstack' },
      { name: 'API', icon: '🔌', desc: 'Express + MongoDB REST API', category: 'backend' },
      { name: 'CLI', icon: '⌨️', desc: 'Node.js command-line tool', category: 'tool' },
      { name: 'Dashboard', icon: '📊', desc: 'Analytics dashboard', category: 'frontend' },
      { name: 'Microservice', icon: '⚙️', desc: 'Modular service architecture', category: 'architecture' },
      { name: 'Static Site', icon: '📄', desc: 'HTML/CSS/JS site', category: 'frontend' },
      { name: 'Database Schema', icon: '🗄️', desc: 'SQL/NoSQL data model', category: 'data' },
      { name: 'Auth System', icon: '🔐', desc: 'User auth & permissions', category: 'security' }
    ],

    render() {
      return `
        <div class="st-template-gallery">
          <div class="st-gallery-filter">
            ${['all','fullstack','backend','frontend','tool','architecture','data','security'].map(c =>
              `<button class="st-btn st-btn-sm st-gallery-filter-btn" data-cat="${c}" onclick="TemplateGallery.filter('${c}')">${c}</button>`
            ).join('')}
          </div>
          <div class="st-template-grid" id="st-gallery-grid">
            ${this.renderTemplates(this.templates)}
          </div>
        </div>
      `;
    },

    renderTemplates(templates) {
      return templates.map(t => `
        <div class="st-template-card" onclick="TemplateGallery.select('${t.name}')">
          <div class="st-template-icon">${t.icon}</div>
          <div class="st-template-name">${t.name}</div>
          <div class="st-template-desc">${t.desc}</div>
        </div>
      `).join('');
    },

    filter(category) {
      const items = category === 'all' ? this.templates : this.templates.filter(t => t.category === category);
      const grid = document.getElementById('st-gallery-grid');
      if (grid) grid.innerHTML = this.renderTemplates(items);
      document.querySelectorAll('.st-gallery-filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === category);
      });
    },

    select(name) {
      const t = this.templates.find(t => t.name === name);
      if (t) {
        const prompt = document.getElementById('st-prompt');
        if (prompt) prompt.value = 'Build a ' + name + ': ' + t.desc;
        StudioApp.switchView('create');
      }
    }
  };

  window.TemplateGallery = TemplateGallery;
})();
