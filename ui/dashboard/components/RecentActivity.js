function RecentActivity({ items, maxItems }) {
  const list = items || [];
  const show = list.slice(0, maxItems || 10);
  if (!show.length) return '<div class="empty-state" style="padding:var(--space-lg)"><h3>No recent activity</h3></div>';

  return `
    <div class="recent-activity">
      ${show.map(item => {
        const iconMap = { created: '✦', updated: '✎', deleted: '✕', deployed: '▲', failed: '✖' };
        const icon = iconMap[item.action?.split('.')[1]] || '●';
        return `
          <div class="activity-item">
            <div class="icon" style="background:var(--color-surface-active);color:var(--color-text-secondary)">${icon}</div>
            <div class="text">
              <strong>${item.action || 'event'}</strong>
              ${item.resource ? `on ${item.resource} ${item.resourceId ? `<code style="font-size:var(--font-size-xs)">${item.resourceId.slice(0, 12)}</code>` : ''}` : ''}
            </div>
            <div class="time">${item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

module.exports = { RecentActivity };
