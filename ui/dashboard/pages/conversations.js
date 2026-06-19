const conv = require('../../../lib/conversation/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { SearchBar } = require('../components/SearchBar');
const { EmptyState } = require('../components/EmptyState');

function renderConversations({ status, search }) {
  let list = conv.conversationManager.listConversations();
  if (status) list = list.filter(c => c.status === status);
  if (search) list = list.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  const content = `
    <div class="page-header">
      <h1>Conversations</h1>
      <div style="display:flex;gap:var(--space-sm);align-items:center">
        ${SearchBar({ placeholder: 'Search conversations...', value: search || '' })}
        <button class="btn btn-primary" data-action="new-conversation">New Conversation</button>
      </div>
    </div>
    <div class="filter-bar" style="margin-bottom:var(--space-lg)">
      <select class="filter-select" data-filter="status">
        <option value="">All Status</option>
        <option value="active"${status === 'active' ? ' selected' : ''}>Active</option>
        <option value="archived"${status === 'archived' ? ' selected' : ''}>Archived</option>
        <option value="completed"${status === 'completed' ? ' selected' : ''}>Completed</option>
      </select>
    </div>
    ${list.length ? `
      <div class="table-container">
        <table role="table" aria-label="Conversations">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Messages</th>
              <th>Project</th>
              <th>Updated</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(c => `
              <tr>
                <td><a href="#conversations?id=${c.id}" style="color:var(--color-text);text-decoration:none;font-weight:500">${c.title || 'Untitled'}</a></td>
                <td><span class="status-badge ${c.status}">${c.status}</span></td>
                <td>${c.messageCount}</td>
                <td style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${c.projectId || '—'}</td>
                <td style="font-size:var(--font-size-xs)">${c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '—'}</td>
                <td style="font-size:var(--font-size-xs)">${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                <td>
                  <div style="display:flex;gap:var(--space-xs)">
                    <button class="btn btn-ghost btn-sm" data-action="open-conversation" data-id="${c.id}">Open</button>
                    ${c.status === 'active' ? `<button class="btn btn-ghost btn-sm" data-action="archive-conversation" data-id="${c.id}">Archive</button>` : ''}
                    <button class="btn btn-ghost btn-sm" data-action="duplicate-conversation" data-id="${c.id}">Duplicate</button>
                    <button class="btn btn-ghost btn-sm btn-danger" data-action="delete-conversation" data-id="${c.id}">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : EmptyState({ title: 'No conversations', description: 'Start a conversation to begin generating websites through AI-powered briefs.', action: 'new-conversation', actionLabel: 'New Conversation' })}
  `;

  return DashboardLayout({
    activePage: 'conversations',
    breadcrumbs: [{ label: 'Conversations' }],
    children: content,
  });
}

module.exports = { renderConversations };
