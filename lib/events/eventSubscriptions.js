class EventSubscriptions {
  constructor(eventBus) {
    this._eventBus = eventBus;
    this._subscriptions = new Map();
  }

  subscribe(subscriberId, type, handler, options = {}) {
    if (!this._subscriptions.has(subscriberId)) this._subscriptions.set(subscriberId, []);
    const off = this._eventBus.on(type, handler);
    const sub = { subscriberId, type, handler, off, options, createdAt: Date.now() };
    this._subscriptions.get(subscriberId).push(sub);
    return off;
  }

  unsubscribe(subscriberId, type) {
    const subs = this._subscriptions.get(subscriberId);
    if (!subs) return false;
    const remaining = [];
    let found = false;
    for (const sub of subs) {
      if (sub.type === type && !found) {
        sub.off();
        found = true;
      } else {
        remaining.push(sub);
      }
    }
    if (remaining.length === 0) this._subscriptions.delete(subscriberId);
    else this._subscriptions.set(subscriberId, remaining);
    return found;
  }

  unsubscribeAll(subscriberId) {
    const subs = this._subscriptions.get(subscriberId);
    if (!subs) return false;
    for (const sub of subs) sub.off();
    this._subscriptions.delete(subscriberId);
    return true;
  }

  getSubscriptions(subscriberId) {
    return this._subscriptions.get(subscriberId) || [];
  }

  listSubscribers() {
    return Array.from(this._subscriptions.keys());
  }

  subscriberCount() {
    return this._subscriptions.size;
  }

  subscriptionCount() {
    let count = 0;
    for (const [, subs] of this._subscriptions) count += subs.length;
    return count;
  }

  clear() {
    for (const [, subs] of this._subscriptions) {
      for (const sub of subs) sub.off();
    }
    this._subscriptions.clear();
  }
}

module.exports = EventSubscriptions;
