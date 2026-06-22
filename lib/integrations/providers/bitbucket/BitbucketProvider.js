const { BaseIntegration } = require('../BaseIntegration');

class BitbucketProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'bitbucket';
    this.version = '1.0.0';
    this.type = 'source-control';
    this.authType = 'oauth2';
    this.baseUrl = 'https://api.bitbucket.org/2.0';
    this.token = config.token || null;
  }

  async _request(method, path, data) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
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
        uuid: '{user-uuid}',
        display_name: 'John Doe',
        nickname: 'johndoe',
        account_id: '5e8f...',
        email: 'john@example.com',
        created_on: '2020-01-01T00:00:00+00:00',
        links: { html: { href: 'https://bitbucket.org/johndoe' }, avatar: { href: 'https://bitbucket.org/account/johndoe/avatar/32/' } },
      },
    };
  }

  async listRepos() {
    return {
      success: true,
      data: [
        { uuid: '{repo-1-uuid}', name: 'repo-one', full_name: 'johndoe/repo-one', is_private: false, language: 'javascript', created_on: '2024-01-01T00:00:00+00:00', updated_on: '2024-06-01T00:00:00+00:00', links: { html: { href: 'https://bitbucket.org/johndoe/repo-one' } } },
        { uuid: '{repo-2-uuid}', name: 'repo-two', full_name: 'johndoe/repo-two', is_private: true, language: 'python', created_on: '2024-02-01T00:00:00+00:00', updated_on: '2024-06-01T00:00:00+00:00', links: { html: { href: 'https://bitbucket.org/johndoe/repo-two' } } },
      ],
    };
  }
}

module.exports = { BitbucketProvider };
