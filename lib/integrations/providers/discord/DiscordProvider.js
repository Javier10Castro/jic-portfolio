const { BaseIntegration } = require('../BaseIntegration');

class DiscordProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'discord';
    this.version = '1.0.0';
    this.type = 'messaging';
    this.authType = 'pat';
    this.baseUrl = 'https://discord.com/api/v10';
    this.token = config.token || null;
  }

  async _request(method, path, data) {
    const url = `${this.baseUrl}${path}`;
    const headers = { 'Authorization': `Bot ${this.token}`, 'Content-Type': 'application/json', 'User-Agent': 'DiscordBot (opencode, 1.0.0)' };
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
        id: '123456789',
        username: 'MyBot',
        discriminator: '0000',
        global_name: 'My Bot',
        avatar: 'avatar_hash',
        bot: true,
        system: false,
        mfa_enabled: false,
        locale: 'en-US',
        verified: true,
        email: null,
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      },
    };
  }

  async sendMessage(channelId, content) {
    return {
      success: true,
      data: {
        id: `${Date.now()}`,
        channel_id: channelId,
        author: { id: '123456789', username: 'MyBot', discriminator: '0000', bot: true },
        content,
        timestamp: new Date().toISOString(),
        edited_timestamp: null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        mention_roles: [],
        attachments: [],
        embeds: [],
        pinned: false,
        type: 0,
      },
    };
  }

  async listChannels(guildId) {
    return {
      success: true,
      data: [
        { id: 'ch-001', guild_id: guildId, name: 'general', type: 0, position: 0, topic: 'General discussion', nsfw: false, last_message_id: null, parent_id: null },
        { id: 'ch-002', guild_id: guildId, name: 'random', type: 0, position: 1, topic: 'Random stuff', nsfw: false, last_message_id: null, parent_id: null },
        { id: 'ch-003', guild_id: guildId, name: 'dev-log', type: 0, position: 2, topic: 'Development logs', nsfw: false, last_message_id: null, parent_id: null },
        { id: 'ch-004', guild_id: guildId, name: 'voice-chat', type: 2, position: 3, topic: null, nsfw: false, last_message_id: null, parent_id: null, bitrate: 64000, user_limit: 0 },
      ],
    };
  }
}

module.exports = { DiscordProvider };
