function ProjectCard({ project }) {
  const status = (project.status || 'draft').toLowerCase();
  const updated = project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '—';
  return `
    <article class="project-card" data-project-id="${project.id}" role="button" tabindex="0" aria-label="Project: ${project.name}">
      <div class="name">${project.name}</div>
      <div class="meta">${project.type || 'website'} · Updated ${updated}</div>
      <div class="footer">
        <span class="status-badge ${status}">${status}</span>
        <span style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${project.deploymentHistory ? project.deploymentHistory.length : 0} deploys</span>
      </div>
    </article>
  `;
}

module.exports = { ProjectCard };
