class GoogleDocs {
  constructor(provider) {
    this.provider = provider;
  }

  async create(title, content = '') {
    return {
      success: true,
      data: {
        documentId: `doc-${Date.now().toString(36)}`,
        title,
        revisionId: '1',
        documentUrl: `https://docs.google.com/document/d/doc-${Date.now().toString(36)}/edit`,
        body: { content: [{ paragraph: { elements: [{ textRun: { content } }] } }] },
      },
    };
  }

  async get(documentId) {
    return {
      success: true,
      data: {
        documentId,
        title: 'My Document',
        revisionId: '5',
        documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
        body: { content: [{ paragraph: { elements: [{ textRun: { content: 'Document content here' } }] } }] },
        headers: {},
        footers: {},
        inlineObjects: {},
        lists: {},
        namedStyles: { styles: [{ namedStyleType: 'NORMAL_TEXT', paragraphStyle: { lineSpacing: 1.15 } }] },
      },
    };
  }

  async update(documentId, content) {
    return {
      success: true,
      data: {
        documentId,
        revisionId: '6',
        replies: [{ replaceAllText: { occurrencesChanged: 1 } }],
      },
    };
  }

  async export(documentId, format = 'pdf') {
    const mimeTypes = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', txt: 'text/plain', html: 'text/html' };
    return {
      success: true,
      data: {
        documentId,
        format,
        mimeType: mimeTypes[format] || 'application/octet-stream',
        content: Buffer.from(`Mock ${format} export content`).toString('base64'),
      },
    };
  }
}

module.exports = { GoogleDocs };
