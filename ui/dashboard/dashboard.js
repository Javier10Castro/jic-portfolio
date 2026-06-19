const { renderHome } = require('./pages/home');
const { renderProjects } = require('./pages/projects');
const { renderProjectDetails } = require('./pages/projectDetails');
const { renderDeployments } = require('./pages/deployments');
const { renderWorkspace } = require('./pages/workspace');
const { renderSettings } = require('./pages/settings');
const { renderProfile } = require('./pages/profile');
const { renderApiKeys } = require('./pages/apiKeys');
const { renderUsage } = require('./pages/usage');
const { renderAuditLog } = require('./pages/auditLog');
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, 'dashboard.css'), 'utf-8');

const ROUTES = {
  home: { render: renderHome, title: 'Dashboard' },
  projects: { render: renderProjects, title: 'Projects' },
  projectDetails: { render: renderProjectDetails, title: 'Project Details' },
  deployments: { render: renderDeployments, title: 'Deployments' },
  workspace: { render: renderWorkspace, title: 'Workspace' },
  settings: { render: renderSettings, title: 'Settings' },
  profile: { render: renderProfile, title: 'Profile' },
  apiKeys: { render: renderApiKeys, title: 'API Keys' },
  usage: { render: renderUsage, title: 'Usage' },
  auditLog: { render: renderAuditLog, title: 'Audit Log' },
};

function serveDashboard(params = {}) {
  const route = ROUTES[params.page] || ROUTES.home;
  const html = route.render(params);
  return html;
}

function renderFullPage(params = {}) {
  const bodyHtml = serveDashboard(params);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ROUTES[params.page]?.title || 'Dashboard'} — JIC Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>${css.toString()}</style>
</head>
<body>
  ${bodyHtml}
  <script>
    // Client-side navigation and interactivity
    document.addEventListener('click', function(e) {
      const link = e.target.closest('[data-page]');
      if (link) {
        e.preventDefault();
        const page = link.dataset.page;
        window.location.hash = page;
        return;
      }
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const id = actionBtn.dataset.id;
        console.log('Action:', action, 'ID:', id);
        // Future: dispatch to SaaS Core API
      }
    });
    // Tab switching
    document.addEventListener('click', function(e) {
      const tab = e.target.closest('[role="tab"]');
      if (tab) {
        const tabId = tab.dataset.tab;
        document.querySelectorAll('[role="tab"]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
        const target = document.getElementById('tab-' + tabId);
        if (target) target.style.display = '';
      }
    });
  </script>
</body>
</html>`;
}

module.exports = { serveDashboard, renderFullPage, ROUTES };
