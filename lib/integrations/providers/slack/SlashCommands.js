class SlackSlashCommands {
  constructor(provider) {
    this.provider = provider;
    this.handlers = {};
  }

  async register(command, handler) {
    this.handlers[command] = handler;
    return { success: true, command };
  }

  async execute(command, args, userId) {
    const handler = this.handlers[command];
    if (!handler) {
      return { success: false, error: `Unknown command: ${command}` };
    }
    const result = await handler({ command, args, userId });
    return { success: true, data: result };
  }

  async list() {
    return {
      success: true,
      data: Object.keys(this.handlers).map(cmd => ({ command: cmd, registered: true })),
    };
  }
}

module.exports = { SlackSlashCommands };
