class Hook {
  constructor(name) {
    this.name = name;
    this._handlers = [];
  }

  register(handler, priority = 10) {
    this._handlers.push({ handler, priority });
    this._handlers.sort((a, b) => a.priority - b.priority);
  }

  execute(context) {
    const results = [];
    this._handlers.forEach(({ handler, priority }) => {
      try {
        results.push({ success: true, result: handler(context), priority });
      } catch (e) {
        results.push({ success: false, error: e.message, priority });
      }
    });
    return results;
  }

  getHandlerCount() { return this._handlers.length; }
  clear() { this._handlers = []; }
}

module.exports = { Hook };
