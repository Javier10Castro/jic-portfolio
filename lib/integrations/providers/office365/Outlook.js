class Outlook {
  constructor(provider) {
    this.provider = provider;
  }

  async sendEmail(to, subject, body) {
    return {
      success: true,
      data: {
        id: `msg-${Date.now()}`,
        subject,
        bodyPreview: body.substring(0, 255),
        from: { emailAddress: { name: 'John Doe', address: 'john@contoso.com' } },
        toRecipients: [{ emailAddress: { name: to, address: to } }],
        sentDateTime: new Date().toISOString(),
        webLink: `https://outlook.office.com/mail/inbox/id/msg-${Date.now()}`,
      },
    };
  }

  async listEmails(folderId = 'inbox', top = 10) {
    return {
      success: true,
      data: {
        value: [
          { id: 'msg-1', subject: 'Welcome!', bodyPreview: 'Hello and welcome...', from: { emailAddress: { name: 'System', address: 'system@contoso.com' } }, receivedDateTime: '2024-01-01T00:00:00.000Z', isRead: true, importance: 'normal', webLink: 'https://outlook.office.com/mail/inbox/id/msg-1' },
          { id: 'msg-2', subject: 'Meeting tomorrow', bodyPreview: 'Reminder about...', from: { emailAddress: { name: 'Jane Doe', address: 'jane@contoso.com' } }, receivedDateTime: '2024-06-01T00:00:00.000Z', isRead: false, importance: 'high', webLink: 'https://outlook.office.com/mail/inbox/id/msg-2' },
        ],
        '@odata.count': 2,
      },
    };
  }

  async getEmail(messageId) {
    return {
      success: true,
      data: {
        id: messageId,
        subject: 'Email Subject',
        body: { contentType: 'text', content: 'Full email body content here...' },
        bodyPreview: 'Full email body content here...',
        from: { emailAddress: { name: 'Sender Name', address: 'sender@contoso.com' } },
        toRecipients: [{ emailAddress: { name: 'John Doe', address: 'john@contoso.com' } }],
        ccRecipients: [],
        bccRecipients: [],
        receivedDateTime: '2024-01-01T00:00:00.000Z',
        sentDateTime: '2024-01-01T00:00:00.000Z',
        isRead: true,
        importance: 'normal',
        webLink: `https://outlook.office.com/mail/inbox/id/${messageId}`,
        attachments: [{ id: 'att-1', name: 'file.pdf', size: 102400, contentType: 'application/pdf' }],
      },
    };
  }

  async createDraft(to, subject, body) {
    return {
      success: true,
      data: {
        id: `draft-${Date.now()}`,
        subject,
        bodyPreview: body.substring(0, 255),
        from: { emailAddress: { name: 'John Doe', address: 'john@contoso.com' } },
        toRecipients: [{ emailAddress: { name: to, address: to } }],
        createdDateTime: new Date().toISOString(),
        isDraft: true,
        webLink: `https://outlook.office.com/mail/drafts/id/draft-${Date.now()}`,
      },
    };
  }
}

module.exports = { Outlook };
