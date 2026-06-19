const saas = require('../../../lib/saas/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { EmptyState } = require('../components/EmptyState');

function renderApiKeys({ userId }) {
  const keys = userId ? saas.apiKeys.listApiKeys(userId) : [];

  const content = `
    <div class="page-header">
      <h1>API Keys</h1>
      <button class="btn btn-primary" data-action="generate-key">Generate Key</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Your API Keys (${keys.length})</div>
      </div>
      ${keys.length ? `
        <div class="table-container" style="border:none">
          <table role="table" aria-label="API Keys">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Permissions</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${keys.map(k => `
                <tr>
                  <td style="font-weight:500;color:var(--color-text)">${k.name}</td>
                  <td>
                    <div class="api-key-display">
                      <span class="key">${k.revoked ? '••••••••••••••••' : (k.id ? k.id.slice(0, 16) + '••••' : '—')}</span>
                    </div>
                  </td>
                  <td>${(k.permissions || []).join(', ')}</td>
                  <td style="font-size:var(--font-size-xs)">${k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—'}</td>
                  <td style="font-size:var(--font-size-xs)">${k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Never'}</td>
                  <td><span class="status-badge ${k.revoked ? 'archived' : 'deployed'}">${k.revoked ? 'Revoked' : 'Active'}</span></td>
                  <td>
                    <div style="display:flex;gap:var(--space-xs)">
                      <button class="btn btn-ghost btn-sm" data-action="rotate-key" data-id="${k.id}">Rotate</button>
                      <button class="btn btn-ghost btn-sm" data-action="copy-key" data-id="${k.id}">Copy</button>
                      <button class="btn btn-ghost btn-sm ${k.revoked ? '' : 'btn-danger'}" data-action="revoke-key" data-id="${k.id}">${k.revoked ? 'Delete' : 'Revoke'}</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : EmptyState({ title: 'No API keys', description: 'Generate your first API key to integrate with the platform.', action: 'generate-key', actionLabel: 'Generate Key' })}
    </div>

    <div class="card" style="margin-top:var(--space-lg);max-width:600px">
      <div class="card-header"><div class="card-title">Generate New API Key</div></div>
      <div class="form-group">
        <label for="key-name">Key Name</label>
        <input class="form-input" id="key-name" placeholder="e.g., Production API Key" />
      </div>
      <div class="form-group">
        <label for="key-permissions">Permissions</label>
        <select class="form-select" id="key-permissions" multiple size="3">
          <option value="projects:read" selected>projects:read</option>
          <option value="projects:write">projects:write</option>
          <option value="deployments:read" selected>deployments:read</option>
          <option value="deployments:write">deployments:write</option>
        </select>
      </div>
      <div class="form-group">
        <label for="key-expiry">Expires In</label>
        <select class="form-select" id="key-expiry">
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
          <option value="">Never</option>
        </select>
      </div>
      <button class="btn btn-primary" data-action="generate-key-submit">Generate</button>
    </div>
  `;

  return DashboardLayout({
    activePage: 'apiKeys',
    breadcrumbs: [{ label: 'API Keys' }],
    children: content,
  });
}

module.exports = { renderApiKeys };
