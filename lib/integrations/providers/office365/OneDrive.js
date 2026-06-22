class OneDrive {
  constructor(provider) {
    this.provider = provider;
  }

  async listFiles(folderId = 'root') {
    return {
      success: true,
      data: {
        value: [
          { id: 'file-1', name: 'Report.pdf', size: 102400, mimeType: 'application/pdf', createdDateTime: '2024-01-01T00:00:00.000Z', lastModifiedDateTime: '2024-06-01T00:00:00.000Z', parentReference: { id: folderId }, webUrl: 'https://onedrive.com/view/file-1', file: { mimeType: 'application/pdf' } },
          { id: 'file-2', name: 'Data.xlsx', size: 20480, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', createdDateTime: '2024-02-01T00:00:00.000Z', lastModifiedDateTime: '2024-06-01T00:00:00.000Z', parentReference: { id: folderId }, webUrl: 'https://onedrive.com/view/file-2', file: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } },
          { id: 'folder-1', name: 'Documents', size: null, mimeType: null, createdDateTime: '2024-01-01T00:00:00.000Z', lastModifiedDateTime: '2024-06-01T00:00:00.000Z', parentReference: { id: folderId }, webUrl: 'https://onedrive.com/folder/folder-1', folder: { childCount: 3 } },
        ],
      },
    };
  }

  async upload(path, content) {
    return {
      success: true,
      data: {
        id: `file-${Date.now().toString(36)}`,
        name: path.split('/').pop(),
        size: Buffer.byteLength(content || '', 'utf8'),
        createdDateTime: new Date().toISOString(),
        lastModifiedDateTime: new Date().toISOString(),
        webUrl: `https://onedrive.com/view/file-${Date.now().toString(36)}`,
        parentReference: { path: path.substring(0, path.lastIndexOf('/')) || '/' },
      },
    };
  }

  async download(fileId) {
    return {
      success: true,
      data: {
        id: fileId,
        name: 'downloaded-file',
        content: Buffer.from('Mock OneDrive file content').toString('base64'),
        size: 25,
        mimeType: 'application/octet-stream',
      },
    };
  }

  async delete(fileId) {
    return { success: true, message: `File ${fileId} moved to recycle bin` };
  }

  async createFolder(name, parentId = 'root') {
    return {
      success: true,
      data: {
        id: `folder-${Date.now().toString(36)}`,
        name,
        createdDateTime: new Date().toISOString(),
        lastModifiedDateTime: new Date().toISOString(),
        parentReference: { id: parentId },
        folder: { childCount: 0 },
        webUrl: `https://onedrive.com/folder/folder-${Date.now().toString(36)}`,
      },
    };
  }
}

module.exports = { OneDrive };
