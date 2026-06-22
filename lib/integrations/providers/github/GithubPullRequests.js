class GithubPullRequests {
  constructor(provider) {
    this.provider = provider;
  }

  async list(owner, repo, state = 'open') {
    return {
      success: true,
      data: [
        { id: 1, number: 1, state: 'open', title: 'Fix login bug', body: 'Fixes the login authentication issue', user: { login: 'dev1', id: 10 }, head: { ref: 'fix-login', sha: 'abc123' }, base: { ref: 'main', sha: 'def456' }, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z', html_url: `https://github.com/${owner}/${repo}/pull/1`, mergeable: true },
        { id: 2, number: 2, state: 'open', title: 'Add new feature', body: 'Implements the requested feature', user: { login: 'dev2', id: 11 }, head: { ref: 'feat-new', sha: 'ghi789' }, base: { ref: 'main', sha: 'def456' }, created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-04T00:00:00Z', html_url: `https://github.com/${owner}/${repo}/pull/2`, mergeable: null },
        { id: 3, number: 3, state: 'closed', title: 'Old PR', body: 'This was merged', user: { login: 'dev3', id: 12 }, head: { ref: 'old-branch', sha: 'jkl012' }, base: { ref: 'main', sha: 'def456' }, created_at: '2023-12-01T00:00:00Z', updated_at: '2023-12-05T00:00:00Z', html_url: `https://github.com/${owner}/${repo}/pull/3`, mergeable: true, merged_at: '2023-12-05T00:00:00Z' },
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
        title: `Pull Request #${number}`,
        body: `Description for PR #${number}`,
        user: { login: 'author', id: 1, avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4' },
        head: { ref: 'feature-branch', sha: 'abc123', repo: { full_name: `${owner}/${repo}` } },
        base: { ref: 'main', sha: 'def456', repo: { full_name: `${owner}/${repo}` } },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        html_url: `https://github.com/${owner}/${repo}/pull/${number}`,
        mergeable: true,
        mergeable_state: 'clean',
        merged: false,
        comments: 3,
        review_comments: 1,
        commits: 5,
        additions: 100,
        deletions: 50,
        changed_files: 10,
      },
    };
  }

  async create(owner, repo, title, head, base, body = '') {
    return {
      success: true,
      data: {
        id: Date.now(),
        number: Math.floor(Math.random() * 1000) + 10,
        state: 'open',
        title,
        body,
        user: { login: 'current-user', id: 1 },
        head: { ref: head, sha: 'newsha001' },
        base: { ref: base, sha: 'basesha001' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        html_url: `https://github.com/${owner}/${repo}/pull/${Math.floor(Math.random() * 1000) + 10}`,
        mergeable: true,
        merged: false,
      },
    };
  }

  async merge(owner, repo, number) {
    return {
      success: true,
      data: {
        sha: 'mergedsha001',
        merged: true,
        message: 'Pull Request successfully merged',
        html_url: `https://github.com/${owner}/${repo}/pull/${number}`,
      },
    };
  }
}

module.exports = { GithubPullRequests };
