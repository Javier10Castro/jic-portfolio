class GoogleDrive {
  constructor(provider) {
    this.provider = provider;
  }

  async listFiles(query = '') {
    return {
      success: true,
      data: {
        files: [
          { id: 'file-1', name: 'Report.pdf', mimeType: 'application/pdf', size: '102400', createdTime: '2024-01-01T00:00:00.000Z', modifiedTime: '2024-06-01T00:00:00.000Z', parents: ['folder-1'], webViewLink: 'https://drive.google.com/file/d/file-1/view', owners: [{ displayName: 'John Doe' }] },
          { id: 'file-2', name: 'Data.csv', mimeType: 'text/csv', size: '20480', createdTime: '2024-02-01T00:00:00.000Z', modifiedTime: '2024-06-01T00:00:00.000Z', parents: ['folder-1'], webViewLink: 'https://drive.google.com/file/d/file-2/view', owners: [{ displayName: 'John Doe' }] },
          { id: 'folder-1', name: 'Documents', mimeType: 'application/vnd.google-apps.folder', size: null, createdTime: '2024-01-01T00:00:00.000Z', modifiedTime: '2024-06-01T00:00:00.000Z', webViewLink: 'https://drive.google.com/drive/folders/folder-1', owners: [{ displayName: 'John Doe' }] },
        ],
        nextPageToken: null,
      },
    };
  }

  async upload(name, content) {
    return {
      success: true,
      data: {
        id: `file-${Date.now().toString(36)}`,
        name,
        mimeType: 'application/octet-stream',
        size: Buffer.byteLength(content || '', 'utf8').toString(),
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        webViewLink: `https://drive.google.com/file/d/file-${Date.now().toString(36)}/view`,
      },
    };
  }

  async download(fileId) {
    return {
      success: true,
      data: {
        id: fileId,
        name: 'downloaded-file',
        mimeType: 'application/octet-stream',
        content: Buffer.from('Mock file content').toString('base64'),
        size: '17',
      },
    };
  }

  async delete(fileId) {
    return { success: true, message: `File ${fileId} moved to trash` };
  }

  async createFolder(name, parentId = 'root') {
    return {
      success: true,
      data: {
        id: `folder-${Date.now().toString(36)}`,
        name,
        mimeType: 'application/vnd.google-apps.folder',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        parents: [parentId],
        webViewLink: `https://drive.google.com/drive/folders/folder-${Date.now().toString(36)}`,
      },
    };
  }
}

module.exports = { GoogleDrive };
