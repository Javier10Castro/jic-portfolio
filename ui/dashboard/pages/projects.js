const saas = require('../../../lib/saas/index.js');
const { DashboardLayout } = require('../layouts/DashboardLayout');
const { ProjectCard } = require('../components/ProjectCard');
const { ProjectTable } = require('../components/ProjectTable');
const { SearchBar } = require('../components/SearchBar');
const { EmptyState } = require('../components/EmptyState');

function renderProjects({ workspaceId, view, search, status }) {
  let projects = workspaceId ? saas.projectManager.listProjects(workspaceId) : [];
  if (status) projects = projects.filter(p => p.status === status);
  if (search) projects = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const content = `
    <div class="page-header">
      <h1>Projects</h1>
      <div style="display:flex;gap:var(--space-sm);align-items:center">
        ${SearchBar({ placeholder: 'Search projects...', value: search || '' })}
        <button class="btn btn-primary" data-action="create-project">New Project</button>
      </div>
    </div>
    <div class="filter-bar" style="margin-bottom:var(--space-lg)">
      <select class="filter-select" data-filter="status">
        <option value="">All Status</option>
        <option value="draft"${status === 'draft' ? ' selected' : ''}>Draft</option>
        <option value="processing"${status === 'processing' ? ' selected' : ''}>Processing</option>
        <option value="preview"${status === 'preview' ? ' selected' : ''}>Preview</option>
        <option value="approved"${status === 'approved' ? ' selected' : ''}>Approved</option>
        <option value="deployed"${status === 'deployed' ? ' selected' : ''}>Deployed</option>
        <option value="archived"${status === 'archived' ? ' selected' : ''}>Archived</option>
      </select>
      <div class="view-toggle">
        <button class="active" data-view="grid" title="Grid view">⊞</button>
        <button data-view="table" title="Table view">☰</button>
      </div>
    </div>
    ${projects.length
      ? (view === 'table'
          ? ProjectTable({ projects, showActions: true })
          : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-md)">${projects.map(p => ProjectCard({ project: p })).join('')}</div>`)
      : EmptyState({ title: 'No projects found', description: 'Create your first project to start building.', action: 'create-project', actionLabel: 'New Project' })
    }
  `;

  return DashboardLayout({
    activePage: 'projects',
    breadcrumbs: [{ label: 'Projects' }],
    children: content,
  });
}

module.exports = { renderProjects };
