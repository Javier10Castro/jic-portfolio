const saas = require('../../../lib/saas/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { DeploymentCard } = require('../components/DeploymentCard');
const { EmptyState } = require('../components/EmptyState');

function renderProjectDetails({ projectId }) {
  const project = saas.projectManager.getProject(projectId);
  if (!project) {
    return DashboardLayout({
      activePage: 'projects',
      children: '<div class="empty-state"><h3>Project not found</h3></div>',
    });
  }

  const deploys = project.deploymentHistory || [];
  const genHistory = project.generationHistory || [];

  const content = `
    <div class="page-header">
      <h1>${project.name}</h1>
      <div style="display:flex;gap:var(--space-sm)">
        <span class="status-badge ${(project.status || 'draft').toLowerCase()}">${project.status || 'draft'}</span>
        <button class="btn btn-secondary btn-sm" data-action="duplicate" data-id="${project.id}">Duplicate</button>
        <button class="btn btn-secondary btn-sm" data-action="archive" data-id="${project.id}">Archive</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${project.id}">Delete</button>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Project tabs">
      <button class="tab active" role="tab" data-tab="overview">Overview</button>
      <button class="tab" role="tab" data-tab="deployments">Deployments</button>
      <button class="tab" role="tab" data-tab="generations">Generation History</button>
      <button class="tab" role="tab" data-tab="settings">Settings</button>
      <button class="tab" role="tab" data-tab="analytics">Analytics</button>
      <button class="tab" role="tab" data-tab="ai-conversation">AI Conversation</button>
    </div>

    <div class="tab-content" id="tab-overview">
      <div class="grid-2" style="margin-top:var(--space-lg)">
        <div class="card">
          <div class="card-header"><div class="card-title">Details</div></div>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            <div><span style="color:var(--color-text-secondary)">Type:</span> ${project.type || 'website'}</div>
            <div><span style="color:var(--color-text-secondary)">Owner:</span> ${project.owner || '—'}</div>
            <div><span style="color:var(--color-text-secondary)">Created:</span> ${project.createdAt ? new Date(project.createdAt).toLocaleString() : '—'}</div>
            <div><span style="color:var(--color-text-secondary)">Updated:</span> ${project.updatedAt ? new Date(project.updatedAt).toLocaleString() : '—'}</div>
            <div><span style="color:var(--color-text-secondary)">Deployments:</span> ${deploys.length}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Settings</div></div>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            <div><span style="color:var(--color-text-secondary)">Provider:</span> ${project.settings?.deploymentDefaults?.provider || 'vercel'}</div>
            <div><span style="color:var(--color-text-secondary)">Auto Deploy:</span> ${project.settings?.deploymentDefaults?.autoDeploy ? 'Yes' : 'No'}</div>
            <div><span style="color:var(--color-text-secondary)">AI Model:</span> ${project.settings?.aiDefaults?.model || 'standard'}</div>
            <div><span style="color:var(--color-text-secondary)">Max Generations:</span> ${project.settings?.aiDefaults?.maxGenerations || 10}</div>
          </div>
        </div>
      </div>
      <div style="margin-top:var(--space-lg)" class="card">
        <div class="card-header"><div class="card-title">Deployments</div></div>
        <div class="timeline">
          ${deploys.length ? deploys.slice().reverse().map(d => DeploymentCard({ deployment: d })).join('') : EmptyState({ title: 'No deployments yet' })}
        </div>
      </div>
      <div style="margin-top:var(--space-lg)" class="card">
        <div class="card-header"><div class="card-title">Generation History</div></div>
        ${genHistory.length ? `<div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">${genHistory.length} generations recorded</div>` : EmptyState({ title: 'No generation history' })}
      </div>
    </div>
  `;

  return DashboardLayout({
    activePage: 'projects',
    breadcrumbs: [{ label: 'Projects', href: '#projects' }, { label: project.name }],
    children: content,
  });
}

module.exports = { renderProjectDetails };
