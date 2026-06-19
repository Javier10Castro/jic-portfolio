function UserMenu({ userName, userEmail }) {
  const initial = (userName || userEmail || 'U')[0].toUpperCase();
  return `
    <div class="user-menu-trigger" role="button" tabindex="0" aria-label="User menu" aria-haspopup="true">
      <div class="avatar">${initial}</div>
      <span style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">${userName || userEmail || 'User'}</span>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted)"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  `;
}

module.exports = { UserMenu };
