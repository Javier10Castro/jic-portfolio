const crypto = require('crypto');

class IntegrationWebhook {
  constructor({ events, storage, secrets }) {
    this._events = events;
    this._storage = storage;
    this._secrets = secrets;
    this._webhooks = {};
    this._idCounter = 0;
  }

  registerIncoming(provider, config) {
    const id = `wh_in_${provider}_${++this._idCounter}`;
    this._webhooks[id] = {
      id,
      provider,
      direction: 'incoming',
      path: config.path,
      secret: config.secret,
      createdAt: Date.now()
    };
    return { success: true, id };
  }

  registerOutgoing(provider, config) {
    const id = `wh_out_${provider}_${++this._idCounter}`;
    this._webhooks[id] = {
      id,
      provider,
      direction: 'outgoing',
      url: config.url,
      secret: config.secret,
      events: config.events || [],
      createdAt: Date.now()
    };
    return { success: true, id };
  }

  processIncoming(provider, payload, signature) {
    const webhooks = Object.values(this._webhooks).filter(
      w => w.provider === provider && w.direction === 'incoming'
    );

    for (const wh of webhooks) {
      if (wh.secret) {
        const expected = crypto.createHmac('sha256', wh.secret).update(JSON.stringify(payload)).digest('hex');
        if (signature !== expected) {
          return { success: false, error: 'Invalid signature' };
        }
      }
    }

    this._events.emit(this._events.constructor.EVENTS.WEBHOOK_RECEIVED, { provider, payload });
    return { success: true };
  }

  sendOutgoing(provider, event, payload) {
    const webhooks = Object.values(this._webhooks).filter(
      w => w.provider === provider && w.direction === 'outgoing' && w.events.includes(event)
    );

    const results = [];
    for (const wh of webhooks) {
      const body = JSON.stringify({ event, payload, timestamp: Date.now() });
      const signature = wh.secret ? crypto.createHmac('sha256', wh.secret).update(body).digest('hex') : '';
      results.push({ webhook: wh.id, sent: true, signature });
    }

    return { success: true, results };
  }

  getWebhooks(provider) {
    return Object.values(this._webhooks).filter(w => w.provider === provider);
  }

  deleteWebhook(id) {
    if (!this._webhooks[id]) return { success: false, error: 'Webhook not found' };
    delete this._webhooks[id];
    return { success: true };
  }

  clear() {
    this._webhooks = {};
  }
}

module.exports = { IntegrationWebhook };
