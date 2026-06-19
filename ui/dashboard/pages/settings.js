const saas = require('../../../lib/saas/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');

function renderSettings({ workspaceId }) {
  const workspaceSettings = workspaceId ? saas.settingsManager.getSettings('workspace', workspaceId) : {};
  const orgSettings = saas.settingsManager.getSettings('organization', 'default');

  const content = `
    <div class="page-header"><h1>Settings</h1></div>

    <div class="tabs" role="tablist" aria-label="Settings tabs">
      <button class="tab active" role="tab" data-tab="general">General</button>
      <button class="tab" role="tab" data-tab="deployment">Deployment</button>
      <button class="tab" role="tab" data-tab="ai">AI Defaults</button>
      <button class="tab" role="tab" data-tab="branding">Branding</button>
    </div>

    <div class="tab-content" id="tab-general" style="margin-top:var(--space-lg)">
      <div class="card" style="max-width:600px">
        <div class="card-header"><div class="card-title">General Settings</div></div>
        <div class="form-group">
          <label for="workspace-name">Workspace Name</label>
          <input class="form-input" id="workspace-name" value="${workspaceSettings.name || ''}" placeholder="My Workspace" />
        </div>
        <div class="form-group">
          <label for="default-lang">Default Language</label>
          <select class="form-select" id="default-lang">
            <option value="en"${workspaceSettings.defaultLang === 'en' ? ' selected' : ''}>English</option>
            <option value="es"${workspaceSettings.defaultLang === 'es' ? ' selected' : ''}>Spanish</option>
          </select>
        </div>
        <div style="display:flex;gap:var(--space-sm)">
          <button class="btn btn-primary" data-action="save-settings">Save Changes</button>
        </div>
      </div>

      <div class="card" style="margin-top:var(--space-lg);max-width:600px">
        <div class="card-header"><div class="card-title">Organization Settings</div></div>
        <div class="form-group">
          <label>Max Projects</label>
          <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">${orgSettings.maxProjects || 50}</div>
        </div>
        <div class="form-group">
          <label>Max Members</label>
          <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">${orgSettings.maxMembers || 20}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${orgSettings.ssoEnabled ? 'checked' : ''} />
          <span style="font-size:var(--font-size-sm)">SSO Enabled</span>
        </label>
      </div>
    </div>
  `;

  return DashboardLayout({
    activePage: 'settings',
    breadcrumbs: [{ label: 'Settings' }],
    children: content,
  });
}

module.exports = { renderSettings };
