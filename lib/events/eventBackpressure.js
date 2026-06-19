const STRATEGIES = ['drop', 'buffer', 'throttle', 'block'];

class EventBackpressure {
  constructor(options = {}) {
    this._maxQueueSize = options.maxQueueSize != null ? options.maxQueueSize : 1000;
    this._maxRatePerSecond = options.maxRatePerSecond != null ? options.maxRatePerSecond : 10000;
    this._strategy = options.strategy || 'buffer';
    this._queue = [];
    this._dropped = 0;
    this._processed = 0;
    this._timestamps = [];
    this._overloaded = false;
    this._onDrop = options.onDrop || null;
    this._onOverload = options.onOverload || null;
  }

  setMaxRatePerSecond(rate) {
    this._maxRatePerSecond = rate;
  }

  setStrategy(strategy) {
    if (!STRATEGIES.includes(strategy)) throw new Error(`Unknown strategy: ${strategy}`);
    this._strategy = strategy;
  }

  getStrategy() {
    return this._strategy;
  }

  async push(event) {
    if (this._isOverloaded()) {
      this._overloaded = true;
      switch (this._strategy) {
        case 'drop':
          this._dropped++;
          if (this._onDrop) this._onDrop(event);
          return { accepted: false, reason: 'dropped' };
        case 'buffer':
          if (this._queue.length < this._maxQueueSize) {
            this._queue.push(event);
            return { accepted: true, buffered: true };
          }
          this._dropped++;
          if (this._onDrop) this._onDrop(event);
          return { accepted: false, reason: 'buffer_full' };
        case 'throttle':
          await this._throttle();
          this._queue.push(event);
          return { accepted: true, throttled: true };
        case 'block':
          await this._waitUntilReady();
          this._queue.push(event);
          return { accepted: true, blocked: true };
      }
    }

    return { accepted: true, buffered: false };
  }

  async process(handler) {
    const results = [];
    while (this._queue.length > 0 && !this._isOverloaded()) {
      const event = this._queue.shift();
      try {
        await handler(event);
        this._processed++;
        this._timestamps.push(Date.now());
        results.push({ success: true, event });
      } catch (e) {
        results.push({ success: false, event, error: e.message });
      }
    }
    if (this._queue.length === 0) this._overloaded = false;
    return results;
  }

  getQueueSize() {
    return this._queue.length;
  }

  getDroppedCount() {
    return this._dropped;
  }

  getProcessedCount() {
    return this._processed;
  }

  getRatePerSecond() {
    const now = Date.now();
    this._timestamps = this._timestamps.filter(t => now - t < 1000);
    return this._timestamps.length;
  }

  isOverloaded() {
    return this._overloaded || this._isOverloaded();
  }

  getStatus() {
    return {
      strategy: this._strategy,
      queueSize: this._queue.length,
      maxQueueSize: this._maxQueueSize,
      dropped: this._dropped,
      processed: this._processed,
      ratePerSecond: this.getRatePerSecond(),
      maxRatePerSecond: this._maxRatePerSecond,
      overloaded: this._overloaded || this._isOverloaded(),
    };
  }

  reset() {
    this._queue = [];
    this._dropped = 0;
    this._processed = 0;
    this._timestamps = [];
    this._overloaded = false;
  }

  _isOverloaded() {
    return this.getRatePerSecond() >= this._maxRatePerSecond || this._queue.length >= this._maxQueueSize;
  }

  async _throttle() {
    const delay = Math.min(1000 / this._maxRatePerSecond, 100);
    return new Promise(r => setTimeout(r, delay));
  }

  async _waitUntilReady() {
    while (this._isOverloaded()) {
      await new Promise(r => setTimeout(r, 10));
    }
  }
}

module.exports = { EventBackpressure, STRATEGIES };
