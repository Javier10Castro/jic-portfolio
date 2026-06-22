# Plugin Development Guide

This guide walks through creating a plugin from scratch using the Plugin SDK.

## Prerequisites

- Node.js 18+
- Access to the platform codebase (or a compatible host)
- Familiarity with JSON and JavaScript

## Step 1: Scaffold Your Plugin

Create a directory and two files:

```
my-plugin/
├── plugin.json
└── index.js
```

## Step 2: Create the Manifest

`plugin.json` declares your plugin's identity, capabilities, and requirements:

```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "license": "MIT",
  "description": "Does something amazing.",
  "type": "widget",
  "permissions": ["core.read"],
  "hooks": {},
  "categories": ["analytics", "dashboard"],
  "dependencies": {},
  "minimumPlatformVersion": "4.0.0"
}
```

### Rules

- `id` must match `/^[a-z0-9_-]+$/` (lowercase alphanumeric, hyphens, underscores)
- `version` must be semver (`/\d+\.\d+\.\d+/`)
- `permissions` is optional only for `theme` type
- `hooks` keys must match the well-known hook catalog (21 hooks)
- `minimumPlatformVersion`/`maximumPlatformVersion` are semver checked against platform version

## Step 3: Write Plugin Code

`index.js` — import the SDK, create a plugin, register extensions:

```js
const { createPlugin } = require('lib/plugin-sdk');

const manifest = require('./plugin.json');
const plugin = createPlugin(manifest);

// Register hooks
plugin.registerHook('afterDeployment', (context) => {
  console.log(`Deployed ${context.project} to ${context.url}`);
  return { notified: true };
});

// Register commands
plugin.registerCommand('greet', (args) => {
  return `Hello, ${args.name || 'world'}!`;
}, { description: 'Greets the user', usage: 'greet --name <name>' });

// Register widgets
plugin.registerWidget('my-widget', (data) => {
  return `<div>Count: ${data.count || 0}</div>`;
}, { title: 'My Widget', width: 2 });

// Extend API
plugin.extendAPI('/api/my-plugin/data', (req, res) => {
  return { status: 'ok', data: req.query };
}, 'GET');

// Extend workflows
plugin.extendWorkflow('approval', (context) => {
  return { approved: true, message: 'Auto-approved by plugin' };
});

// Extend agents
plugin.extendAgent('analyze', (task, context) => {
  return { output: `Analyzed: ${task.input}` };
});

// Lifecycle hooks
plugin.onLoad = function() { console.log('Plugin loaded'); };
plugin.onUnload = function() { console.log('Plugin unloaded'); };
plugin.onEnable = function() { console.log('Plugin enabled'); };
plugin.onDisable = function() { console.log('Plugin disabled'); };

module.exports = plugin;
```

## Step 4: Using SDK Classes

The SDK exports factory functions and constructors for each plugin type.

### Hook

```js
const { Hook } = require('lib/plugin-sdk');
const hook = new Hook('beforeDeployment');
hook.register((context) => { /* ... */ }, 10); // priority (lower = first)
hook.register((context) => { /* ... */ }, 20);
const results = hook.execute({ project: 'my-app' });
```

### Command

```js
const { createCommand } = require('lib/plugin-sdk');
const cmd = createCommand({
  name: 'deploy',
  description: 'Deploy the project',
  usage: 'deploy --env <environment>',
  handler: (args, context) => `Deploying to ${args.env}`
});
const output = cmd.execute({ env: 'production' });
```

### Widget

```js
const { createWidget } = require('lib/plugin-sdk');
const widget = createWidget({
  id: 'revenue-chart',
  title: 'Revenue Chart',
  width: 2,
  height: 1,
  renderer: (data) => `<svg>...</svg>`
});
const html = widget.render({ revenue: 5000 });
```

### ApiExtension

```js
const { createApiExtension } = require('lib/plugin-sdk');
const api = createApiExtension({
  path: '/api/v1/custom/hello',
  method: 'GET',
  description: 'Custom hello endpoint',
  auth: true,
  handler: (req, res) => ({ message: 'Hello from plugin' })
});
const response = api.handle({ query: {} }, {});
```

### WorkflowExtension

```js
const { createWorkflowExtension } = require('lib/plugin-sdk');
const wf = createWorkflowExtension({
  type: 'deployment-check',
  name: 'Deployment Pre-check',
  handler: (context) => ({ pass: true, checks: ['lint', 'test'] })
});
const result = wf.execute({ project: 'my-app' });
```

### AgentExtension

```js
const { createAgentExtension } = require('lib/plugin-sdk');
const agent = createAgentExtension({
  type: 'code-review',
  name: 'Code Reviewer',
  handler: (task, context) => ({ output: `Reviewing ${task.files?.length} files` })
});
const result = agent.execute({ files: ['src/main.js'] }, {});
```

### GeneratorExtension

```js
const { createGeneratorExtension } = require('lib/plugin-sdk');
const gen = createGeneratorExtension({
  name: 'react-component',
  description: 'Generates a React component',
  templateType: 'component',
  generator: (input, context) => ({
    files: { [`${input.name}.jsx`]: `export default function ${input.name}() { return null; }` }
  })
});
const output = gen.generate({ name: 'Button' });
```

### StorageExtension

```js
const { StorageExtension } = require('lib/plugin-sdk');
const store = new StorageExtension('my-plugin', pluginManager.storage);
store.set('config', { theme: 'dark' });
const config = store.get('config'); // { theme: 'dark' }
store.delete('config');
store.clear();
```

### PluginLogger

```js
const { PluginLogger } = require('lib/plugin-sdk');
const log = new PluginLogger('my-plugin');
log.info('Plugin initialized', { version: '1.0.0' });
log.warn('Rate limit approaching', { current: 95 });
log.error('Failed to connect', { service: 'api' });
log.debug('Processing batch', { count: 42 });
const errors = log.getLogs('error'); // filter by level
```

### PluginConfig

```js
const { PluginConfig } = require('lib/plugin-sdk');
const config = new PluginConfig('my-plugin', { theme: 'light', maxItems: 50 });
config.set('theme', 'dark');
config.onChange('theme', (newVal, oldVal) => {
  console.log(`Theme changed from ${oldVal} to ${newVal}`);
});
const theme = config.get('theme'); // 'dark'
config.reset('theme'); // back to default
const all = config.get(); // { theme: 'light', maxItems: 50 }
```

## Step 5: Permissions

Declare required permissions in `plugin.json`:

```json
{
  "permissions": ["core.read", "core.write", "webhooks", "network"]
}
```

Available permissions: `core.read`, `core.write`, `api.access`, `webhooks`, `filesystem.read`, `filesystem.write`, `network`, `storage`, `events`, `agents`, `workflows`, `billing`, `security`, `cost`, `telemetry`, `admin`.

At runtime, check permissions via the sandbox:

```js
// Inside a plugin instance, via the sandbox wrapper:
if (this.requirePermission('core.write')) {
  // Perform write operation
}
```

The `admin` permission grants all capabilities.

## Step 6: Testing Locally

```js
const { PluginManager } = require('lib/plugins/pluginManager');
const manager = new PluginManager({ platformVersion: '4.3.0' });

// Install from manifest object
const result = manager.install({
  id: 'test-plugin',
  manifest: {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    type: 'widget',
    permissions: ['core.read'],
    hooks: {},
    categories: ['testing']
  }
});

// Install from file system
const manifest = require('./my-plugin/plugin.json');
const pluginCode = require('./my-plugin/index.js');
const result2 = manager.install({
  id: manifest.id,
  manifest,
  _load: () => pluginCode
});

// Verify
console.log(manager.listPlugins());
console.log(manager.getPlugin('test-plugin'));

// Execute hooks
const hookResult = manager.executeHook('beforeDeployment', { project: 'my-app' });

// Check permissions
manager.grantPermission('test-plugin', 'core.read');
const allowed = manager.checkPermission('test-plugin', 'core.read');

// Uninstall
manager.uninstall('test-plugin');
```

## Step 7: Publishing to Marketplace

```js
const listing = manager.publishListing({
  id: 'my-awesome-plugin',
  name: 'My Awesome Plugin',
  description: 'Does something amazing.',
  author: 'Your Name',
  version: '1.0.0',
  categories: ['analytics', 'dashboard'],
  tags: ['awesome', 'analytics'],
  homepage: 'https://example.com/plugin',
  repository: 'https://github.com/you/my-plugin',
  license: 'MIT'
});
```

## Step 8: Best Practices

1. **Idempotent hooks**: Hook handlers should be safe to run multiple times
2. **Error handling**: Wrap async operations in try/catch — hook errors don't crash the host
3. **Minimal permissions**: Request only the permissions you need
4. **Versioning**: Follow semver strictly — breaking changes = major version bump
5. **Dependencies**: Declare all plugin dependencies in `plugin.json`
6. **Platform version**: Set `minimumPlatformVersion` to avoid runtime incompatibilities
7. **Storage**: Use `StorageExtension` instead of global variables for persistence
8. **Logging**: Use `PluginLogger` for structured, filterable logs
9. **Configuration**: Use `PluginConfig` with defaults for user-configurable settings
10. **Cleanup**: Implement `onUnload()` to release resources (timers, connections)

## Example Plugins

Reference implementations in `examples/plugins/`:

| Plugin | Type | Demonstrates |
|---|---|---|
| `analytics-widget` | widget | Dashboard widget with SSR HTML renderer |
| `slack-notifier` | agent | Hook handlers for `afterDeployment` and `afterBilling` |
| `workflow-approval` | workflow | Workflow extension + `beforeDeployment` hook with approval gate |
| `custom-api` | api | API extension at `/api/v1/plugins/:id/health` |
| `dark-theme` | theme | Theme widget with CSS variables |
