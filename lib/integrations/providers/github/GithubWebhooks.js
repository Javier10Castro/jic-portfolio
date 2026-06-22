const crypto = require('crypto');

class GithubWebhooks {
  constructor(provider) {
    this.provider = provider;
  }

  async list(owner, repo) {
    return {
      success: true,
      data: [
        { id: 1, url: `https://api.github.com/repos/${owner}/${repo}/hooks/1`, active: true, events: ['push', 'pull_request'], config: { url: 'https://example.com/webhook', content_type: 'json', insecure_ssl: '0' }, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { id: 2, url: `https://api.github.com/repos/${owner}/${repo}/hooks/2`, active: true, events: ['issues', 'label'], config: { url: 'https://example.com/issues-webhook', content_type: 'json', insecure_ssl: '0' }, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
      ],
    };
  }

  async create(owner, repo, config, events = ['push']) {
    return {
      success: true,
      data: {
        id: Date.now(),
        url: `https://api.github.com/repos/${owner}/${repo}/hooks/${Date.now()}`,
        test_url: `https://api.github.com/repos/${owner}/${repo}/hooks/${Date.now()}/test`,
        ping_url: `https://api.github.com/repos/${owner}/${repo}/hooks/${Date.now()}/pings`,
        active: true,
        events,
        config,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  async delete(owner, repo, hookId) {
    return { success: true, message: `Webhook ${hookId} deleted from ${owner}/${repo}` };
  }

  verifySignature(payload, signature, secret) {
    const computed = 'sha256=' + crypto.createHmac('sha256', secret).update(typeof payload === 'string' ? payload : JSON.stringify(payload)).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  }
}

module.exports = { GithubWebhooks };
