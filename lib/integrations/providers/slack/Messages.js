class SlackMessages {
  constructor(provider) {
    this.provider = provider;
  }

  async send(channelId, text, options = {}) {
    return {
      success: true,
      data: {
        ok: true,
        channel: channelId,
        ts: `${Date.now()}.${Math.random().toString(36).substring(2, 8)}`,
        message: {
          type: 'message',
          text,
          user: 'U12345',
          channel: channelId,
          ts: `${Date.now()}.${Math.random().toString(36).substring(2, 8)}`,
          ...(options.attachments ? { attachments: options.attachments } : {}),
          ...(options.blocks ? { blocks: options.blocks } : {}),
        },
      },
    };
  }

  async update(channelId, ts, text) {
    return {
      success: true,
      data: {
        ok: true,
        channel: channelId,
        ts,
        message: {
          type: 'message',
          text,
          user: 'U12345',
          channel: channelId,
          ts,
          edited: { user: 'U12345', ts: `${Date.now()}.${Math.random().toString(36).substring(2, 8)}` },
        },
      },
    };
  }

  async delete(channelId, ts) {
    return {
      success: true,
      data: {
        ok: true,
        channel: channelId,
        ts,
      },
    };
  }

  async search(query) {
    return {
      success: true,
      data: {
        ok: true,
        messages: {
          matches: [
            { type: 'message', channel: { id: 'C001', name: 'general' }, user: 'U001', text: `Found: ${query}`, ts: '1704067200.000100', score: 1.0 },
            { type: 'message', channel: { id: 'C002', name: 'random' }, user: 'U002', text: `Also found: ${query}`, ts: '1704067300.000200', score: 0.8 },
          ],
          total: 2,
        },
      },
    };
  }
}

module.exports = { SlackMessages };
