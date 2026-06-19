const saas = require('../../../lib/saas/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');

function renderProfile({ userId }) {
  const user = userId ? saas.userManager.getUser(userId) : null;
  const sessions = userId ? saas.sessionManager.listSessions(userId) : [];

  const content = `
    <div class="page-header"><h1>Profile</h1></div>

    <div class="tabs" role="tablist" aria-label="Profile tabs">
      <button class="tab active" role="tab" data-tab="profile">Profile</button>
      <button class="tab" role="tab" data-tab="notifications">Notifications</button>
      <button class="tab" role="tab" data-tab="sessions">Sessions</button>
    </div>

    <div class="tab-content" id="tab-profile" style="margin-top:var(--space-lg)">
      <div class="card" style="max-width:600px">
        <div class="card-header"><div class="card-title">Personal Information</div></div>
        <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-lg)">
          <div class="avatar" style="width:48px;height:48px;font-size:var(--font-size-xl)">${(user?.name || 'U')[0].toUpperCase()}</div>
          <div>
            <div style="font-weight:600">${user?.name || 'Unknown User'}</div>
            <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">${user?.email || ''}</div>
          </div>
        </div>
        <div class="form-group">
          <label for="profile-name">Name</label>
          <input class="form-input" id="profile-name" value="${user?.name || ''}" />
        </div>
        <div class="form-group">
          <label for="profile-email">Email</label>
          <input class="form-input" id="profile-email" value="${user?.email || ''}" type="email" />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label for="profile-lang">Language</label>
            <select class="form-select" id="profile-lang">
              <option value="en"${user?.preferences?.preferredLang === 'en' ? ' selected' : ''}>English</option>
              <option value="es"${user?.preferences?.preferredLang === 'es' ? ' selected' : ''}>Spanish</option>
            </select>
          </div>
          <div class="form-group">
            <label for="profile-theme">Theme</label>
            <select class="form-select" id="profile-theme">
              <option value="dark"${(!user?.preferences?.theme || user?.preferences?.theme === 'dark') ? ' selected' : ''}>Dark</option>
              <option value="light"${user?.preferences?.theme === 'light' ? ' selected' : ''}>Light</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" data-action="save-profile">Save Changes</button>
      </div>
    </div>

    <div class="tab-content" id="tab-notifications" style="display:none;margin-top:var(--space-lg)">
      <div class="card" style="max-width:600px">
        <div class="card-header"><div class="card-title">Notification Preferences</div></div>
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          <label class="toggle">
            <input type="checkbox" ${user?.preferences?.notificationSettings?.email !== false ? 'checked' : ''} />
            <span style="font-size:var(--font-size-sm)">Email notifications</span>
          </label>
          <label class="toggle">
            <input type="checkbox" ${user?.preferences?.notificationSettings?.inApp !== false ? 'checked' : ''} />
            <span style="font-size:var(--font-size-sm)">In-app notifications</span>
          </label>
          <div class="form-group">
            <label for="digest">Digest frequency</label>
            <select class="form-select" id="digest">
              <option value="daily"${user?.preferences?.notificationSettings?.digest === 'daily' ? ' selected' : ''}>Daily</option>
              <option value="weekly"${user?.preferences?.notificationSettings?.digest === 'weekly' ? ' selected' : ''}>Weekly</option>
              <option value="never"${user?.preferences?.notificationSettings?.digest === 'never' ? ' selected' : ''}>Never</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="tab-content" id="tab-sessions" style="display:none;margin-top:var(--space-lg)">
      <div class="card" style="max-width:600px">
        <div class="card-header">
          <div class="card-title">Active Sessions (${sessions.length})</div>
          ${sessions.length ? '<button class="btn btn-ghost btn-sm" data-action="revoke-all">Revoke All</button>' : ''}
        </div>
        ${sessions.length ? `
          <div class="session-list">
            ${sessions.map(s => `
              <div class="session-row">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted)"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <div class="device">
                  ${s.device || 'Unknown device'}
                  <div class="meta">${s.ip || 'Unknown IP'} · Last active ${s.lastActivity ? new Date(s.lastActivity).toLocaleString() : '—'}</div>
                </div>
                <span style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Expires ${s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}</span>
                <button class="btn btn-ghost btn-sm" data-action="revoke-session" data-id="${s.id}">Revoke</button>
              </div>
            `).join('')}
          </div>
        ` : '<div style="padding:var(--space-lg);text-align:center;color:var(--color-text-muted)">No active sessions</div>'}
      </div>
    </div>
  `;

  return DashboardLayout({
    activePage: 'profile',
    breadcrumbs: [{ label: 'Profile' }],
    children: content,
  });
}

module.exports = { renderProfile };
