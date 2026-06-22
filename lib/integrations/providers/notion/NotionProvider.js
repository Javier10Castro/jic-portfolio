const { BaseIntegration } = require('../BaseIntegration');

class NotionProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'notion';
    this.version = '1.0.0';
    this.type = 'documentation';
    this.authType = 'oauth2';
    this.baseUrl = 'https://api.notion.com/v1';
    this.token = config.token || null;
  }

  async _request(method, path, data) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
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
        object: 'user',
        id: 'user-uuid-123',
        type: 'person',
        person: { email: 'john@example.com' },
        name: 'John Doe',
        avatar_url: 'https://secure.notion-static.com/avatar.png',
      },
    };
  }

  async search(query) {
    return {
      success: true,
      data: {
        object: 'list',
        results: [
          { object: 'page', id: 'page-uuid-1', created_time: '2024-01-01T00:00:00.000Z', last_edited_time: '2024-06-01T00:00:00.000Z', archived: false, url: 'https://www.notion.so/page-1', properties: { title: { title: [{ plain_text: 'Getting Started Guide' }] } } },
          { object: 'database', id: 'db-uuid-1', created_time: '2024-01-01T00:00:00.000Z', last_edited_time: '2024-06-01T00:00:00.000Z', archived: false, url: 'https://www.notion.so/db-1', title: [{ plain_text: 'Project Tracker' }] },
        ],
      },
    };
  }
}

module.exports = { NotionProvider };
