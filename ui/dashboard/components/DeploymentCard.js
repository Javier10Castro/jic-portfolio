function DeploymentCard({ deployment }) {
  const status = (deployment.status || 'idle').toLowerCase();
  const provider = deployment.provider || 'vercel';
  const version = deployment.version || '—';
  const date = deployment.createdAt ? new Date(deployment.createdAt).toLocaleString() : '—';
  const duration = deployment.durationMs ? `${(deployment.durationMs / 1000).toFixed(1)}s` : '—';

  return `
    <div class="timeline-item">
      <div class="dot ${status === 'success' || status === 'deployed' ? 'success' : status === 'failed' ? 'failed' : status === 'processing' ? 'processing' : 'idle'}"></div>
      <div class="content">
        <div class="title">
          ${provider.charAt(0).toUpperCase() + provider.slice(1)} ${version ? `v${version}` : ''}
          <span class="status-badge ${status}" style="margin-left:var(--space-xs)">${status}</span>
        </div>
        <div class="meta">${date} · ${duration}${deployment.commit ? ` · ${deployment.commit.slice(0, 7)}` : ''}</div>
        <div style="margin-top:var(--space-xs);display:flex;gap:var(--space-sm)">
          <button class="btn btn-ghost btn-sm" data-action="rollback" data-id="${deployment.id}">Rollback</button>
          <button class="btn btn-ghost btn-sm" data-action="report" data-id="${deployment.id}">Report</button>
        </div>
      </div>
    </div>
  `;
}

module.exports = { DeploymentCard };
