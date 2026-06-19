function UsageWidget({ metrics, showDetail }) {
  const items = [
    { label: 'Projects', value: metrics.projectsCreated || 0, max: metrics.projectsLimit || 50, color: 'accent' },
    { label: 'Deployments', value: metrics.deploymentsExecuted || 0, max: metrics.deploymentsLimit || 100, color: 'success' },
    { label: 'AI Generations', value: metrics.aiGenerations || 0, max: metrics.aiLimit || 500, color: 'warning' },
    { label: 'Storage', value: formatBytes(metrics.storageBytes || 0), max: formatBytes(metrics.storageLimit || 104857600), color: 'accent', raw: true },
    { label: 'Bandwidth', value: formatBytes(metrics.bandwidthBytes || 0), max: formatBytes(metrics.bandwidthLimit || 1073741824), color: 'accent', raw: true },
    { label: 'API Calls', value: metrics.apiCalls || 0, max: metrics.apiLimit || 10000, color: 'error' },
  ];

  const bars = items.map(item => `
    <div style="display:flex;flex-direction:column;gap:var(--space-xs)">
      <div style="display:flex;justify-content:space-between;font-size:var(--font-size-sm)">
        <span style="color:var(--color-text-secondary)">${item.label}</span>
        <span>${item.raw ? item.value : item.value.toLocaleString()}${item.max && !item.raw ? ` / ${item.max.toLocaleString()}` : ''}</span>
      </div>
      ${!item.raw ? `
        <div class="usage-bar">
          <div class="fill ${item.color}" style="width:${Math.min(100, (item.value / (item.max || 1)) * 100)}%"></div>
        </div>
      ` : `
        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${item.value} used</div>
      `}
    </div>
  `).join('');

  return `<div style="display:flex;flex-direction:column;gap:var(--space-md)">${bars}</div>`;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(1)} ${units[i]}`;
}

module.exports = { UsageWidget };
