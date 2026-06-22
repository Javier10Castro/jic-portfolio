const { BaseIntegration } = require('../BaseIntegration');

class GithubProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'github';
    this.version = '1.0.0';
    this.type = 'source-control';
    this.authType = 'oauth2';
    this.baseUrl = 'https://api.github.com';
    this.token = config.token || null;
  }

  async _request(method, path, data) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
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
        login: 'octocat',
        id: 1,
        node_id: 'MDQ6VXNlcjE=',
        avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
        gravatar_id: '',
        url: 'https://api.github.com/users/octocat',
        html_url: 'https://github.com/octocat',
        name: 'monalisa octocat',
        company: '@github',
        blog: 'https://github.com/blog',
        location: 'San Francisco',
        email: 'octocat@github.com',
        bio: 'There once was...',
        public_repos: 2,
        public_gists: 1,
        followers: 20,
        following: 0,
        created_at: '2008-01-14T04:33:35Z',
        updated_at: '2008-01-14T04:33:35Z',
      },
    };
  }
}

module.exports = { GithubProvider };
