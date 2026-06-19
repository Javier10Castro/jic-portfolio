class MessageBus {
  constructor() {
    this._subscribers = new Map();
    this._history = [];
    this._maxHistory = 200;
  }

  subscribe(agentId, eventType, handler) {
    const key = `${eventType}`;
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, []);
    }
    this._subscribers.get(key).push({ agentId, handler });
    return () => this._unsubscribe(key, agentId, handler);
  }

  publish(from, to, type, payload) {
    const msg = {
      id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      from, to, type, payload,
      timestamp: Date.now(),
    };
    this._history.push(msg);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    const key = `${type}`;
    const subscribers = this._subscribers.get(key) || [];
    for (const sub of subscribers) {
      try {
        sub.handler(msg, from);
      } catch (err) {
        console.error(`[MessageBus] subscriber error: ${err.message}`);
      }
    }

    const toKey = `to:${to}`;
    const toSubs = this._subscribers.get(toKey) || [];
    for (const sub of toSubs) {
      try { sub.handler(msg, from); } catch {}
    }

    return msg;
  }

  broadcast(from, type, payload) {
    return this.publish(from, '*', type, payload);
  }

  request(from, to, type, payload, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const responseKey = `response:${to}:${from}:${type}`;
      const timeoutId = setTimeout(() => {
        this._unsubscribeByKey(responseKey);
        reject(new Error(`Request timed out: ${from}→${to} type=${type}`));
      }, timeout);

      const unsub = this.subscribe(to, responseKey, (msg) => {
        clearTimeout(timeoutId);
        unsub();
        resolve(msg.payload);
      });

      this.publish(from, to, type, { ...payload, _request: true, _expectsResponse: true });
    });
  }

  respond(to, requestMsg, responsePayload) {
    const responseKey = `response:${requestMsg.from}:${to}:${requestMsg.type}`;
    this.publish(to, requestMsg.from, responseKey, responsePayload);
  }

  getHistory(limit = 50) {
    return this._history.slice(-limit);
  }

  clear() {
    this._subscribers.clear();
    this._history = [];
  }

  _unsubscribe(key, agentId, handler) {
    const subs = this._subscribers.get(key);
    if (!subs) return;
    const idx = subs.findIndex(s => s.agentId === agentId && s.handler === handler);
    if (idx !== -1) subs.splice(idx, 1);
  }

  _unsubscribeByKey(key) {
    this._subscribers.delete(key);
  }
}

module.exports = MessageBus;
