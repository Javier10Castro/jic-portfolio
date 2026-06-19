function WorkspaceSwitcher({ workspaces, activeWorkspaceId }) {
  const active = workspaces ? workspaces.find(w => w.id === activeWorkspaceId) : null;
  return `
    <div class="workspace-switcher">
      <div class="workspace-switcher-trigger" role="button" tabindex="0" aria-haspopup="listbox" aria-label="Select workspace">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>${active ? active.name : 'Select workspace'}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted);margin-left:auto"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
  `;
}

module.exports = { WorkspaceSwitcher };
