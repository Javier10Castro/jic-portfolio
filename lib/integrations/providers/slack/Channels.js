class SlackChannels {
  constructor(provider) {
    this.provider = provider;
  }

  async list() {
    return {
      success: true,
      data: {
        ok: true,
        channels: [
          { id: 'C001', name: 'general', topic: { value: 'Company-wide announcements' }, purpose: { value: 'General channel' }, num_members: 50, created: 1704067200, is_archived: false, is_member: true },
          { id: 'C002', name: 'random', topic: { value: 'Random stuff' }, purpose: { value: 'Random channel' }, num_members: 45, created: 1704067200, is_archived: false, is_member: true },
          { id: 'C003', name: 'engineering', topic: { value: 'Engineering team' }, purpose: { value: 'Engineering discussions' }, num_members: 12, created: 1704153600, is_archived: false, is_member: false },
          { id: 'C004', name: 'design', topic: { value: '' }, purpose: { value: 'Design team' }, num_members: 8, created: 1704153600, is_archived: false, is_member: false },
          { id: 'C005', name: 'archived-project', topic: { value: '' }, purpose: { value: 'Old project' }, num_members: 0, created: 1704067200, is_archived: true, is_member: false },
        ],
      },
    };
  }

  async create(name) {
    return {
      success: true,
      data: {
        ok: true,
        channel: {
          id: `C${Date.now().toString(36).toUpperCase()}`,
          name,
          topic: { value: '' },
          purpose: { value: '' },
          num_members: 1,
          created: Math.floor(Date.now() / 1000),
          is_archived: false,
          is_member: true,
          creator: 'U12345',
        },
      },
    };
  }

  async join(channelId) {
    return {
      success: true,
      data: {
        ok: true,
        channel: { id: channelId, is_member: true },
      },
    };
  }

  async leave(channelId) {
    return {
      success: true,
      data: {
        ok: true,
        channel: { id: channelId, is_member: false },
      },
    };
  }

  async getHistory(channelId) {
    return {
      success: true,
      data: {
        ok: true,
        messages: [
          { type: 'message', user: 'U001', text: 'Hello everyone!', ts: '1704067200.000100', channel: channelId },
          { type: 'message', user: 'U002', text: 'Hi there!', ts: '1704067201.000200', channel: channelId },
          { type: 'message', user: 'U001', text: 'How is the project going?', ts: '1704067300.000300', channel: channelId },
        ],
        has_more: false,
      },
    };
  }
}

module.exports = { SlackChannels };
