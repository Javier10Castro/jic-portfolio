function ProjectTable({ projects, showActions }) {
  if (!projects || !projects.length) {
    return '<div class="empty-state"><h3>No projects found</h3><p>Create your first project to get started.</p></div>';
  }
  const rows = projects.map(p => {
    const status = (p.status || 'draft').toLowerCase();
    const updated = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—';
    const created = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—';
    return `
      <tr data-project-id="${p.id}">
        <td><a href="#projectDetails?id=${p.id}" style="color:var(--color-text);text-decoration:none;font-weight:500">${p.name}</a></td>
        <td><span class="status-badge ${status}">${status}</span></td>
        <td>${p.type || 'website'}</td>
        <td>${p.owner || '—'}</td>
        <td>${updated}</td>
        <td>${created}</td>
        ${showActions ? `<td>
          <button class="btn btn-ghost btn-sm" data-action="duplicate" data-id="${p.id}">Duplicate</button>
          <button class="btn btn-ghost btn-sm" data-action="archive" data-id="${p.id}">Archive</button>
          <button class="btn btn-ghost btn-sm btn-danger" data-action="delete" data-id="${p.id}">Delete</button>
        </td>` : ''}
      </tr>
    `;
  }).join('');

  return `
    <div class="table-container">
      <table role="table" aria-label="Projects table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Type</th>
            <th>Owner</th>
            <th>Updated</th>
            <th>Created</th>
            ${showActions ? '<th>Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

module.exports = { ProjectTable };
