function Topbar({ breadcrumbs, userName, notificationCount }) {
  const crumbs = breadcrumbs ? breadcrumbs.map((c, i) => {
    if (i === breadcrumbs.length - 1) return `<span>${c.label}</span>`;
    return `<a href="${c.href || '#'}">${c.label}</a><span class="separator">/</span>`;
  }).join('') : '';

  return `
    <header class="topbar" role="banner">
      <div class="topbar-left">
        ${crumbs ? `<nav class="breadcrumbs" aria-label="Breadcrumb">${crumbs}</nav>` : ''}
      </div>
      <div class="topbar-right">
        <div class="notification-bell" title="Notifications" role="button" tabindex="0" aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          ${notificationCount ? '<span class="dot"></span>' : ''}
        </div>
        <div class="user-menu-trigger" role="button" tabindex="0" aria-label="User menu">
          <div class="avatar">${(userName || 'U')[0].toUpperCase()}</div>
        </div>
      </div>
    </header>
  `;
}

module.exports = { Topbar };
