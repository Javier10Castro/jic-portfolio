class SlackNotifications {
  constructor(provider) {
    this.provider = provider;
  }

  async sendNotification(channelId, title, message, severity = 'info') {
    const colors = { info: '#3498db', warning: '#f39c12', error: '#e74c3c', success: '#2ecc71' };
    const color = colors[severity] || colors.info;
    return {
      success: true,
      data: {
        ok: true,
        channel: channelId,
        ts: `${Date.now()}.${Math.random().toString(36).substring(2, 8)}`,
        message: {
          type: 'message',
          channel: channelId,
          attachments: [
            {
              color,
              title,
              text: message,
              fields: [
                { title: 'Severity', value: severity, short: true },
                { title: 'Timestamp', value: new Date().toISOString(), short: true },
              ],
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        },
      },
    };
  }
}

module.exports = { SlackNotifications };
