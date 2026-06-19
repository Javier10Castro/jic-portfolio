const saas = require('../../../lib/saas/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { StatsCard } = require('../components/StatsCard');
const { UsageWidget } = require('../components/UsageWidget');

function renderUsage({ organizationId }) {
  const usage = saas.usageTracker.getSummary(organizationId);

  const content = `
    <div class="page-header"><h1>Usage & Billing</h1></div>

    <div class="grid-4">
      ${StatsCard({ label: 'Projects', value: usage.projectsCreated })}
      ${StatsCard({ label: 'Deployments', value: usage.deploymentsExecuted })}
      ${StatsCard({ label: 'AI Generations', value: usage.aiGenerations })}
      ${StatsCard({ label: 'API Calls', value: usage.apiCalls })}
    </div>

    <div style="margin-top:var(--space-lg)" class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Resource Usage</div></div>
        ${UsageWidget({ metrics: usage })}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Charts</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
          <div style="background:var(--color-surface-active);border-radius:var(--radius-md);height:120px;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-sm);color:var(--color-text-muted)">Projects</div>
          <div style="background:var(--color-surface-active);border-radius:var(--radius-md);height:120px;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-sm);color:var(--color-text-muted)">Deployments</div>
          <div style="background:var(--color-surface-active);border-radius:var(--radius-md);height:120px;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-sm);color:var(--color-text-muted)">AI Generations</div>
          <div style="background:var(--color-surface-active);border-radius:var(--radius-md);height:120px;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-sm);color:var(--color-text-muted)">Bandwidth</div>
        </div>
        <div style="margin-top:var(--space-sm);font-size:var(--font-size-xs);color:var(--color-text-muted);text-align:center">Chart library placeholder — ready for Chart.js / Recharts integration</div>
      </div>
    </div>

    <div style="margin-top:var(--space-lg)" class="card">
      <div class="card-header"><div class="card-title">Storage</div></div>
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div>
          <div style="display:flex;justify-content:space-between;font-size:var(--font-size-sm);margin-bottom:var(--space-xs)">
            <span style="color:var(--color-text-secondary)">Storage Used</span>
            <span>${formatBytes3(usage.storageBytes)}</span>
          </div>
          <div class="usage-bar">
            <div class="fill accent" style="width:${Math.min(100, (usage.storageBytes / (104857600 || 1)) * 100)}%"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:var(--font-size-sm);margin-bottom:var(--space-xs)">
            <span style="color:var(--color-text-secondary)">Bandwidth Used</span>
            <span>${formatBytes3(usage.bandwidthBytes)}</span>
          </div>
          <div class="usage-bar">
            <div class="fill warning" style="width:${Math.min(100, (usage.bandwidthBytes / (1073741824 || 1)) * 100)}%"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  return DashboardLayout({
    activePage: 'usage',
    breadcrumbs: [{ label: 'Usage' }],
    children: content,
  });
}

function formatBytes3(bytes) {
  if (!bytes) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${u[i]}`;
}

module.exports = { renderUsage };
