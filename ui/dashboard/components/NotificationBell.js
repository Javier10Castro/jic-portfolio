function NotificationBell({ count }) {
  return `
    <div class="notification-bell" role="button" tabindex="0" aria-label="Notifications${count ? `, ${count} unread` : ''}" title="Notifications">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      ${count ? `<span class="dot" aria-hidden="true"></span>` : ''}
    </div>
  `;
}

module.exports = { NotificationBell };
