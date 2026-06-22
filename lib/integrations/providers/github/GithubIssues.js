class GithubIssues {
  constructor(provider) {
    this.provider = provider;
  }

  async list(owner, repo, state = 'open') {
    return {
      success: true,
      data: [
        { id: 1, number: 1, state: 'open', title: 'Bug: Login fails', body: 'Users cannot log in with valid credentials', user: { login: 'reporter', id: 10 }, labels: [{ name: 'bug', color: 'd73a4a' }], assignees: [], comments: 2, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z', html_url: `https://github.com/${owner}/${repo}/issues/1` },
        { id: 2, number: 2, state: 'open', title: 'Feature request: Dark mode', body: 'Add dark mode support', user: { login: 'requester', id: 11 }, labels: [{ name: 'enhancement', color: 'a2eeef' }], assignees: [{ login: 'dev1', id: 20 }], comments: 5, created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-04T00:00:00Z', html_url: `https://github.com/${owner}/${repo}/issues/2` },
        { id: 3, number: 3, state: 'closed', title: 'Typo in README', body: 'Fix spelling mistake', user: { login: 'contributor', id: 12 }, labels: [{ name: 'documentation', color: '0075ca' }], assignees: [], comments: 0, created_at: '2023-12-01T00:00:00Z', updated_at: '2023-12-01T00:00:00Z', html_url: `https://github.com/${owner}/${repo}/issues/3`, closed_at: '2023-12-01T00:00:00Z' },
      ],
    };
  }

  async get(owner, repo, number) {
    return {
      success: true,
      data: {
        id: number,
        number,
        state: 'open',
        title: `Issue #${number}`,
        body: 'Detailed description of the issue goes here.',
        user: { login: 'author', id: 1, avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4' },
        labels: [{ name: 'bug', color: 'd73a4a', description: 'Something is broken' }],
        assignees: [{ login: 'assignee1', id: 2 }],
        comments: 3,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        html_url: `https://github.com/${owner}/${repo}/issues/${number}`,
        locked: false,
        milestone: null,
      },
    };
  }

  async create(owner, repo, title, body = '', labels = []) {
    return {
      success: true,
      data: {
        id: Date.now(),
        number: Math.floor(Math.random() * 1000) + 10,
        state: 'open',
        title,
        body,
        user: { login: 'current-user', id: 1 },
        labels: labels.map((l, i) => ({ id: i + 1, name: l })),
        assignees: [],
        comments: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        html_url: `https://github.com/${owner}/${repo}/issues/${Math.floor(Math.random() * 1000) + 10}`,
      },
    };
  }

  async update(owner, repo, number, data) {
    return {
      success: true,
      data: {
        id: number,
        number,
        state: 'open',
        title: data.title || `Issue #${number}`,
        body: data.body || '',
        labels: data.labels ? data.labels.map((l, i) => ({ id: i + 1, name: l })) : [],
        assignees: data.assignees || [],
        updated_at: new Date().toISOString(),
      },
    };
  }

  async close(owner, repo, number) {
    return {
      success: true,
      data: {
        id: number,
        number,
        state: 'closed',
        title: `Issue #${number}`,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_by: { login: 'current-user', id: 1 },
      },
    };
  }
}

module.exports = { GithubIssues };
