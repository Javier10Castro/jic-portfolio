const { BaseIntegration } = require('../BaseIntegration');

class VercelProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'vercel';
    this.version = '1.0.0';
    this.type = 'deployment';
    this.authType = 'pat';
    this.baseUrl = 'https://api.vercel.com';
    this.token = config.token || null;
  }

  async _request(method, path, data) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
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
}

module.exports = { VercelProvider };
