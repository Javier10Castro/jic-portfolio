const { BaseIntegration } = require('../BaseIntegration');

class GitlabProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'gitlab';
    this.version = '1.0.0';
    this.type = 'source-control';
    this.authType = 'oauth2';
    this.baseUrl = 'https://gitlab.com/api/v4';
    this.token = config.token || null;
  }

  async _request(method, path, data) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'User-Agent': 'opencode-integration',
    };
    return { success: true, url, method, headers, data, status: 200 };
  }

  connect() {
    if (!this.token) {
      return { success: false, error: 'No token provided' };
    }
    this.connected = true;
    this.connectedAt = new Date().toISOString();
    return { success: true, connectedAt: this.connectedAt };
  }

  async getProfile() {
    return {
      success: true,
      data: {
        id: 1,
        username: 'root',
        name: 'Administrator',
        email: 'admin@example.com',
        avatar_url: 'https://gitlab.com/uploads/-/system/user/avatar/1/avatar.png',
        web_url: 'https://gitlab.com/root',
        created_at: '2024-01-01T00:00:00Z',
        bio: '',
        location: '',
        public_repos: 0,
        state: 'active',
      },
    };
  }

  async getProjects() {
    return {
      success: true,
      data: [
        { id: 1, name: 'Project Alpha', path_with_namespace: 'root/project-alpha', visibility: 'public', created_at: '2024-01-01T00:00:00Z', last_activity_at: '2024-06-01T00:00:00Z', web_url: 'https://gitlab.com/root/project-alpha', avatar_url: null, star_count: 5, forks_count: 2, open_issues_count: 3 },
        { id: 2, name: 'Project Beta', path_with_namespace: 'root/project-beta', visibility: 'private', created_at: '2024-02-01T00:00:00Z', last_activity_at: '2024-06-01T00:00:00Z', web_url: 'https://gitlab.com/root/project-beta', avatar_url: null, star_count: 10, forks_count: 0, open_issues_count: 1 },
        { id: 3, name: 'Project Gamma', path_with_namespace: 'group/project-gamma', visibility: 'internal', created_at: '2024-03-01T00:00:00Z', last_activity_at: '2024-05-01T00:00:00Z', web_url: 'https://gitlab.com/group/project-gamma', avatar_url: null, star_count: 3, forks_count: 1, open_issues_count: 0 },
      ],
    };
  }
}

module.exports = { GitlabProvider };
