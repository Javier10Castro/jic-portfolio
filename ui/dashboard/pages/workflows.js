const { getWorkflowManager } = require('../../../lib/workflows');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { StatsCard } = require('../components/StatsCard');
const { EmptyState } = require('../components/EmptyState');

function renderWorkflows({ statusFilter, limit }) {
  const manager = getWorkflowManager();
  const metrics = manager.metrics.getAggregates();
  const workflows = manager.listWorkflows(statusFilter ? { status: statusFilter } : {});
  const defs = manager.listDefinitions();

  const statusCounts = {};
  for (const w of workflows) {
    statusCounts[w.status] = (statusCounts[w.status] || 0) + 1;
  }

  const stats = [
    { label: 'Total Workflows', value: metrics.totalExecutions, change: 0 },
    { label: 'Active', value: workflows.filter(w => w.status === 'RUNNING' || w.status === 'QUEUED').length, change: 0 },
    { label: 'Completed', value: statusCounts.COMPLETED || 0, change: 0 },
    { label: 'Failed', value: statusCounts.FAILED || 0, change: 0 },
  ];

  const statusBadge = (s) => {
    const map = {
      CREATED: 'muted', QUEUED: 'info', RUNNING: 'warning',
      PAUSED: 'info', FAILED: 'error', COMPLETED: 'success',
      CANCELLED: 'muted', ROLLED_BACK: 'error', RETRYING: 'warning',
    };
    return `<span class="badge badge-${map[s] || 'muted'}">${s}</span>`;
  };

  const content = `
    <div class="page-header">
      <h1>Workflow Center</h1>
      <div style="display:flex;gap:var(--space-sm);align-items:center">
        <button class="btn btn-primary" data-action="new-workflow">New Workflow</button>
      </div>
    </div>
    <div class="grid-4">${stats.map(s => StatsCard(s)).join('')}</div>

    <div class="filter-bar" style="margin:var(--space-lg) 0">
      <select class="filter-select" data-filter="status">
        <option value="">All Status</option>
        <option value="CREATED"${statusFilter === 'CREATED' ? ' selected' : ''}>Created</option>
        <option value="QUEUED"${statusFilter === 'QUEUED' ? ' selected' : ''}>Queued</option>
        <option value="RUNNING"${statusFilter === 'RUNNING' ? ' selected' : ''}>Running</option>
        <option value="PAUSED"${statusFilter === 'PAUSED' ? ' selected' : ''}>Paused</option>
        <option value="FAILED"${statusFilter === 'FAILED' ? ' selected' : ''}>Failed</option>
        <option value="COMPLETED"${statusFilter === 'COMPLETED' ? ' selected' : ''}>Completed</option>
        <option value="CANCELLED"${statusFilter === 'CANCELLED' ? ' selected' : ''}>Cancelled</option>
      </select>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">Workflows</div></div>
      ${workflows.length ? `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Definition</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${workflows.slice(0, limit || 50).map(w => `
                <tr>
                  <td><code>${w.id}</code></td>
                  <td>${w.name || w.definitionId}</td>
                  <td>${statusBadge(w.status)}</td>
                  <td>${w.createdAt ? new Date(w.createdAt).toLocaleString() : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : EmptyState({ title: 'No workflows found', description: 'Create a workflow to get started' })}
    </div>

    <div class="card" style="margin-top:var(--space-lg)">
      <div class="card-header"><div class="card-title">Workflow Definitions</div></div>
      ${defs.length ? `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Version</th>
                <th>Steps</th>
              </tr>
            </thead>
            <tbody>
              ${defs.map(d => `
                <tr>
                  <td><code>${d.id}</code></td>
                  <td>${d.name}</td>
                  <td>${d.type}</td>
                  <td>v${d.version}</td>
                  <td>${(d.steps || []).length}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : EmptyState({ title: 'No definitions registered' })}
    </div>

    <div style="margin-top:var(--space-lg)">
      <div class="card">
        <div class="card-header"><div class="card-title">Execution Metrics</div></div>
        <div style="padding:var(--space-md)">
          <div class="grid-3">
            <div><strong>Avg Duration</strong><br><span style="font-size:1.5em">${Math.round(metrics.avgDuration)}ms</span></div>
            <div><strong>Failure Rate</strong><br><span style="font-size:1.5em">${(metrics.failureRate * 100).toFixed(1)}%</span></div>
            <div><strong>Avg Retries</strong><br><span style="font-size:1.5em">${metrics.avgRetries.toFixed(1)}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  return DashboardLayout({
    activePage: 'workflows',
    breadcrumbs: [{ label: 'Workflows' }],
    children: content,
  });
}

module.exports = { renderWorkflows };
