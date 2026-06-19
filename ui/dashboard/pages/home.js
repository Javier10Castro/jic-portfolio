const saas = require('../../../lib/saas/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { StatsCard } = require('../components/StatsCard');
const { ProjectCard } = require('../components/ProjectCard');
const { DeploymentCard } = require('../components/DeploymentCard');
const { RecentActivity } = require('../components/RecentActivity');
const { UsageWidget } = require('../components/UsageWidget');
const { QuickActions } = require('../components/QuickActions');

function renderHome({ workspaceId, userId }) {
  const projects = workspaceId ? saas.projectManager.listProjects(workspaceId) : [];
  const recent = projects.slice(-5).reverse();
  const usage = saas.usageTracker.getSummary();

  const stats = [
    { label: 'Total Projects', value: saas.projectManager.listProjects(workspaceId).length, change: 0 },
    { label: 'Total Deployments', value: usage.deploymentsExecuted, change: 0 },
    { label: 'AI Generations', value: usage.aiGenerations, change: 0 },
    { label: 'API Calls', value: usage.apiCalls, change: 0 },
  ];

  const activityLog = saas.auditLog ? saas.auditLog.getLog({ limit: 10 }) : [];

  const recentDeploymentsHtml = projects.length ? projects.slice(-3).map(p => {
    const deploys = p.deploymentHistory || [];
    if (!deploys.length) return '';
    return deploys.slice(-1).map(d => DeploymentCard({ deployment: { ...d, projectName: p.name } })).join('');
  }).filter(Boolean).join('') : '<div class="empty-state" style="padding:var(--space-lg)"><h3>No deployments yet</h3></div>';

  const recentProjectsHtml = recent.length
    ? recent.map(p => ProjectCard({ project: p })).join('')
    : '<div class="empty-state" style="padding:var(--space-lg)"><h3>No projects yet</h3><p>Create your first project to get started.</p></div>';

  const content = `
    <div class="grid-4">${stats.map(s => StatsCard(s)).join('')}</div>
    <div style="margin-top:var(--space-lg)">
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">Quick Actions</div></div>
          ${QuickActions({})}
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Usage Overview</div></div>
          ${UsageWidget({ metrics: usage })}
        </div>
      </div>
    </div>
    <div style="margin-top:var(--space-lg)">
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">Recent Projects</div></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--space-sm)">
            ${recentProjectsHtml}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Recent Deployments</div></div>
          <div class="timeline">${recentDeploymentsHtml}</div>
        </div>
      </div>
    </div>
    <div style="margin-top:var(--space-lg)">
      <div class="card">
        <div class="card-header"><div class="card-title">Recent Activity</div></div>
        ${RecentActivity({ items: activityLog, maxItems: 10 })}
      </div>
    </div>
  `;

  return DashboardLayout({
    activePage: 'home',
    breadcrumbs: [{ label: 'Dashboard' }],
    workspaceName: workspaceId || 'Personal',
    children: content,
  });
}

module.exports = { renderHome };
