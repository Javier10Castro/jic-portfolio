class AgentExtension {
  constructor(config) {
    this.type = config.type;
    this.name = config.name || config.type;
    this.description = config.description || '';
    this._handler = config.handler || (() => ({ output: '' }));
  }

  execute(task, context) {
    return this._handler(task, context);
  }

  setHandler(handler) { this._handler = handler; }
}

const createAgentExtension = (config) => new AgentExtension(config);

module.exports = { AgentExtension, createAgentExtension };
