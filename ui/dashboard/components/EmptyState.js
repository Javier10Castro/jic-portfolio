function EmptyState({ title, description, action, actionLabel }) {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
      <h3>${title || 'Nothing here yet'}</h3>
      <p>${description || ''}</p>
      ${action ? `<button class="btn btn-primary" data-action="${action}">${actionLabel || action}</button>` : ''}
    </div>
  `;
}

module.exports = { EmptyState };
