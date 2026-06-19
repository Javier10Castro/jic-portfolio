const { AgentOrchestrator } = require('../../../lib/agents/agentOrchestrator');
const { ALL_AGENT_NAMES, ALL_AGENTS } = require('../../../lib/agents/planning/taskPlanner');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { StatsCard } = require('../components/StatsCard');
const { EmptyState } = require('../components/EmptyState');

const orchestrator = new AgentOrchestrator();

function renderAgents({ activeAgent, filterStatus, limit }) {
  const metrics = orchestrator.getMetrics();
  const agents = ALL_AGENT_NAMES.map(id => {
    const agent = orchestrator.getAgent(id);
    const m = agent ? agent.metricsReport() : {};
    return { id, name: id.charAt(0).toUpperCase() + id.slice(1), executions: m.executions || 0, totalTime: m.totalTime || 0, avgTime: m.avgTime || 0 };
  });

  const stats = [
    { label: 'Total Agents', value: ALL_AGENT_NAMES.length, change: 0 },
    { label: 'Total Workflows', value: metrics.totalWorkflows || 0, change: 0 },
    { label: 'Total Executions', value: agents.reduce((s, a) => s + a.executions, 0), change: 0 },
    { label: 'Avg Execution Time', value: `${Math.round(agents.reduce((s, a) => s + a.avgTime, 0) / agents.length * 10) / 10}s`, change: 0 },
  ];

  const workflowList = metrics.totalWorkflows > 0 ? orchestrator.listWorkflows(limit || 10) : [];

  const content = `
    <div class="page-header">
      <h1>Agents</h1>
      <div style="display:flex;gap:var(--space-sm);align-items:center">
        <button class="btn btn-primary" data-action="run-workflow">Run Workflow</button>
      </div>
    </div>
    <div class="grid-4">${stats.map(s => StatsCard(s)).join('')}</div>

    <div class="card" style="margin-top:var(--space-lg)">
      <div class="card-header"><div class="card-title">Agent Overview</div></div>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Executions</th>
              <th>Total Time</th>
              <th>Avg Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${agents.map(a => `
              <tr>
                <td><strong>${a.name}</strong></td>
                <td>${a.executions}</td>
                <td>${Math.round(a.totalTime * 10) / 10}s</td>
                <td>${Math.round(a.avgTime * 10) / 10}s</td>
                <td><span class="badge badge-${a.executions > 0 ? 'success' : 'muted'}">${a.executions > 0 ? 'Active' : 'Idle'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:var(--space-lg)">
      <div class="card-header"><div class="card-title">Recent Workflows</div></div>
      ${workflowList.length ? `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Workflow ID</th>
                <th>Status</th>
                <th>Agents</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              ${workflowList.map(w => `
                <tr>
                  <td><code>${w.workflowId}</code></td>
                  <td><span class="badge badge-${w.status === 'completed' ? 'success' : w.status === 'failed' ? 'error' : 'warning'}">${w.status}</span></td>
                  <td>${(w.agents || []).join(', ')}</td>
                  <td>${Math.round((w.duration || 0) * 10) / 10}s</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : EmptyState({ title: 'No workflows run yet', description: 'Run a workflow to see results here' })}
    </div>

    <div class="card" style="margin-top:var(--space-lg)">
      <div class="card-header"><div class="card-title">Agent Descriptions</div></div>
      <div class="grid-2" style="padding:var(--space-md)">
        ${ALL_AGENTS.map(a => `
          <div class="agent-card" style="border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-md)">
            <h3 style="margin:0 0 var(--space-xs) 0">${a.name}</h3>
            <p style="margin:0;color:var(--color-text-muted);font-size:var(--font-size-sm)">${a.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  return DashboardLayout({
    activePage: 'agents',
    breadcrumbs: [{ label: 'Agents' }],
    children: content,
  });
}

module.exports = { renderAgents };
