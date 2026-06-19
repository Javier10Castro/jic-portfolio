const { getTelemetryManager } = require('../../../lib/telemetry');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { StatsCard } = require('../components/StatsCard');
const { EmptyState } = require('../components/EmptyState');

function renderObservability({ page, limit }) {
  const manager = getTelemetryManager();
  const currentPage = page || 'overview';

  const allMetrics = manager.metrics.getAllMetrics();
  const counters = allMetrics.counters || {};
  const histograms = allMetrics.histograms || {};
  const health = manager.health.getSummary();
  const storage = manager.storage.snapshot();
  const alertCounts = manager.alerts.getAlertCounts();
  const activeTraces = manager.tracing.getActiveTraces();

  const totalRequests = Object.entries(counters).filter(([k]) => k.startsWith('api.requests') || k === 'api.requests')
    .reduce((s, [, v]) => s + v, 0);
  const totalErrors = Object.entries(counters).filter(([k]) => k.includes('errors'))
    .reduce((s, [, v]) => s + v, 0);
  const totalTokens = Object.entries(counters).filter(([k]) => k.startsWith('ai.tokens'))
    .reduce((s, [, v]) => s + v, 0);

  const healthyCount = Object.values(health).filter(h => h.status === 'healthy').length;
  const degradedCount = Object.values(health).filter(h => h.status === 'degraded').length;
  const offlineCount = Object.values(health).filter(h => h.status === 'offline').length;

  const pages = {
    overview: `
      <div class="page-header"><h1>Observability</h1></div>
      <div class="grid-4">
        ${StatsCard({ label: 'Total Requests', value: totalRequests, change: 0 })}
        ${StatsCard({ label: 'Total Errors', value: totalErrors, change: 0 })}
        ${StatsCard({ label: 'AI Tokens', value: totalTokens.toLocaleString(), change: 0 })}
        ${StatsCard({ label: 'Active Alerts', value: alertCounts.active || 0, change: 0 })}
      </div>
      <div class="grid-2" style="margin-top:var(--space-lg)">
        <div class="card">
          <div class="card-header"><div class="card-title">System Health</div></div>
          <div style="padding:var(--space-md)">
            <div class="grid-3">
              <div style="text-align:center"><div style="font-size:2em;color:var(--color-success)">${healthyCount}</div><small>Healthy</small></div>
              <div style="text-align:center"><div style="font-size:2em;color:var(--color-warning)">${degradedCount}</div><small>Degraded</small></div>
              <div style="text-align:center"><div style="font-size:2em;color:var(--color-error)">${offlineCount}</div><small>Offline</small></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Storage</div></div>
          <div style="padding:var(--space-md)">
            <div class="grid-2">
              <div><strong>Metrics</strong><br>${storage.metrics}</div>
              <div><strong>Traces</strong><br>${storage.traces}</div>
              <div><strong>Logs</strong><br>${storage.logs}</div>
              <div><strong>Alerts</strong><br>${storage.alerts}</div>
            </div>
          </div>
        </div>
      </div>
      ${activeTraces.length ? `
      <div class="card" style="margin-top:var(--space-lg)">
        <div class="card-header"><div class="card-title">Active Traces (${activeTraces.length})</div></div>
        <div class="table-responsive">
          <table class="table"><thead><tr><th>Trace ID</th><th>Service</th><th>Spans</th><th>Open</th></tr></thead>
          <tbody>${activeTraces.map(t => `<tr><td><code>${t.traceId}</code></td><td>${t.rootSpan?.service || '-'}</td><td>${t.spanCount}</td><td>${t.openSpans}</td></tr>`).join('')}</tbody>
        </table>
      </div>` : ''}
    `,
    metrics: `
      <div class="page-header"><h1>Metrics</h1></div>
      <div class="card">
        <div class="card-header"><div class="card-title">Counters</div></div>
        ${Object.keys(counters).length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Metric</th><th>Value</th></tr></thead>
        <tbody>${Object.entries(counters).sort().map(([k, v]) => `<tr><td><code>${k}</code></td><td>${v}</td></tr>`).join('')}</tbody></table></div>`
        : EmptyState({ title: 'No metrics recorded yet' })}
      </div>
      <div class="card" style="margin-top:var(--space-lg)">
        <div class="card-header"><div class="card-title">Gauges</div></div>
        ${Object.keys(allMetrics.gauges || {}).length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Gauge</th><th>Value</th></tr></thead>
        <tbody>${Object.entries(allMetrics.gauges).sort().map(([k, v]) => `<tr><td><code>${k}</code></td><td>${typeof v === 'number' ? v.toFixed(2) : v}</td></tr>`).join('')}</tbody></table></div>`
        : EmptyState({ title: 'No gauges recorded' })}
      </div>
    `,
    health: `
      <div class="page-header"><h1>Health</h1></div>
      <div class="grid-3" style="margin-bottom:var(--space-lg)">
        <div class="card"><div style="padding:var(--space-md);text-align:center"><div style="font-size:2em;color:var(--color-success)">${healthyCount}</div><strong>Healthy</strong></div></div>
        <div class="card"><div style="padding:var(--space-md);text-align:center"><div style="font-size:2em;color:var(--color-warning)">${degradedCount}</div><strong>Degraded</strong></div></div>
        <div class="card"><div style="padding:var(--space-md);text-align:center"><div style="font-size:2em;color:var(--color-error)">${offlineCount}</div><strong>Offline</strong></div></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Component Status</div></div>
        <div class="table-responsive"><table class="table"><thead><tr><th>Component</th><th>Status</th><th>Message</th></tr></thead>
        <tbody>${Object.entries(health).map(([comp, h]) => `
          <tr>
            <td>${comp}</td>
            <td><span class="badge badge-${h.status === 'healthy' ? 'success' : h.status === 'degraded' ? 'warning' : 'error'}">${h.status}</span></td>
            <td>${h.message || '-'}</td>
          </tr>`).join('')}</tbody></table></div>
      </div>
    `,
    alerts: `
      <div class="page-header"><h1>Alerts</h1></div>
      <div class="grid-4" style="margin-bottom:var(--space-lg)">
        ${StatsCard({ label: 'Total Alerts', value: alertCounts.total || 0, change: 0 })}
        ${StatsCard({ label: 'Active', value: alertCounts.active || 0, change: 0 })}
        ${StatsCard({ label: 'Acknowledged', value: alertCounts.acknowledged || 0, change: 0 })}
        ${StatsCard({ label: 'Resolved', value: alertCounts.resolved || 0, change: 0 })}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Alert Rules</div></div>
        ${manager.alerts.listRules().length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Name</th><th>Severity</th><th>Created</th></tr></thead>
        <tbody>${manager.alerts.listRules().map(r => `<tr><td>${r.name}</td><td><span class="badge badge-${r.severity === 'critical' ? 'error' : 'warning'}">${r.severity}</span></td><td>${new Date(r.createdAt).toLocaleString()}</td></tr>`).join('')}</tbody></table></div>`
        : EmptyState({ title: 'No alert rules', description: 'Add alert rules to monitor the system' })}
      </div>
    `,
    diagnostics: `
      <div class="page-header"><h1>Diagnostics</h1></div>
      <div class="grid-2">
        <div class="card"><div class="card-header"><div class="card-title">System</div></div>
        <div style="padding:var(--space-md)"><strong>Uptime</strong><br>${Math.round(process.uptime())}s<br><br><strong>Memory</strong><br>${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB / ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB<br><br><strong>Node</strong><br>${process.version}</div></div>
        <div class="card"><div class="card-header"><div class="card-title">Active Traces</div></div>
        <div style="padding:var(--space-md)"><strong>Active</strong><br>${activeTraces.length}<br><br><strong>Total Spans</strong><br>${activeTraces.reduce((s, t) => s + t.spanCount, 0)}</div></div>
      </div>
    `,
  };

  const tabs = ['overview', 'metrics', 'health', 'alerts', 'diagnostics'];
  const tabBar = tabs.map(t => `<a class="tab${currentPage === t ? ' active' : ''}" href="#observability?page=${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</a>`).join('');

  const content = `
    <div class="tab-bar" style="margin-bottom:var(--space-lg)">${tabBar}</div>
    ${pages[currentPage] || pages.overview}
  `;

  return DashboardLayout({
    activePage: 'observability',
    breadcrumbs: [{ label: 'Observability' }],
    children: content,
  });
}

module.exports = { renderObservability };
