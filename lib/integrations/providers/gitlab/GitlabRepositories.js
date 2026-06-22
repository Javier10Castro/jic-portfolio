class GitlabRepositories {
  constructor(provider) {
    this.provider = provider;
  }

  async list() {
    return {
      success: true,
      data: [
        { id: 1, name: 'Project Alpha', path_with_namespace: 'root/project-alpha', visibility: 'public', created_at: '2024-01-01T00:00:00Z', last_activity_at: '2024-06-01T00:00:00Z', web_url: 'https://gitlab.com/root/project-alpha', star_count: 5, forks_count: 2, open_issues_count: 3, default_branch: 'main' },
        { id: 2, name: 'Project Beta', path_with_namespace: 'root/project-beta', visibility: 'private', created_at: '2024-02-01T00:00:00Z', last_activity_at: '2024-06-01T00:00:00Z', web_url: 'https://gitlab.com/root/project-beta', star_count: 10, forks_count: 0, open_issues_count: 1, default_branch: 'main' },
      ],
    };
  }

  async get(projectId) {
    return {
      success: true,
      data: {
        id: projectId,
        name: `Project ${projectId}`,
        path_with_namespace: `root/project-${projectId}`,
        visibility: 'public',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-06-01T00:00:00Z',
        web_url: `https://gitlab.com/root/project-${projectId}`,
        star_count: 5,
        forks_count: 2,
        open_issues_count: 3,
        default_branch: 'main',
        description: 'Project description',
        avatar_url: null,
        owner: { id: 1, name: 'Admin', username: 'root' },
        permissions: { project_access: { access_level: 50 }, group_access: null },
      },
    };
  }

  async create(name, options = {}) {
    return {
      success: true,
      data: {
        id: Date.now(),
        name,
        path_with_namespace: `${options.namespace || 'root'}/${name}`,
        visibility: options.visibility || 'private',
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        web_url: `https://gitlab.com/${options.namespace || 'root'}/${name}`,
        default_branch: 'main',
        description: options.description || '',
        star_count: 0,
        forks_count: 0,
        open_issues_count: 0,
      },
    };
  }

  async fork(projectId, namespace = 'root') {
    return {
      success: true,
      data: {
        id: Date.now(),
        name: `fork-of-project-${projectId}`,
        path_with_namespace: `${namespace}/fork-of-project-${projectId}`,
        forked_from_project: { id: projectId, path_with_namespace: `original/project-${projectId}` },
        visibility: 'public',
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        web_url: `https://gitlab.com/${namespace}/fork-of-project-${projectId}`,
      },
    };
  }
}

module.exports = { GitlabRepositories };
