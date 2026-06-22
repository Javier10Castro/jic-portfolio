const { BaseIntegration } = require('../BaseIntegration');

class LinearProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'linear';
    this.version = '1.0.0';
    this.type = 'project-management';
    this.authType = 'api-key';
    this.baseUrl = 'https://api.linear.app/graphql';
    this.apiKey = config.apiKey || null;
  }

  async _request(method, path, data) {
    return { success: true, url: this.baseUrl, method: 'POST', headers: { 'Authorization': this.apiKey, 'Content-Type': 'application/json' }, data, status: 200 };
  }

  connect() {
    if (!this.apiKey) {
      return { success: false, error: 'No API key provided' };
    }
    this.connected = true;
    this.connectedAt = new Date().toISOString();
    return { success: true, connectedAt: this.connectedAt };
  }

  async getProfile() {
    return {
      success: true,
      data: {
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        displayName: 'John Doe',
        avatarUrl: 'https://avatars.linear.app/user-uuid',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
        admin: true,
      },
    };
  }

  async listTeams() {
    return {
      success: true,
      data: [
        { id: 'team-uuid-1', name: 'Engineering', key: 'ENG', description: 'Engineering team', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z', memberCount: 10 },
        { id: 'team-uuid-2', name: 'Design', key: 'DSG', description: 'Design team', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z', memberCount: 5 },
      ],
    };
  }

  async listIssues(teamId) {
    return {
      success: true,
      data: [
        { id: 'issue-uuid-1', identifier: 'ENG-1', title: 'Fix login bug', description: 'Users cannot login', priority: 2, state: { name: 'In Progress', type: 'started' }, assignee: { name: 'John Doe' }, team: { id: teamId }, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z' },
        { id: 'issue-uuid-2', identifier: 'ENG-2', title: 'Add dark mode', description: 'Implement dark theme', priority: 1, state: { name: 'Todo', type: 'unstarted' }, assignee: null, team: { id: teamId }, createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z' },
        { id: 'issue-uuid-3', identifier: 'ENG-3', title: 'Update docs', description: 'Write documentation', priority: 0, state: { name: 'Done', type: 'completed' }, assignee: { name: 'Jane Doe' }, team: { id: teamId }, createdAt: '2024-01-03T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z' },
      ],
    };
  }

  async createIssue(teamId, title, description = '') {
    return {
      success: true,
      data: {
        id: `issue-${Date.now().toString(36)}`,
        identifier: `ENG-${Math.floor(Math.random() * 1000) + 100}`,
        title,
        description,
        priority: 1,
        state: { name: 'Todo', type: 'unstarted' },
        assignee: null,
        team: { id: teamId },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }
}

module.exports = { LinearProvider };
