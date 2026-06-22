class Webhook {
  constructor(config) {
    this.provider = config.provider;
    this.name = config.name || 'webhook';
    this.path = config.path || '/webhook';
    this.secret = config.secret || '';
    this._handler = config.handler || (() => ({ received: true }));
  }

  handle(payload, headers) {
    return this._handler(payload, headers);
  }

  setHandler(fn) { this._handler = fn; }
  verifySignature(payload, signature) {
    if (!this.secret) return true;
    const crypto = require('crypto');
    const expected = crypto.createHmac('sha256', this.secret).update(JSON.stringify(payload)).digest('hex');
    return expected === signature;
  }
}

const createWebhook = (config) => new Webhook(config);

module.exports = { Webhook, createWebhook };
