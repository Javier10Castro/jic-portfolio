const { BaseIntegration } = require('../BaseIntegration');

class TeamsProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'microsoft-teams';
    this.version = '1.0.0';
    this.type = 'messaging';
    this.authType = 'oauth2';
    this.baseUrl = 'https://graph.microsoft.com/v1.0';
    this.token = config.token || null;
  }

  async _request(method, path, data) {
    const url = `${this.baseUrl}${path}`;
    const headers = { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' };
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
        id: 'user-uuid-123',
        displayName: 'John Doe',
        givenName: 'John',
        surname: 'Doe',
        mail: 'john@contoso.com',
        userPrincipalName: 'john@contoso.com',
        jobTitle: 'Software Engineer',
        mobilePhone: null,
        officeLocation: 'San Francisco',
      },
    };
  }

  async sendMessage(channelId, message) {
    return {
      success: true,
      data: {
        id: `msg-${Date.now()}`,
        channelIdentity: { channelId },
        body: { content: message, contentType: 'text' },
        createdDateTime: new Date().toISOString(),
        lastModifiedDateTime: new Date().toISOString(),
        from: { user: { id: 'user-uuid-123', displayName: 'John Doe' } },
      },
    };
  }

  async listChannels(teamId) {
    return {
      success: true,
      data: [
        { id: 'ch-001', displayName: 'General', description: 'General channel', createdDateTime: '2024-01-01T00:00:00Z', membershipType: 'standard' },
        { id: 'ch-002', displayName: 'Random', description: 'Random discussions', createdDateTime: '2024-01-01T00:00:00Z', membershipType: 'standard' },
        { id: 'ch-003', displayName: 'Engineering', description: 'Engineering team channel', createdDateTime: '2024-02-01T00:00:00Z', membershipType: 'private' },
      ],
    };
  }
}

module.exports = { TeamsProvider };
