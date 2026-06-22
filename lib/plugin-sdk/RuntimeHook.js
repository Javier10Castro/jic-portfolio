class RuntimeHook {
  constructor(config) {
    this.name = config.name;
    this.hooks = config.hooks || {};
  }
  onEvent(event, handler) { if (!this.hooks[event]) this.hooks[event] = []; this.hooks[event].push(handler); }
  trigger(event, data) { const handlers = this.hooks[event] || []; return handlers.map(h => h(data)); }
  getHooks() { return { ...this.hooks }; }
}
module.exports = { RuntimeHook };
