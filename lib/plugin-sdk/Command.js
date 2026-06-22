class Command {
  constructor(config) {
    this.name = config.name;
    this.description = config.description || '';
    this.usage = config.usage || '';
    this.category = config.category || 'general';
    this._handler = config.handler || (() => {});
  }

  execute(args, context = {}) {
    return this._handler(args, context);
  }

  setHandler(handler) { this._handler = handler; }
}

const createCommand = (config) => new Command(config);

module.exports = { Command, createCommand };
