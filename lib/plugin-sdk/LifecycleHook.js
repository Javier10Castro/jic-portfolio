class LifecycleHook {
  constructor(config) {
    this.name = config.name;
    this.hooks = {};
  }
  on(event, handler) { if (!this.hooks[event]) this.hooks[event] = []; this.hooks[event].push(handler); }
  trigger(event, data) { const h = this.hooks[event] || []; return h.map(fn => fn(data)); }
  getHooks() { return { ...this.hooks }; }
}
module.exports = { LifecycleHook };
