const commands = {
  init: require('./commands/init'),
  login: require('./commands/login'),
  logout: require('./commands/logout'),
  generate: require('./commands/generate'),
  deploy: require('./commands/deploy'),
  status: require('./commands/status'),
  agents: require('./commands/agents'),
  workflows: require('./commands/workflows'),
  plugins: require('./commands/plugins'),
  billing: require('./commands/billing'),
  integrations: require('./commands/integrations'),
  config: require('./commands/config'),
  doctor: require('./commands/doctor'),
  logs: require('./commands/logs'),
  update: require('./commands/update')
};

class CLI {
  constructor(options = {}) {
    this._platform = options.platform;
    this._version = options.version || '4.5.0';
  }

  run(args) {
    const cmd = args[2] || 'help';
    const rest = args.slice(3);
    if (cmd === 'help' || cmd === '--help' || cmd === '-h') return this.help();
    if (cmd === 'version' || cmd === '--version' || cmd === '-v') return { success: true, output: `Platform CLI v${this._version}` };
    if (!commands[cmd]) return { success: false, error: `Unknown command: ${cmd}. Run 'platform help' for usage.` };
    try { return commands[cmd].handler(rest, this._platform); }
    catch (e) { return { success: false, error: e.message }; }
  }

  help() {
    return {
      success: true,
      output: [
        'Platform CLI v' + this._version,
        '',
        'Usage: platform <command> [options]',
        '',
        'Commands:',
        '  init          Initialize a new project',
        '  login         Authenticate with the platform',
        '  logout        Clear authentication',
        '  generate      Generate code, SDKs, or schemas',
        '  deploy        Deploy a project',
        '  status        Show platform status',
        '  agents        Manage agents',
        '  workflows     Manage workflows',
        '  plugins       Manage plugins',
        '  billing       View billing info',
        '  integrations  Manage integrations',
        '  config        Manage configuration',
        '  doctor        Run diagnostics',
        '  logs          View logs',
        '  update        Update the CLI',
        '',
        'Run \'platform <command> --help\' for command-specific help.'
      ].join('\n')
    };
  }
}

function createCLI(options) { return new CLI(options); }

module.exports = { CLI, createCLI };
