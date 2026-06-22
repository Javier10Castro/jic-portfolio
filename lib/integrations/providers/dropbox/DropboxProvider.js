const { BaseIntegration } = require('../BaseIntegration');

class DropboxProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'dropbox';
    this.version = '1.0.0';
    this.type = 'storage';
    this.authType = 'oauth2';
    this.baseUrl = 'https://api.dropboxapi.com/2';
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
        account_id: 'dbid:AA...',
        name: { given_name: 'John', surname: 'Doe', familiar_name: 'John', display_name: 'John Doe' },
        email: 'john@example.com',
        email_verified: true,
        profile_photo_url: 'https://dl-web.dropbox.com/photo.jpg',
        country: 'US',
        referral_link: 'https://www.dropbox.com/referrals',
        is_paired: false,
        account_type: { '.tag': 'business' },
        root_info: { root_namespace_id: 'ns-1', home_namespace_id: 'ns-1' },
      },
    };
  }

  async listFiles(path = '') {
    return {
      success: true,
      data: {
        entries: [
          { '.tag': 'file', name: 'document.pdf', id: 'file-1', client_modified: '2024-01-01T00:00:00Z', server_modified: '2024-06-01T00:00:00Z', rev: 'a1b2c3d4', size: 102400, path_lower: `${path}/document.pdf` },
          { '.tag': 'file', name: 'image.png', id: 'file-2', client_modified: '2024-02-01T00:00:00Z', server_modified: '2024-06-01T00:00:00Z', rev: 'e5f6g7h8', size: 204800, path_lower: `${path}/image.png` },
          { '.tag': 'folder', name: 'Documents', id: 'folder-1', path_lower: `${path}/documents` },
        ],
        cursor: 'cursor-value',
        has_more: false,
      },
    };
  }

  async upload(path, content) {
    return {
      success: true,
      data: {
        name: path.split('/').pop(),
        id: `file-${Date.now().toString(36)}`,
        client_modified: new Date().toISOString(),
        server_modified: new Date().toISOString(),
        rev: `rev-${Date.now().toString(36)}`,
        size: Buffer.byteLength(content || '', 'utf8'),
        path_lower: path,
      },
    };
  }

  async download(fileId) {
    return {
      success: true,
      data: {
        id: fileId,
        name: 'downloaded-file',
        content: Buffer.from('Mock Dropbox file content').toString('base64'),
        size: 27,
      },
    };
  }

  async createFolder(path) {
    return {
      success: true,
      data: {
        name: path.split('/').pop(),
        id: `folder-${Date.now().toString(36)}`,
        path_lower: path,
      },
    };
  }

  async delete(path) {
    return { success: true, message: `Deleted ${path}` };
  }
}

module.exports = { DropboxProvider };
