const { getClusterManager } = require('../../../lib/cluster');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { StatsCard } = require('../components/StatsCard');
const { EmptyState } = require('../components/EmptyState');

function renderCluster({ view, workerFilter, limit }) {
  const manager = getClusterManager();
  const health = manager.getClusterHealth();
  const workers = manager.getWorkers(workerFilter ? { status: workerFilter } : {});
  const queues = manager.getQueues();

  const workerSummary = health && health.workers ? health.workers : { total: 0, healthy: 0, degraded: 0, offline: 0 };
  const queueSizes = health && health.queues ? health.queues : {};
  const leaderInfo = health && health.leader ? health.leader : { isLeader: false, leaderId: null };

  const statusBadge = (s) => {
    const map = { idle: 'success', busy: 'warning', degraded: 'error', offline: 'muted', stale: 'muted' };
    return `<span class="badge badge-${map[s] || 'muted'}">${s}</span>`;
  };

  const stats = [
    { label: 'Total Workers', value: workerSummary.total || 0, change: 0 },
    { label: 'Healthy', value: workerSummary.healthy || 0, change: 0 },
    { label: 'Queue Items', value: Object.values(queueSizes).reduce((a, b) => a + (b.size || b || 0), 0), change: 0 },
    { label: 'Throughput', value: (health && health.throughput && health.throughput.completed) || 0, change: 0 },
  ];

  const content = `
    <div class="page-header">
      <h1>Cluster Center</h1>
      <div style="display:flex;gap:var(--space-sm);align-items:center">
        <span class="badge badge-${health && health.status === 'healthy' ? 'success' : health && health.status === 'degraded' ? 'error' : 'info'}">${(health && health.status) || 'unknown'}</span>
        <span style="font-size:var(--font-size-xs);color:var(--color-text-muted)">ID: ${(health && health.clusterId) || '-'}</span>
      </div>
    </div>
    <div class="grid-4">${stats.map(s => StatsCard(s)).join('')}</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg);margin:var(--space-lg) 0">
      <div class="card">
        <div class="card-header"><div class="card-title">Leader Status</div></div>
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;padding:var(--space-sm) 0">
            <span>Leader</span>
            <strong>${leaderInfo.leaderId || 'None'}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-sm) 0">
            <span>Term</span>
            <strong>${leaderInfo.term || 0}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-sm) 0">
            <span>Is Leader</span>
            <strong>${leaderInfo.isLeader ? 'Yes' : 'No'}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-sm) 0">
            <span>Running</span>
            <strong>${leaderInfo.running ? 'Yes' : 'No'}</strong>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Queue Depth</div></div>
        <div class="card-body">
          ${Object.keys(queueSizes).length ? Object.entries(queueSizes).map(([name, data]) => {
            const size = typeof data === 'object' ? data.size || 0 : data;
            const pct = Math.min(size / 100 * 100, 100);
            return `
              <div style="margin-bottom:var(--space-sm)">
                <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-xs)">
                  <span style="text-transform:capitalize">${name}</span>
                  <strong>${size}</strong>
                </div>
                <div style="height:6px;background:var(--color-bg-tertiary);border-radius:3px;overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:var(--color-primary);border-radius:3px"></div>
                </div>
              </div>
            `;
          }).join('') : EmptyState({ title: 'No queues', description: 'Queues will appear when tasks are dispatched' })}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">Workers (${workers.length})</div></div>
      ${workers.length ? `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Hostname</th>
                <th>CPU</th>
                <th>Memory</th>
                <th>Tasks</th>
                <th>Heartbeat</th>
                <th>Uptime</th>
              </tr>
            </thead>
            <tbody>
              ${workers.slice(0, limit || 100).map(w => {
                const wj = w.toJSON ? w.toJSON() : w;
                const mem = wj.memory || {};
                const memPct = mem.total ? Math.round((mem.used || 0) / mem.total * 100) : 0;
                const uptime = wj.uptime || (wj.startedAt ? Date.now() - wj.startedAt : 0);
                const uptimeStr = uptime > 3600000 ? Math.round(uptime / 3600000) + 'h' : uptime > 60000 ? Math.round(uptime / 60000) + 'm' : Math.round(uptime / 1000) + 's';
                const heartbeatAgo = wj.lastHeartbeat ? Math.round((Date.now() - wj.lastHeartbeat) / 1000) + 's ago' : '-';
                return `
                  <tr>
                    <td><code>${wj.id}</code></td>
                    <td><span class="badge badge-info">${wj.type}</span></td>
                    <td>${statusBadge(wj.status)}</td>
                    <td>${wj.hostname}</td>
                    <td>${wj.cpu !== undefined ? Math.round(wj.cpu) + '%' : '-'}</td>
                    <td>${memPct}% (${Math.round((mem.used || 0) / 10.24) / 100}GB/${Math.round((mem.total || 1024) / 10.24) / 100}GB)</td>
                    <td>${wj.queueSize || wj.runningTasks ? (wj.runningTasks || []).length : 0}</td>
                    <td style="font-size:var(--font-size-xs)">${heartbeatAgo}</td>
                    <td style="font-size:var(--font-size-xs)">${uptimeStr}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : EmptyState({ title: 'No workers registered', description: 'Register a worker to get started' })}
    </div>

    <div class="card" style="margin-top:var(--space-lg)">
      <div class="card-header"><div class="card-title">Metrics</div></div>
      <div class="card-body">
        <div class="grid-3">
          <div>
            <h4 style="margin-bottom:var(--space-sm)">Tasks</h4>
            <div style="display:flex;flex-direction:column;gap:var(--space-xs)">
              <div style="display:flex;justify-content:space-between"><span>Dispatched</span><strong>${(health && health.metrics && health.metrics.counters ? Object.entries(health.metrics.counters).filter(([k]) => k.startsWith('tasks.dispatched')).reduce((s, [, v]) => s + v, 0) : 0)}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Completed</span><strong>${health && health.throughput ? health.throughput.completed : 0}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Failed</span><strong>${health && health.throughput ? health.throughput.failed : 0}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Running</span><strong>${health && health.tasks ? health.tasks.dispatched : 0}</strong></div>
            </div>
          </div>
          <div>
            <h4 style="margin-bottom:var(--space-sm)">Cluster</h4>
            <div style="display:flex;flex-direction:column;gap:var(--space-xs)">
              <div style="display:flex;justify-content:space-between"><span>Uptime</span><strong>${health && health.uptime ? Math.round(health.uptime / 60000) + 'm' : '-'}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Failovers</span><strong>${(health && health.metrics && health.metrics.counters ? health.metrics.counters.failovers || 0 : 0)}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Heartbeats</span><strong>${(health && health.metrics && health.metrics.counters ? Object.entries(health.metrics.counters).filter(([k]) => k.startsWith('heartbeats')).reduce((s, [, v]) => s + v, 0) : 0)}</strong></div>
            </div>
          </div>
          <div>
            <h4 style="margin-bottom:var(--space-sm)">Strategies</h4>
            <div style="display:flex;flex-direction:column;gap:var(--space-xs)">
              <div style="display:flex;justify-content:space-between"><span>Load Balancer</span><strong>round_robin</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Heartbeat Interval</span><strong>5s</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Election Timeout</span><strong>10s</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return DashboardLayout({
    activePage: 'cluster',
    pageTitle: '',
    breadcrumbs: [{ label: 'Cluster' }],
    children: content,
  });
}

module.exports = { renderCluster };
