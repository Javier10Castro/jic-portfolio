class GithubRepositories {
  constructor(provider) {
    this.provider = provider;
  }

  async list(org) {
    return {
      success: true,
      data: [
        { id: 1, name: 'repo-1', full_name: `${org}/repo-1`, private: false, html_url: `https://github.com/${org}/repo-1`, description: 'First repo', fork: false, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', pushed_at: '2024-01-01T00:00:00Z', language: 'JavaScript', stargazers_count: 10, forks_count: 5, open_issues_count: 2 },
        { id: 2, name: 'repo-2', full_name: `${org}/repo-2`, private: true, html_url: `https://github.com/${org}/repo-2`, description: 'Second repo', fork: false, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z', pushed_at: '2024-01-02T00:00:00Z', language: 'TypeScript', stargazers_count: 25, forks_count: 8, open_issues_count: 1 },
        { id: 3, name: 'repo-3', full_name: `${org}/repo-3`, private: false, html_url: `https://github.com/${org}/repo-3`, description: 'Third repo', fork: true, created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-03T00:00:00Z', pushed_at: '2024-01-03T00:00:00Z', language: 'Python', stargazers_count: 50, forks_count: 15, open_issues_count: 0 },
      ],
    };
  }

  async get(owner, repo) {
    return {
      success: true,
      data: {
        id: 1,
        name: repo,
        full_name: `${owner}/${repo}`,
        private: false,
        html_url: `https://github.com/${owner}/${repo}`,
        description: `The ${repo} repository`,
        fork: false,
        url: `https://api.github.com/repos/${owner}/${repo}`,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        pushed_at: '2024-01-01T00:00:00Z',
        language: 'JavaScript',
        stargazers_count: 42,
        forks_count: 12,
        open_issues_count: 3,
        default_branch: 'main',
        owner: { login: owner, id: 1, avatar_url: `https://avatars.githubusercontent.com/u/1?v=4` },
      },
    };
  }

  async create(name, options = {}) {
    return {
      success: true,
      data: {
        id: Date.now(),
        name,
        full_name: `${options.owner || 'user'}/${name}`,
        private: options.private || false,
        html_url: `https://github.com/${options.owner || 'user'}/${name}`,
        description: options.description || '',
        fork: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pushed_at: new Date().toISOString(),
        language: options.language || null,
        default_branch: 'main',
      },
    };
  }

  async delete(owner, repo) {
    return { success: true, message: `Repository ${owner}/${repo} deleted` };
  }
}

module.exports = { GithubRepositories };
