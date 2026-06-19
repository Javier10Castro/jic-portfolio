function StatsCard({ label, value, change, icon }) {
  return `
    <div class="stats-card">
      ${icon ? `<div style="color:var(--color-accent);margin-bottom:var(--space-xs)">${icon}</div>` : ''}
      <div class="label">${label}</div>
      <div class="value">${value != null ? value.toLocaleString() : '—'}</div>
      ${change != null ? `<div class="change">${change >= 0 ? '+' : ''}${change}% from last month</div>` : ''}
    </div>
  `;
}

module.exports = { StatsCard };
