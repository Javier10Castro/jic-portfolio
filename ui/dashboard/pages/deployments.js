const saas = require('../../../lib/saas/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { DeploymentCard } = require('../components/DeploymentCard');
const { StatsCard } = require('../components/StatsCard');
const { SearchBar } = require('../components/SearchBar');
const { EmptyState } = require('../components/EmptyState');

function renderDeployments({ workspaceId, statusFilter }) {
  const projects = workspaceId ? saas.projectManager.listProjects(workspaceId) : [];
  const allDeployments = [];
  for (const p of projects) {
    for (const d of (p.deploymentHistory || [])) {
      allDeployments.push({ ...d, projectName: p.name, projectId: p.id });
    }
  }
  allDeployments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const filtered = statusFilter ? allDeployments.filter(d => d.status === statusFilter) : allDeployments;

  const stats = [
    { label: 'Total Deployments', value: allDeployments.length, change: 0 },
    { label: 'Successful', value: allDeployments.filter(d => d.status === 'success' || d.status === 'deployed').length, change: 0 },
    { label: 'Failed', value: allDeployments.filter(d => d.status === 'failed').length, change: 0 },
    { label: 'Active Projects', value: projects.filter(p => p.status !== 'archived').length, change: 0 },
  ];

  const content = `
    <div class="page-header">
      <h1>Deployments</h1>
      <div style="display:flex;gap:var(--space-sm);align-items:center">
        ${SearchBar({ placeholder: 'Search deployments...' })}
        <button class="btn btn-primary" data-action="new-deployment">New Deployment</button>
      </div>
    </div>
    <div class="grid-4">${stats.map(s => StatsCard(s)).join('')}</div>
    <div class="filter-bar" style="margin:var(--space-lg) 0">
      <select class="filter-select" data-filter="status">
        <option value="">All Status</option>
        <option value="success"${statusFilter === 'success' ? ' selected' : ''}>Success</option>
        <option value="failed"${statusFilter === 'failed' ? ' selected' : ''}>Failed</option>
        <option value="processing"${statusFilter === 'processing' ? ' selected' : ''}>Processing</option>
      </select>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Deployment Timeline</div></div>
      <div class="timeline">
        ${filtered.length ? filtered.map(d => DeploymentCard({ deployment: d })).join('') : EmptyState({ title: 'No deployments found' })}
      </div>
    </div>
  `;

  return DashboardLayout({
    activePage: 'deployments',
    breadcrumbs: [{ label: 'Deployments' }],
    children: content,
  });
}

module.exports = { renderDeployments };
