const saas = require('../../../lib/saas/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { SearchBar } = require('../components/SearchBar');
const { EmptyState } = require('../components/EmptyState');

function renderAuditLog({ resource, actor, limit }) {
  const logs = saas.auditLog.getLog({ resource, actor, limit: limit || 100 });
  logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const resources = new Set();
  const actors = new Set();
  for (const l of logs) {
    if (l.resource) resources.add(l.resource);
    if (l.actor) actors.add(l.actor);
  }

  const content = `
    <div class="page-header">
      <h1>Audit Log</h1>
      <div style="display:flex;gap:var(--space-sm);align-items:center">
        ${SearchBar({ placeholder: 'Search audit log...' })}
        <button class="btn btn-secondary btn-sm" data-action="export-audit">Export</button>
      </div>
    </div>

    <div class="filter-bar" style="margin-bottom:var(--space-lg)">
      <select class="filter-select" data-filter="resource">
        <option value="">All Resources</option>
        ${Array.from(resources).map(r => `<option value="${r}"${resource === r ? ' selected' : ''}>${r}</option>`).join('')}
      </select>
      <select class="filter-select" data-filter="actor">
        <option value="">All Actors</option>
        ${Array.from(actors).map(a => `<option value="${a}"${actor === a ? ' selected' : ''}>${a}</option>`).join('')}
      </select>
      <select class="filter-select" data-filter="limit">
        <option value="25"${limit === 25 ? ' selected' : ''}>25 entries</option>
        <option value="50"${limit === 50 ? ' selected' : ''}>50 entries</option>
        <option value="100"${limit === 100 || !limit ? ' selected' : ''}>100 entries</option>
      </select>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">Timeline (${logs.length} entries)</div></div>
      ${logs.length ? `
        <div style="max-height:600px;overflow-y:auto">
          <div class="timeline">
            ${logs.map(l => `
              <div class="timeline-item">
                <div class="dot ${l.action?.includes('error') || l.action?.includes('failed') ? 'failed' : l.action?.includes('created') || l.action?.includes('deployed') ? 'success' : 'idle'}"></div>
                <div class="content">
                  <div class="title">
                    <code style="font-size:var(--font-size-xs);color:var(--color-accent)">${l.action || 'unknown'}</code>
                    ${l.resource ? `<span style="color:var(--color-text-secondary)">on</span> ${l.resource}` : ''}
                    ${l.resourceId ? `<code style="font-size:var(--font-size-xs)">${l.resourceId.slice(0, 16)}</code>` : ''}
                  </div>
                  <div class="meta">
                    ${l.actor ? `by <strong>${l.actor}</strong> · ` : ''}
                    ${l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}
                    ${l.details ? `· ${JSON.stringify(l.details).slice(0, 80)}${JSON.stringify(l.details).length > 80 ? '…' : ''}` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : EmptyState({ title: 'No audit entries found', description: 'Audit log captures all actions performed across the platform.' })}
    </div>
  `;

  return DashboardLayout({
    activePage: 'auditLog',
    breadcrumbs: [{ label: 'Audit Log' }],
    children: content,
  });
}

module.exports = { renderAuditLog };
