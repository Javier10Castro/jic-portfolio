const saas = require('../../../lib/saas/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { StatsCard } = require('../components/StatsCard');
const { UsageWidget } = require('../components/UsageWidget');
const { EmptyState } = require('../components/EmptyState');

function renderWorkspace({ workspaceId }) {
  const workspace = saas.workspaceManager.getWorkspace(workspaceId);
  if (!workspace) {
    return DashboardLayout({
      activePage: 'workspace',
      children: '<div class="empty-state"><h3>Workspace not found</h3></div>',
    });
  }

  const projects = saas.projectManager.listProjects(workspaceId);
  const usage = saas.usageTracker.getSummary();
  const orgId = workspace.organizationId;

  let org = null;
  let members = [];
  if (orgId) {
    org = saas.organizationManager.getOrganization(orgId);
    members = org ? org.members : [];
  }

  const content = `
    <div class="page-header">
      <h1>${workspace.name}</h1>
      <span class="status-badge ${workspace.type}">${workspace.type}</span>
    </div>

    <div class="grid-4">
      ${StatsCard({ label: 'Projects', value: projects.length })}
      ${StatsCard({ label: 'Members', value: members.length || 1 })}
      ${StatsCard({ label: 'Deployments', value: usage.deploymentsExecuted })}
      ${StatsCard({ label: 'Storage', value: formatBytes2(usage.storageBytes) })}
    </div>

    <div style="margin-top:var(--space-lg)" class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Workspace Info</div></div>
        <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
          <div><span style="color:var(--color-text-secondary)">Type:</span> ${workspace.type}</div>
          <div><span style="color:var(--color-text-secondary)">Created:</span> ${workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : '—'}</div>
          <div><span style="color:var(--color-text-secondary)">Organization:</span> ${org ? org.name : 'Personal'}</div>
          <div><span style="color:var(--color-text-secondary)">Project Count:</span> ${workspace.projectCount || 0}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Usage</div></div>
        ${UsageWidget({ metrics: usage })}
      </div>
    </div>
    ${org ? `
      <div style="margin-top:var(--space-lg)" class="card">
        <div class="card-header"><div class="card-title">Members (${members.length})</div></div>
        <div class="member-list">
          ${members.map(m => `
            <div class="member-row">
              <div class="avatar">${(m.userId || '?')[0].toUpperCase()}</div>
              <div class="info">
                <div class="name">${m.userId}</div>
                <div class="email">${m.role}</div>
              </div>
              <span class="status-badge ${m.role}">${m.role}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  return DashboardLayout({
    activePage: 'workspace',
    breadcrumbs: [{ label: 'Workspace' }],
    children: content,
  });
}

function formatBytes2(bytes) {
  if (!bytes) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${u[i]}`;
}

module.exports = { renderWorkspace };
