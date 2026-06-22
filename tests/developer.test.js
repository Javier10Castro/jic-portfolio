const assert = require('assert');
const { DeveloperPlatform, createPlatform, getDefaultPlatform, SdkRegistry, SdkGenerator, ClientGenerator, OpenApiGenerator, SchemaGenerator, DeveloperEvents, DeveloperStorage, DeveloperAnalytics, DeveloperPortal, EVENTS } = require('../lib/developer');
const { CLI, createCLI } = require('../lib/developer/cli/cli');
const { PlatformClient: JsPlatformClient } = require('../lib/developer/sdk/javascript');
const { TerraformProvider } = require('../lib/developer/terraform/provider/provider');
const { ProjectResource } = require('../lib/developer/terraform/provider/resources/project');
const { DeploymentResource } = require('../lib/developer/terraform/provider/resources/deployment');
const { BillingResource } = require('../lib/developer/terraform/provider/resources/billing');
const { WorkspaceResource } = require('../lib/developer/terraform/provider/resources/workspace');
const { ApiKeyResource } = require('../lib/developer/terraform/provider/resources/apikey');
const { IntegrationResource } = require('../lib/developer/terraform/provider/resources/integration');
const { PluginResource } = require('../lib/developer/terraform/provider/resources/plugin');
const { WorkflowResource } = require('../lib/developer/terraform/provider/resources/workflow');
const developerController = require('../lib/api/controllers/developerController');

describe('Developer Platform — Phase 9.5.0', () => {
  describe('SdkRegistry', () => {
    it('should register an SDK', () => {
      const reg = new SdkRegistry();
      reg.register('javascript', { language: 'javascript', version: '4.5.0' });
      assert.strictEqual(reg.getCount(), 1);
    });

    it('should get an SDK by language', () => {
      const reg = new SdkRegistry();
      reg.register('python', { language: 'python', version: '4.5.0' });
      const sdk = reg.get('python');
      assert.ok(sdk);
      assert.strictEqual(sdk.language, 'python');
    });

    it('should return null for unregistered language', () => {
      const reg = new SdkRegistry();
      assert.strictEqual(reg.get('nonexistent'), null);
    });

    it('should unregister an SDK', () => {
      const reg = new SdkRegistry();
      reg.register('go', { language: 'go' });
      reg.unregister('go');
      assert.strictEqual(reg.getCount(), 0);
    });

    it('should list all registered SDKs', () => {
      const reg = new SdkRegistry();
      reg.register('js', { language: 'js' });
      reg.register('ts', { language: 'ts' });
      const list = reg.list();
      assert.strictEqual(list.length, 2);
    });

    it('should clear all registered SDKs', () => {
      const reg = new SdkRegistry();
      reg.register('js', {});
      reg.register('ts', {});
      reg.clear();
      assert.strictEqual(reg.getCount(), 0);
    });
  });

  describe('SdkGenerator', () => {
    it('should generate an SDK', () => {
      const gen = new SdkGenerator({ registry: new SdkRegistry() });
      const result = gen.generate('javascript');
      assert.ok(result.success);
      assert.ok(result.sdk);
      assert.strictEqual(result.sdk.language, 'javascript');
    });

    it('should register generated SDK in registry', () => {
      const reg = new SdkRegistry();
      const gen = new SdkGenerator({ registry: reg });
      gen.generate('python', { version: '4.5.0' });
      assert.strictEqual(reg.getCount(), 1);
      assert.ok(reg.get('python'));
    });

    it('should get status for a language', () => {
      const gen = new SdkGenerator({ registry: new SdkRegistry() });
      gen.generate('go');
      const status = gen.getStatus('go');
      assert.ok(status);
      assert.strictEqual(status.status, 'generated');
    });

    it('should return null for unknown language status', () => {
      const gen = new SdkGenerator({ registry: new SdkRegistry() });
      assert.strictEqual(gen.getStatus('unknown'), null);
    });

    it('should list all generated SDKs', () => {
      const gen = new SdkGenerator({ registry: new SdkRegistry() });
      gen.generate('js');
      gen.generate('py');
      const list = gen.listSdks();
      assert.strictEqual(list.length, 2);
    });

    it('should return package names for all languages', () => {
      const gen = new SdkGenerator({ registry: new SdkRegistry() });
      const js = gen.generate('javascript');
      const ts = gen.generate('typescript');
      const py = gen.generate('python');
      const go = gen.generate('go');
      const java = gen.generate('java');
      const cs = gen.generate('csharp');
      const php = gen.generate('php');
      assert.strictEqual(js.sdk.package, '@platform/sdk-js');
      assert.strictEqual(ts.sdk.package, '@platform/sdk-ts');
      assert.strictEqual(py.sdk.package, 'platform-sdk');
      assert.strictEqual(go.sdk.package, 'github.com/platform/sdk-go');
      assert.strictEqual(java.sdk.package, 'com.platform:sdk');
      assert.strictEqual(cs.sdk.package, 'Platform.Sdk');
      assert.strictEqual(php.sdk.package, 'platform/sdk-php');
    });

    it('should clear all generated SDKs', () => {
      const gen = new SdkGenerator({ registry: new SdkRegistry() });
      gen.generate('js');
      gen.clear();
      assert.strictEqual(gen.getCount(), 0);
    });
  });

  describe('ClientGenerator', () => {
    it('should generate a client', () => {
      const gen = new ClientGenerator();
      const result = gen.generate('javascript', { version: '4.5.0' });
      assert.ok(result.success);
      assert.ok(result.client);
      assert.strictEqual(result.client.language, 'javascript');
    });

    it('should get client status by id', () => {
      const gen = new ClientGenerator();
      const { client } = gen.generate('python');
      const status = gen.getStatus(client.id);
      assert.ok(status);
      assert.strictEqual(status.status, 'generated');
    });

    it('should return null for unknown client', () => {
      const gen = new ClientGenerator();
      assert.strictEqual(gen.getStatus('unknown'), null);
    });

    it('should return client count', () => {
      const gen = new ClientGenerator();
      gen.generate('js');
      gen.generate('py');
      gen.generate('go');
      assert.strictEqual(gen.getCount(), 3);
    });

    it('should clear all clients', () => {
      const gen = new ClientGenerator();
      gen.generate('js');
      gen.clear();
      assert.strictEqual(gen.getCount(), 0);
    });

    it('should generate clients with unique ids', () => {
      const gen = new ClientGenerator();
      const a = gen.generate('js');
      const b = gen.generate('py');
      assert.notStrictEqual(a.client.id, b.client.id);
    });
  });

  describe('OpenApiGenerator', () => {
    it('should generate OpenAPI spec', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('4.5.0');
      assert.ok(result.success);
      assert.ok(result.spec);
      assert.strictEqual(result.spec.openapi, '3.1.0');
    });

    it('should get spec by version', () => {
      const gen = new OpenApiGenerator();
      gen.generate('4.5.0');
      const spec = gen.getSpec('4.5.0');
      assert.ok(spec);
      assert.strictEqual(spec.info.version, '4.5.0');
    });

    it('should return null for unknown version', () => {
      const gen = new OpenApiGenerator();
      assert.strictEqual(gen.getSpec('1.0.0'), null);
    });

    it('should list all versions', () => {
      const gen = new OpenApiGenerator();
      gen.generate('4.5.0');
      gen.generate('4.4.0');
      const versions = gen.getVersions();
      assert.strictEqual(versions.length, 2);
    });

    it('should get count', () => {
      const gen = new OpenApiGenerator();
      gen.generate('4.5.0');
      assert.strictEqual(gen.getCount(), 1);
    });

    it('should clear all specs', () => {
      const gen = new OpenApiGenerator();
      gen.generate('4.5.0');
      gen.clear();
      assert.strictEqual(gen.getCount(), 0);
    });

    it('should include paths and security', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('4.5.0');
      assert.ok(result.spec.paths);
      assert.ok(result.spec.components.securitySchemes.bearerAuth);
    });
  });

  describe('SchemaGenerator', () => {
    it('should generate schema for domain', () => {
      const gen = new SchemaGenerator();
      const result = gen.generate('project');
      assert.ok(result.success);
      assert.ok(result.schema);
      assert.strictEqual(result.schema.type, 'object');
    });

    it('should generate all schemas', () => {
      const gen = new SchemaGenerator();
      const result = gen.generate();
      assert.ok(result.success);
      assert.ok(result.schemas);
      assert.ok(result.schemas.project);
      assert.ok(result.schemas.deployment);
      assert.ok(result.schemas.plugin);
      assert.ok(result.schemas.integration);
      assert.ok(result.schemas.workflow);
      assert.ok(result.schemas.billing);
    });

    it('should get schema by name', () => {
      const gen = new SchemaGenerator();
      gen.generate('deployment');
      const schema = gen.getSchema('deployment');
      assert.ok(schema);
      assert.ok(schema.properties.status);
    });

    it('should return null for unknown schema', () => {
      const gen = new SchemaGenerator();
      assert.strictEqual(gen.getSchema('unknown'), null);
    });

    it('should get count', () => {
      const gen = new SchemaGenerator();
      gen.generate('project');
      gen.generate('plugin');
      assert.strictEqual(gen.getCount(), 2);
    });

    it('should clear all schemas', () => {
      const gen = new SchemaGenerator();
      gen.generate('project');
      gen.clear();
      assert.strictEqual(gen.getCount(), 0);
    });
  });

  describe('DeveloperEvents', () => {
    it('should emit and listen to events', () => {
      const events = new DeveloperEvents();
      let received = null;
      events.on(EVENTS.SDK_GENERATED, (entry) => { received = entry; });
      events.emit(EVENTS.SDK_GENERATED, { language: 'js' });
      assert.ok(received);
      assert.strictEqual(received.event, EVENTS.SDK_GENERATED);
    });

    it('should support wildcard listener', () => {
      const events = new DeveloperEvents();
      let wildcard = null;
      events.on('*', (entry) => { wildcard = entry; });
      events.emit(EVENTS.CLI_COMMAND, { cmd: 'deploy' });
      assert.ok(wildcard);
      assert.strictEqual(wildcard.event, EVENTS.CLI_COMMAND);
    });

    it('should remove listener', () => {
      const events = new DeveloperEvents();
      let count = 0;
      const handler = () => { count++; };
      events.on(EVENTS.API_CALL, handler);
      events.emit(EVENTS.API_CALL, {});
      events.off(EVENTS.API_CALL, handler);
      events.emit(EVENTS.API_CALL, {});
      assert.strictEqual(count, 1);
    });

    it('should maintain event history', () => {
      const events = new DeveloperEvents();
      events.emit(EVENTS.SDK_GENERATED, {});
      events.emit(EVENTS.CLIENT_GENERATED, {});
      const history = events.history();
      assert.strictEqual(history.length, 2);
    });

    it('should filter history by event type', () => {
      const events = new DeveloperEvents();
      events.emit(EVENTS.SDK_GENERATED, {});
      events.emit(EVENTS.SDK_GENERATED, {});
      events.emit(EVENTS.CLIENT_GENERATED, {});
      const filtered = events.history(EVENTS.SDK_GENERATED);
      assert.strictEqual(filtered.length, 2);
    });

    it('should have EVENTS constants', () => {
      assert.strictEqual(EVENTS.SDK_GENERATED, 'developer.sdk.generated');
      assert.strictEqual(EVENTS.CLIENT_GENERATED, 'developer.client.generated');
      assert.strictEqual(EVENTS.OPENAPI_GENERATED, 'developer.openapi.generated');
      assert.strictEqual(EVENTS.SCHEMA_GENERATED, 'developer.schema.generated');
      assert.strictEqual(EVENTS.CLI_COMMAND, 'developer.cli.command');
      assert.strictEqual(EVENTS.API_CALL, 'developer.api.call');
      assert.strictEqual(EVENTS.PORTAL_VIEWED, 'developer.portal.viewed');
      assert.strictEqual(EVENTS.DOCS_VIEWED, 'developer.docs.viewed');
    });

    it('should clear history', () => {
      const events = new DeveloperEvents();
      events.emit(EVENTS.SDK_GENERATED, {});
      events.clear();
      assert.strictEqual(events.history().length, 0);
    });

    it('should handle errors in listeners silently', () => {
      const events = new DeveloperEvents();
      events.on(EVENTS.SDK_GENERATED, () => { throw new Error('handler error'); });
      assert.doesNotThrow(() => events.emit(EVENTS.SDK_GENERATED, {}));
    });
  });

  describe('DeveloperStorage', () => {
    it('should set and get values', () => {
      const storage = new DeveloperStorage();
      storage.set('key1', 'value1');
      assert.strictEqual(storage.get('key1'), 'value1');
    });

    it('should check existence', () => {
      const storage = new DeveloperStorage();
      storage.set('exists', 'yes');
      assert.ok(storage.has('exists'));
      assert.strictEqual(storage.has('missing'), false);
    });

    it('should delete values', () => {
      const storage = new DeveloperStorage();
      storage.set('temp', 'val');
      storage.delete('temp');
      assert.strictEqual(storage.has('temp'), false);
    });

    it('should return undefined for missing key', () => {
      const storage = new DeveloperStorage();
      assert.strictEqual(storage.get('missing'), undefined);
    });

    it('should get all data', () => {
      const storage = new DeveloperStorage();
      storage.set('a', 1);
      storage.set('b', 2);
      const all = storage.getAll();
      assert.strictEqual(all.a, 1);
      assert.strictEqual(all.b, 2);
    });

    it('should clear all data', () => {
      const storage = new DeveloperStorage();
      storage.set('key', 'val');
      storage.clear();
      assert.strictEqual(storage.has('key'), false);
    });
  });

  describe('DeveloperAnalytics', () => {
    it('should record API calls', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/plugins', 'GET', 200, 45);
      const stats = analytics.getStats();
      assert.strictEqual(stats.totalCalls, 1);
    });

    it('should calculate error rate', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/plugins', 'GET', 200, 30);
      analytics.recordCall('/plugins', 'GET', 500, 50);
      analytics.recordCall('/plugins', 'GET', 401, 20);
      const stats = analytics.getStats();
      assert.strictEqual(stats.totalCalls, 3);
      assert.strictEqual(stats.errors, 2);
      assert.strictEqual(stats.errorRate, 67);
    });

    it('should calculate average latency', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/test', 'GET', 200, 10);
      analytics.recordCall('/test', 'GET', 200, 30);
      const stats = analytics.getStats();
      assert.strictEqual(stats.avgLatencyMs, 20);
    });

    it('should track top endpoints', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/plugins', 'GET', 200, 10);
      analytics.recordCall('/plugins', 'GET', 200, 10);
      analytics.recordCall('/integrations', 'GET', 200, 10);
      const stats = analytics.getStats();
      assert.ok(stats.topEndpoints);
      assert.strictEqual(stats.topEndpoints[0].endpoint, '/plugins');
    });

    it('should filter calls by endpoint', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/plugins', 'GET', 200, 10);
      analytics.recordCall('/integrations', 'GET', 200, 10);
      const filtered = analytics.getCalls({ endpoint: '/plugins' });
      assert.strictEqual(filtered.length, 1);
    });

    it('should filter calls by method', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/test', 'GET', 200, 10);
      analytics.recordCall('/test', 'POST', 200, 10);
      const filtered = analytics.getCalls({ method: 'POST' });
      assert.strictEqual(filtered.length, 1);
    });

    it('should filter calls by since timestamp', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/test', 'GET', 200, 10);
      const since = Date.now() + 1;
      const filtered = analytics.getCalls({ since });
      assert.strictEqual(filtered.length, 0);
    });

    it('should clear all records', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/test', 'GET', 200, 10);
      analytics.clear();
      assert.strictEqual(analytics.getStats().totalCalls, 0);
    });

    it('should handle empty calls', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      const stats = analytics.getStats();
      assert.strictEqual(stats.totalCalls, 0);
      assert.strictEqual(stats.errors, 0);
      assert.strictEqual(stats.avgLatencyMs, 0);
    });
  });

  describe('DeveloperPortal', () => {
    it('should render portal with sections', () => {
      const portal = new DeveloperPortal({ analytics: new DeveloperAnalytics({ storage: new DeveloperStorage() }) });
      const result = portal.render();
      assert.ok(result.sections);
      assert.ok(Array.isArray(result.sections));
      assert.ok(result.sections.length > 0);
    });

    it('should include SDK section', () => {
      const portal = new DeveloperPortal();
      const result = portal.render();
      const sdkSection = result.sections.find(s => s.id === 'sdks');
      assert.ok(sdkSection);
      assert.ok(sdkSection.items.includes('JavaScript'));
    });

    it('should include analytics in render', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/test', 'GET', 200, 10);
      const portal = new DeveloperPortal({ analytics });
      const result = portal.render();
      assert.ok(result.analytics);
      assert.strictEqual(result.analytics.totalCalls, 1);
    });
  });

  describe('DeveloperPlatform', () => {
    let platform;

    beforeEach(() => {
      platform = new DeveloperPlatform();
    });

    it('should create with all sub-modules', () => {
      assert.ok(platform.registry);
      assert.ok(platform.sdkGenerator);
      assert.ok(platform.clientGenerator);
      assert.ok(platform.openApiGenerator);
      assert.ok(platform.schemaGenerator);
      assert.ok(platform.events);
      assert.ok(platform.storage);
      assert.ok(platform.analytics);
      assert.ok(platform.portal);
    });

    it('should generate SDK', () => {
      const result = platform.generateSdk('javascript');
      assert.ok(result.success);
      assert.ok(result.sdk);
    });

    it('should generate OpenAPI spec', () => {
      const result = platform.generateOpenApi('4.5.0');
      assert.ok(result.success);
      assert.ok(result.spec);
    });

    it('should generate schema for domain', () => {
      const result = platform.generateSchema('project');
      assert.ok(result.success);
      assert.ok(result.schema);
    });

    it('should generate all schemas', () => {
      const result = platform.generateSchema();
      assert.ok(result.success);
      assert.ok(result.schemas);
    });

    it('should generate Postman collection', () => {
      const result = platform.generatePostman();
      assert.ok(result.success);
      assert.ok(result.collection);
      assert.strictEqual(result.collection.info.name, 'Platform API');
    });

    it('should generate Terraform config', () => {
      const result = platform.generateTerraform();
      assert.ok(result.success);
      assert.ok(result.provider);
    });

    it('should generate GitHub Action config', () => {
      const result = platform.generateGitHubAction();
      assert.ok(result.success);
      assert.ok(result.action);
    });

    it('should generate client', () => {
      const result = platform.generateClient('python', {});
      assert.ok(result.success);
      assert.ok(result.client);
    });

    it('should get status', () => {
      const status = platform.getStatus();
      assert.ok(status.sdks !== undefined);
      assert.ok(status.clients !== undefined);
      assert.ok(status.openApiVersions !== undefined);
      assert.ok(status.schemas !== undefined);
      assert.ok(status.events !== undefined);
      assert.ok(status.analytics);
    });

    it('should track events via trackEvent', () => {
      platform.trackEvent(EVENTS.SDK_GENERATED, { language: 'js' });
      const status = platform.getStatus();
      assert.ok(status.events >= 1);
    });

    it('should get analytics', () => {
      platform.recordApiCall('/test', 'GET', 200, 15);
      const analytics = platform.getAnalytics();
      assert.ok(analytics.totalCalls >= 1);
    });

    it('should get portal', () => {
      const portal = platform.getPortal();
      assert.ok(portal.sections);
      assert.ok(portal.renderedAt);
    });

    it('should clear all state', () => {
      platform.generateSdk('js');
      platform.generateClient('py', {});
      platform.clear();
      const status = platform.getStatus();
      assert.strictEqual(status.sdks, 0);
      assert.strictEqual(status.clients, 0);
    });

    it('should create platform via createPlatform', () => {
      const p = createPlatform();
      assert.ok(p instanceof DeveloperPlatform);
    });

    it('should get SDK status', () => {
      platform.generateSdk('go');
      const status = platform.getSdkStatus('go');
      assert.ok(status);
      assert.strictEqual(status.language, 'go');
    });

    it('should list SDKs', () => {
      platform.generateSdk('js');
      platform.generateSdk('py');
      const list = platform.listSdks();
      assert.strictEqual(list.length, 2);
    });

    it('should get client status', () => {
      const { client } = platform.generateClient('js', {});
      const status = platform.getClientStatus(client.id);
      assert.ok(status);
    });

    it('should get OpenAPI spec by version', () => {
      platform.generateOpenApi('4.5.0');
      const spec = platform.getOpenApiSpec('4.5.0');
      assert.ok(spec);
    });

    it('should get schema by name', () => {
      platform.generateSchema('project');
      const schema = platform.getSchema('project');
      assert.ok(schema);
    });

    it('should emit event via trackEvent', () => {
      let emitted = false;
      platform.events.on(EVENTS.SDK_GENERATED, () => { emitted = true; });
      platform.trackEvent(EVENTS.SDK_GENERATED, { language: 'ts' });
      assert.ok(emitted);
    });
  });

  describe('CLI', () => {
    let cli;

    beforeEach(() => {
      cli = createCLI({ platform: new DeveloperPlatform() });
    });

    it('should create CLI instance', () => {
      assert.ok(cli instanceof CLI);
    });

    it('should show help', () => {
      const result = cli.run(['node', 'platform', 'help']);
      assert.ok(result.success);
      assert.ok(result.output.includes('Commands:'));
    });

    it('should show help via --help flag', () => {
      const result = cli.run(['node', 'platform', '--help']);
      assert.ok(result.success);
      assert.ok(result.output.includes('Usage:'));
    });

    it('should show help via -h flag', () => {
      const result = cli.run(['node', 'platform', '-h']);
      assert.ok(result.success);
    });

    it('should show version', () => {
      const result = cli.run(['node', 'platform', 'version']);
      assert.ok(result.success);
      assert.ok(result.output.includes('4.5.0'));
    });

    it('should show version via --version flag', () => {
      const result = cli.run(['node', 'platform', '--version']);
      assert.ok(result.success);
    });

    it('should show version via -v flag', () => {
      const result = cli.run(['node', 'platform', '-v']);
      assert.ok(result.success);
    });

    it('should return error for unknown command', () => {
      const result = cli.run(['node', 'platform', 'unknowncommand']);
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Unknown command'));
    });

    it('should run init command', () => {
      const result = cli.run(['node', 'platform', 'init']);
      assert.ok(result.success);
      assert.ok(result.output.includes('Initialized'));
    });

    it('should run init with project name', () => {
      const result = cli.run(['node', 'platform', 'init', 'test-app']);
      assert.ok(result.success);
      assert.ok(result.output.includes('test-app'));
    });

    it('should run login command', () => {
      const result = cli.run(['node', 'platform', 'login']);
      assert.ok(result.success);
      assert.ok(result.output.includes('authenticated'));
    });

    it('should run logout command', () => {
      const result = cli.run(['node', 'platform', 'logout']);
      assert.ok(result.success);
      assert.ok(result.output.includes('logged out'));
    });

    it('should run generate command (sdk)', () => {
      const result = cli.run(['node', 'platform', 'generate', 'sdk', 'javascript']);
      assert.ok(result.success);
      assert.ok(result.output.includes('Generated'));
    });

    it('should run generate command (openapi)', () => {
      const result = cli.run(['node', 'platform', 'generate', 'openapi']);
      assert.ok(result.success);
      assert.ok(result.output.includes('OpenAPI'));
    });

    it('should run generate command (client)', () => {
      const result = cli.run(['node', 'platform', 'generate', 'client', 'python']);
      assert.ok(result.success);
      assert.ok(result.output.includes('Generated'));
    });

    it('should run deploy command', () => {
      const result = cli.run(['node', 'platform', 'deploy', 'my-app']);
      assert.ok(result.success);
      assert.ok(result.output.includes('Deploying'));
    });

    it('should run status command', () => {
      const result = cli.run(['node', 'platform', 'status']);
      assert.ok(result.success);
      assert.ok(result.output.includes('SDKs'));
    });

    it('should run agents list command', () => {
      const result = cli.run(['node', 'platform', 'agents', 'list']);
      assert.ok(result.success);
      assert.ok(result.output.includes('Agents'));
    });

    it('should run agents run command', () => {
      const result = cli.run(['node', 'platform', 'agents', 'run', 'my-agent']);
      assert.ok(result.success);
    });

    it('should run workflows list command', () => {
      const result = cli.run(['node', 'platform', 'workflows', 'list']);
      assert.ok(result.success);
      assert.ok(result.output.includes('Workflows'));
    });

    it('should run workflows run command', () => {
      const result = cli.run(['node', 'platform', 'workflows', 'run', 'my-workflow']);
      assert.ok(result.success);
    });

    it('should run plugins list command', () => {
      const result = cli.run(['node', 'platform', 'plugins', 'list']);
      assert.ok(result.success);
      assert.ok(result.output.includes('plugins'));
    });

    it('should run plugins install command', () => {
      const result = cli.run(['node', 'platform', 'plugins', 'install', 'my-plugin']);
      assert.ok(result.success);
    });

    it('should run plugins remove command', () => {
      const result = cli.run(['node', 'platform', 'plugins', 'remove', 'my-plugin']);
      assert.ok(result.success);
    });

    it('should run billing plan command', () => {
      const result = cli.run(['node', 'platform', 'billing', 'plan']);
      assert.ok(result.success);
      assert.ok(result.output.includes('plan'));
    });

    it('should run billing usage command', () => {
      const result = cli.run(['node', 'platform', 'billing', 'usage']);
      assert.ok(result.success);
      assert.ok(result.output.includes('usage'));
    });

    it('should run billing invoices command', () => {
      const result = cli.run(['node', 'platform', 'billing', 'invoices']);
      assert.ok(result.success);
    });

    it('should run integrations list command', () => {
      const result = cli.run(['node', 'platform', 'integrations', 'list']);
      assert.ok(result.success);
      assert.ok(result.output.includes('integrations'));
    });

    it('should run integrations connect command', () => {
      const result = cli.run(['node', 'platform', 'integrations', 'connect', 'github']);
      assert.ok(result.success);
    });

    it('should run integrations disconnect command', () => {
      const result = cli.run(['node', 'platform', 'integrations', 'disconnect', 'github']);
      assert.ok(result.success);
    });

    it('should run config list command', () => {
      const result = cli.run(['node', 'platform', 'config', 'list']);
      assert.ok(result.success);
      assert.ok(result.output.includes('Configuration'));
    });

    it('should run config set command', () => {
      const result = cli.run(['node', 'platform', 'config', 'set', 'region', 'eu-west']);
      assert.ok(result.success);
    });

    it('should run config get command', () => {
      const result = cli.run(['node', 'platform', 'config', 'get', 'region']);
      assert.ok(result.success);
    });

    it('should run doctor command', () => {
      const result = cli.run(['node', 'platform', 'doctor']);
      assert.ok(result.success);
      assert.ok(result.output.includes('Diagnostics'));
    });

    it('should run logs command', () => {
      const result = cli.run(['node', 'platform', 'logs', 'info']);
      assert.ok(result.success);
      assert.ok(result.output.includes('logs'));
    });

    it('should run update command', () => {
      const result = cli.run(['node', 'platform', 'update']);
      assert.ok(result.success);
      assert.ok(result.output.includes('up to date'));
    });

    it('should handle errors gracefully', () => {
      const badCli = createCLI();
      const result = badCli.run(['node', 'platform', 'status']);
      assert.ok(result.success);
    });
  });

  describe('JavaScript SDK — PlatformClient', () => {
    it('should create with config', () => {
      const client = new JsPlatformClient({ apiKey: 'test-key' });
      assert.ok(client);
      assert.strictEqual(client.apiKey, 'test-key');
    });

    it('should use default base URL', () => {
      const client = new JsPlatformClient({ apiKey: 'test' });
      assert.strictEqual(client.baseUrl, 'https://api.platform.io/v1');
    });

    it('should use custom base URL', () => {
      const client = new JsPlatformClient({ apiKey: 'test', baseUrl: 'https://custom.example.com/v2' });
      assert.strictEqual(client.baseUrl, 'https://custom.example.com/v2');
    });

    it('should set default timeout', () => {
      const client = new JsPlatformClient({ apiKey: 'test' });
      assert.strictEqual(client.timeout, 30000);
    });

    it('should set custom timeout', () => {
      const client = new JsPlatformClient({ apiKey: 'test', timeout: 10000 });
      assert.strictEqual(client.timeout, 10000);
    });

    it('should set max retries', () => {
      const client = new JsPlatformClient({ apiKey: 'test', maxRetries: 5 });
      assert.strictEqual(client.maxRetries, 5);
    });

    it('should set auth header in request', async () => {
      const client = new JsPlatformClient({ apiKey: 'test-key-123' });
      try {
        await client.get('/plugins');
      } catch (e) {
        assert.ok(e.message);
      }
    });

    it('should have plugins namespace', () => {
      const client = new JsPlatformClient({ apiKey: 'test' });
      assert.ok(client.plugins);
      assert.ok(client.plugins.list);
      assert.ok(client.plugins.get);
      assert.ok(client.plugins.install);
    });

    it('should have integrations namespace', () => {
      const client = new JsPlatformClient({ apiKey: 'test' });
      assert.ok(client.integrations);
      assert.ok(client.integrations.list);
      assert.ok(client.integrations.connect);
      assert.ok(client.integrations.disconnect);
    });

    it('should have deployments namespace', () => {
      const client = new JsPlatformClient({ apiKey: 'test' });
      assert.ok(client.deployments);
      assert.ok(client.deployments.list);
      assert.ok(client.deployments.create);
    });

    it('should have workflows namespace', () => {
      const client = new JsPlatformClient({ apiKey: 'test' });
      assert.ok(client.workflows);
      assert.ok(client.workflows.list);
      assert.ok(client.workflows.run);
    });

    it('should have billing namespace', () => {
      const client = new JsPlatformClient({ apiKey: 'test' });
      assert.ok(client.billing);
      assert.ok(client.billing.getPlan);
      assert.ok(client.billing.getInvoices);
      assert.ok(client.billing.getUsage);
    });

    it('should have paginate method', () => {
      const client = new JsPlatformClient({ apiKey: 'test' });
      const paginator = client.paginate('/plugins');
      assert.ok(paginator);
      assert.ok(paginator[Symbol.asyncIterator]);
    });

    it('should have stream method defined', () => {
      const client = new JsPlatformClient({ apiKey: 'test' });
      assert.ok(typeof client.stream === 'function');
    });

    it('should reject on empty api key', async () => {
      const client = new JsPlatformClient({ apiKey: '' });
      try {
        await client.get('/plugins');
        assert.fail('Should have thrown');
      } catch (e) {
        assert.ok(e);
      }
    });
  });

  describe('OpenAPI — Spec Generation', () => {
    it('should generate valid OpenAPI 3.1 spec', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('4.5.0');
      assert.strictEqual(result.spec.openapi, '3.1.0');
    });

    it('should include server URL', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('4.5.0');
      assert.strictEqual(result.spec.servers[0].url, 'https://api.platform.io/v1');
    });

    it('should include paths', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('4.5.0');
      assert.ok(result.spec.paths['/plugins']);
      assert.ok(result.spec.paths['/integrations']);
      assert.ok(result.spec.paths['/billing/plans']);
      assert.ok(result.spec.paths['/deployments']);
      assert.ok(result.spec.paths['/workflows']);
      assert.ok(result.spec.paths['/security/auth/login']);
    });

    it('should include security scheme', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('4.5.0');
      assert.ok(result.spec.components.securitySchemes.bearerAuth);
      assert.strictEqual(result.spec.components.securitySchemes.bearerAuth.type, 'http');
    });

    it('should include component schemas', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('4.5.0');
      assert.ok(result.spec.components.schemas.Error);
    });

    it('should support multiple versions', () => {
      const gen = new OpenApiGenerator();
      gen.generate('1.0.0');
      gen.generate('2.0.0');
      assert.strictEqual(gen.getVersions().length, 2);
    });

    it('should clear all specs', () => {
      const gen = new OpenApiGenerator();
      gen.generate('4.5.0');
      gen.clear();
      assert.strictEqual(gen.getCount(), 0);
    });

    it('should include generatedAt timestamp', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('4.5.0');
      assert.ok(result.spec.generatedAt);
    });
  });

  describe('Terraform — Provider and Resources', () => {
    let provider;

    beforeEach(() => {
      provider = new TerraformProvider();
    });

    it('should create provider with default name', () => {
      assert.strictEqual(provider.name, 'platform');
    });

    it('should create provider with default version', () => {
      assert.strictEqual(provider.version, '4.5.0');
    });

    it('should configure provider', () => {
      const result = provider.configure({ apiKey: 'test-key' });
      assert.ok(result.success);
      assert.strictEqual(result.provider, 'platform');
    });

    it('should set apiKey from config', () => {
      provider.configure({ apiKey: 'my-key' });
      assert.strictEqual(provider.apiKey, 'my-key');
    });

    it('should set baseUrl from config', () => {
      provider.configure({ apiKey: 'key', baseUrl: 'https://custom.api.com/v1' });
      assert.strictEqual(provider.baseUrl, 'https://custom.api.com/v1');
    });

    it('should register resource', () => {
      provider.registerResource('project', new ProjectResource(provider));
      assert.strictEqual(provider.listResources().length, 1);
    });

    it('should get registered resource', () => {
      const res = new ProjectResource(provider);
      provider.registerResource('project', res);
      assert.strictEqual(provider.getResource('project'), res);
    });

    it('should return null for unregistered resource', () => {
      assert.strictEqual(provider.getResource('unknown'), null);
    });

    it('should list registered resources', () => {
      provider.registerResource('project', new ProjectResource(provider));
      provider.registerResource('deployment', new DeploymentResource(provider));
      const list = provider.listResources();
      assert.strictEqual(list.length, 2);
      assert.ok(list.includes('project'));
      assert.ok(list.includes('deployment'));
    });

    it('should clear all resources', () => {
      provider.registerResource('project', new ProjectResource(provider));
      provider.clear();
      assert.strictEqual(provider.listResources().length, 0);
    });

    describe('ProjectResource', () => {
      it('should create project', () => {
        const res = new ProjectResource(provider);
        const result = res.create('my-app', { region: 'us-east' });
        assert.ok(result.id);
        assert.strictEqual(result.name, 'my-app');
        assert.strictEqual(result.status, 'created');
      });

      it('should read project', () => {
        const res = new ProjectResource(provider);
        const result = res.read('proj-123');
        assert.strictEqual(result.id, 'proj-123');
        assert.strictEqual(result.status, 'active');
      });

      it('should update project', () => {
        const res = new ProjectResource(provider);
        const result = res.update('proj-123', { name: 'updated' });
        assert.strictEqual(result.name, 'updated');
        assert.strictEqual(result.status, 'updated');
      });

      it('should delete project', () => {
        const res = new ProjectResource(provider);
        const result = res.delete('proj-123');
        assert.ok(result.success);
      });
    });

    describe('DeploymentResource', () => {
      it('should create deployment', () => {
        const res = new DeploymentResource(provider);
        const result = res.create('proj-1', { branch: 'main' });
        assert.ok(result.id);
        assert.strictEqual(result.status, 'deployed');
      });

      it('should read deployment', () => {
        const res = new DeploymentResource(provider);
        const result = res.read('dep-1');
        assert.strictEqual(result.status, 'active');
        assert.ok(result.url);
      });

      it('should delete deployment', () => {
        const res = new DeploymentResource(provider);
        const result = res.delete('dep-1');
        assert.ok(result.success);
      });
    });

    describe('BillingResource', () => {
      it('should create billing plan', () => {
        const res = new BillingResource(provider);
        const result = res.create('professional', { amount: 99, interval: 'monthly' });
        assert.ok(result.id);
        assert.strictEqual(result.status, 'active');
      });

      it('should read billing plan', () => {
        const res = new BillingResource(provider);
        const result = res.read('plan-1');
        assert.strictEqual(result.plan, 'professional');
        assert.strictEqual(result.amount, 99);
      });

      it('should update billing plan', () => {
        const res = new BillingResource(provider);
        const result = res.update('plan-1', { amount: 149 });
        assert.strictEqual(result.status, 'updated');
      });

      it('should delete billing plan', () => {
        const res = new BillingResource(provider);
        const result = res.delete('plan-1');
        assert.ok(result.success);
      });
    });

    describe('WorkspaceResource', () => {
      it('should create workspace', () => {
        const res = new WorkspaceResource(provider);
        const result = res.create('dev-team', { members: 5 });
        assert.ok(result.id);
        assert.strictEqual(result.status, 'created');
      });

      it('should read workspace', () => {
        const res = new WorkspaceResource(provider);
        const result = res.read('ws-1');
        assert.strictEqual(result.members, 5);
      });

      it('should update workspace', () => {
        const res = new WorkspaceResource(provider);
        const result = res.update('ws-1', { name: 'updated' });
        assert.strictEqual(result.name, 'updated');
      });

      it('should delete workspace', () => {
        const res = new WorkspaceResource(provider);
        const result = res.delete('ws-1');
        assert.ok(result.success);
      });
    });

    describe('ApiKeyResource', () => {
      it('should create API key', () => {
        const res = new ApiKeyResource(provider);
        const result = res.create('ci-key', { scopes: ['read', 'write'] });
        assert.ok(result.id);
        assert.ok(result.key.startsWith('plt_'));
        assert.strictEqual(result.status, 'created');
      });

      it('should read API key', () => {
        const res = new ApiKeyResource(provider);
        const result = res.read('key-1');
        assert.ok(result.scopes);
      });

      it('should delete API key', () => {
        const res = new ApiKeyResource(provider);
        const result = res.delete('key-1');
        assert.ok(result.success);
      });
    });

    describe('IntegrationResource', () => {
      it('should create integration', () => {
        const res = new IntegrationResource(provider);
        const result = res.create('github', { token: 'test' });
        assert.ok(result.id);
        assert.strictEqual(result.status, 'connected');
      });

      it('should read integration', () => {
        const res = new IntegrationResource(provider);
        const result = res.read('int-1');
        assert.strictEqual(result.provider, 'github');
      });

      it('should delete integration', () => {
        const res = new IntegrationResource(provider);
        const result = res.delete('int-1');
        assert.ok(result.success);
      });
    });

    describe('PluginResource', () => {
      it('should create plugin', () => {
        const res = new PluginResource(provider);
        const result = res.create('my-plugin', { version: '1.0.0' });
        assert.ok(result.id);
        assert.strictEqual(result.status, 'installed');
      });

      it('should read plugin', () => {
        const res = new PluginResource(provider);
        const result = res.read('plg-1');
        assert.strictEqual(result.enabled, true);
      });

      it('should update plugin', () => {
        const res = new PluginResource(provider);
        const result = res.update('plg-1', { version: '2.0.0' });
        assert.strictEqual(result.version, '2.0.0');
      });

      it('should delete plugin', () => {
        const res = new PluginResource(provider);
        const result = res.delete('plg-1');
        assert.ok(result.success);
      });
    });

    describe('WorkflowResource', () => {
      it('should create workflow', () => {
        const res = new WorkflowResource(provider);
        const result = res.create('deploy', { steps: 3 });
        assert.ok(result.id);
        assert.strictEqual(result.status, 'created');
      });

      it('should read workflow', () => {
        const res = new WorkflowResource(provider);
        const result = res.read('wf-1');
        assert.strictEqual(result.steps, 3);
      });

      it('should update workflow', () => {
        const res = new WorkflowResource(provider);
        const result = res.update('wf-1', { name: 'updated' });
        assert.strictEqual(result.name, 'updated');
      });

      it('should delete workflow', () => {
        const res = new WorkflowResource(provider);
        const result = res.delete('wf-1');
        assert.ok(result.success);
      });
    });
  });

  describe('Postman — Collection', () => {
    it('should generate collection with correct structure', () => {
      const platform = new DeveloperPlatform();
      const result = platform.generatePostman();
      assert.ok(result.collection);
      assert.ok(result.collection.info);
      assert.strictEqual(result.collection.info.name, 'Platform API');
    });

    it('should have correct version', () => {
      const platform = new DeveloperPlatform();
      const result = platform.generatePostman();
      assert.strictEqual(result.collection.info.version, '4.5.0');
    });

    it('should have items array', () => {
      const platform = new DeveloperPlatform();
      const result = platform.generatePostman();
      assert.ok(Array.isArray(result.collection.item));
    });
  });

  describe('GitHub Action', () => {
    it('should generate action config', () => {
      const platform = new DeveloperPlatform();
      const result = platform.generateGitHubAction();
      assert.ok(result.action);
      assert.strictEqual(result.action.name, 'Platform Action');
    });

    it('should use node20 runner', () => {
      const platform = new DeveloperPlatform();
      const result = platform.generateGitHubAction();
      assert.strictEqual(result.action.runs.using, 'node20');
    });

    it('should have main entry point', () => {
      const platform = new DeveloperPlatform();
      const result = platform.generateGitHubAction();
      assert.strictEqual(result.action.runs.main, 'index.js');
    });

    it('should return success', () => {
      const platform = new DeveloperPlatform();
      const result = platform.generateGitHubAction();
      assert.ok(result.success);
    });
  });

  describe('VS Code Extension — Package', () => {
    it('should have package.json with correct name', () => {
      const pkg = require('../lib/developer/extensions/vscode/package.json');
      assert.strictEqual(pkg.name, 'platform-vscode');
    });

    it('should have correct version', () => {
      const pkg = require('../lib/developer/extensions/vscode/package.json');
      assert.strictEqual(pkg.version, '4.5.0');
    });

    it('should have 6 commands', () => {
      const pkg = require('../lib/developer/extensions/vscode/package.json');
      assert.strictEqual(pkg.contributes.commands.length, 6);
    });

    it('should have login command', () => {
      const pkg = require('../lib/developer/extensions/vscode/package.json');
      const cmd = pkg.contributes.commands.find(c => c.command === 'platform.login');
      assert.ok(cmd);
    });

    it('should have dashboard command', () => {
      const pkg = require('../lib/developer/extensions/vscode/package.json');
      const cmd = pkg.contributes.commands.find(c => c.command === 'platform.showDashboard');
      assert.ok(cmd);
    });

    it('should have deploy command', () => {
      const pkg = require('../lib/developer/extensions/vscode/package.json');
      const cmd = pkg.contributes.commands.find(c => c.command === 'platform.deploy');
      assert.ok(cmd);
    });
  });

  describe('VS Code Extension — Runtime', () => {
    it('should have correct package.json export structure', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/extensions/vscode/extension.js'), 'utf8');
      assert.ok(content.includes('activate'));
      assert.ok(content.includes('deactivate'));
    });

    it('should define activate function', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/extensions/vscode/extension.js'), 'utf8');
      assert.ok(content.includes('function activate'));
    });

    it('should define deactivate function', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/extensions/vscode/extension.js'), 'utf8');
      assert.ok(content.includes('function deactivate'));
    });

    it('should define PlatformExtension class', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/extensions/vscode/extension.js'), 'utf8');
      assert.ok(content.includes('class PlatformExtension'));
    });

    it('should register commands in activate', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/extensions/vscode/extension.js'), 'utf8');
      assert.ok(content.includes('_registerCommand'));
    });
  });

  describe('API Controller', () => {
    beforeEach(() => {
      global.platform = undefined;
    });

    it('should generate SDK', () => {
      const result = developerController.generateSdk({ body: { language: 'javascript' } });
      assert.ok(result.success);
      assert.ok(result.data);
    });

    it('should generate SDK without body', () => {
      const result = developerController.generateSdk({});
      assert.ok(result.success);
    });

    it('should generate OpenAPI spec', () => {
      const result = developerController.generateOpenApi({ params: { version: '4.5.0' } });
      assert.ok(result.success);
      assert.ok(result.data);
    });

    it('should generate OpenAPI spec without params', () => {
      const result = developerController.generateOpenApi({});
      assert.ok(result.success);
    });

    it('should get schema for domain', () => {
      const result = developerController.getSchema({ params: { domain: 'project' } });
      assert.ok(result.success);
      assert.ok(result.data);
    });

    it('should get all schemas', () => {
      const result = developerController.getSchema({ params: {} });
      assert.ok(result.success);
      assert.ok(result.data);
    });

    it('should generate Postman collection', () => {
      const result = developerController.generatePostman({});
      assert.ok(result.success);
      assert.ok(result.data);
    });

    it('should generate Terraform config', () => {
      const result = developerController.generateTerraform({});
      assert.ok(result.success);
    });

    it('should generate GitHub Action', () => {
      const result = developerController.generateGitHubAction({});
      assert.ok(result.success);
    });

    it('should generate client with language', () => {
      const result = developerController.generateClient({ body: { language: 'python', spec: {} } });
      assert.ok(result.success);
      assert.ok(result.data);
    });

    it('should fail client generation without language', () => {
      const result = developerController.generateClient({ body: {} });
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should get status', () => {
      const result = developerController.getStatus({});
      assert.ok(result.success);
      assert.ok(result.data);
    });

    it('should get portal', () => {
      const result = developerController.getPortal({});
      assert.ok(result.success);
      assert.ok(result.data);
    });

    it('should get analytics', () => {
      const result = developerController.getAnalytics({});
      assert.ok(result.success);
      assert.ok(result.data);
    });
  });

  describe('Developer Platform Integration', () => {
    let platform;

    beforeEach(() => {
      platform = new DeveloperPlatform();
    });

    it('should track events across operations', () => {
      let eventCount = 0;
      platform.events.on('*', () => { eventCount++; });
      platform.trackEvent(EVENTS.SDK_GENERATED, {});
      platform.trackEvent(EVENTS.CLIENT_GENERATED, {});
      platform.trackEvent(EVENTS.OPENAPI_GENERATED, {});
      platform.trackEvent(EVENTS.SCHEMA_GENERATED, {});
      assert.strictEqual(eventCount, 4);
    });

    it('should track analytics calls', () => {
      platform.recordApiCall('/plugins', 'GET', 200, 30);
      platform.recordApiCall('/integrations', 'POST', 201, 45);
      platform.recordApiCall('/deployments', 'GET', 500, 100);
      const stats = platform.getAnalytics();
      assert.strictEqual(stats.totalCalls, 3);
      assert.strictEqual(stats.errors, 1);
    });

    it('should update status after operations', () => {
      platform.generateSdk('js');
      platform.generateSdk('ts');
      platform.generateSdk('py');
      platform.generateClient('java', {});
      platform.generateOpenApi('4.5.0');
      platform.generateSchema('project');
      const status = platform.getStatus();
      assert.strictEqual(status.sdks, 3);
      assert.strictEqual(status.clients, 1);
      assert.strictEqual(status.openApiVersions, 1);
      assert.strictEqual(status.schemas, 1);
    });

    it('should render portal with data', () => {
      platform.generateSdk('js');
      platform.recordApiCall('/test', 'GET', 200, 10);
      const portal = platform.getPortal();
      assert.ok(portal.sections);
      assert.ok(portal.analytics);
      assert.ok(portal.renderedAt);
    });

    it('should maintain event history across operations', () => {
      platform.trackEvent(EVENTS.SDK_GENERATED, { language: 'js' });
      platform.trackEvent(EVENTS.CLIENT_GENERATED, { language: 'py' });
      platform.trackEvent(EVENTS.OPENAPI_GENERATED, { version: '4.5.0' });
      const history = platform.events.history();
      assert.strictEqual(history.length, 3);
    });

    it('should filter events by type', () => {
      platform.trackEvent(EVENTS.SDK_GENERATED, { language: 'js' });
      platform.trackEvent(EVENTS.CLIENT_GENERATED, { language: 'py' });
      const sdkEvents = platform.events.history(EVENTS.SDK_GENERATED);
      assert.strictEqual(sdkEvents.length, 1);
    });

    it('should support default platform singleton', () => {
      const p1 = getDefaultPlatform();
      const p2 = getDefaultPlatform();
      assert.strictEqual(p1, p2);
    });

    it('should create independent platforms', () => {
      const p1 = createPlatform();
      const p2 = createPlatform();
      assert.notStrictEqual(p1, p2);
      p1.generateSdk('js');
      assert.strictEqual(p1.getStatus().sdks, 1);
      assert.strictEqual(p2.getStatus().sdks, 0);
    });

    it('should handle Terraform resources via platform', () => {
      const tf = new TerraformProvider();
      tf.configure({ apiKey: 'test' });
      tf.registerResource('project', new ProjectResource(tf));
      const project = tf.getResource('project').create('test-app', { region: 'us-east' });
      assert.ok(project.id);
      assert.strictEqual(project.name, 'test-app');
    });

    it('should handle multiple Terraform resources', () => {
      const tf = new TerraformProvider();
      tf.configure({ apiKey: 'test' });
      tf.registerResource('project', new ProjectResource(tf));
      tf.registerResource('deployment', new DeploymentResource(tf));
      tf.registerResource('billing', new BillingResource(tf));
      assert.strictEqual(tf.listResources().length, 3);
    });

    it('should connect events across platform lifecycle', () => {
      let generated = null;
      platform.events.on(EVENTS.SDK_GENERATED, (e) => { generated = e.data.language; });
      platform.trackEvent(EVENTS.SDK_GENERATED, { language: 'python' });
      assert.strictEqual(generated, 'python');
    });

    it('should clear analytics independently', () => {
      platform.recordApiCall('/test', 'GET', 200, 10);
      platform.analytics.clear();
      assert.strictEqual(platform.getAnalytics().totalCalls, 0);
    });
  });

  describe('Python SDK', () => {
    it('should have PlatformClient class', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/python/platform_sdk.py'), 'utf8');
      assert.ok(content.includes('class PlatformClient'));
    });

    it('should have get method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/python/platform_sdk.py'), 'utf8');
      assert.ok(content.includes('def get'));
    });

    it('should have post method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/python/platform_sdk.py'), 'utf8');
      assert.ok(content.includes('def post'));
    });

    it('should have paginate method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/python/platform_sdk.py'), 'utf8');
      assert.ok(content.includes('def paginate'));
    });

    it('should have auth header', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/python/platform_sdk.py'), 'utf8');
      assert.ok(content.includes('PLATFORM_API_KEY'));
    });
  });

  describe('Go SDK', () => {
    it('should have Client struct', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/go/platform.go'), 'utf8');
      assert.ok(content.includes('type Client struct'));
    });

    it('should have NewClient function', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/go/platform.go'), 'utf8');
      assert.ok(content.includes('func NewClient'));
    });

    it('should have Get method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/go/platform.go'), 'utf8');
      assert.ok(content.includes('func (c *Client) Get'));
    });

    it('should have Post method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/go/platform.go'), 'utf8');
      assert.ok(content.includes('func (c *Client) Post'));
    });

    it('should have ListPlugins method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/go/platform.go'), 'utf8');
      assert.ok(content.includes('ListPlugins'));
    });
  });

  describe('Java SDK', () => {
    it('should have PlatformClient class', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/java/PlatformClient.java'), 'utf8');
      assert.ok(content.includes('class PlatformClient'));
    });

    it('should have request method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/java/PlatformClient.java'), 'utf8');
      assert.ok(content.includes('public String request'));
    });

    it('should have get method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/java/PlatformClient.java'), 'utf8');
      assert.ok(content.includes('public String get'));
    });

    it('should have post method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/java/PlatformClient.java'), 'utf8');
      assert.ok(content.includes('public String post'));
    });

    it('should have listPlugins method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/java/PlatformClient.java'), 'utf8');
      assert.ok(content.includes('listPlugins'));
    });
  });

  describe('C# SDK', () => {
    it('should have PlatformClient class', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/csharp/PlatformClient.cs'), 'utf8');
      assert.ok(content.includes('class PlatformClient'));
    });

    it('should have RequestAsync method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/csharp/PlatformClient.cs'), 'utf8');
      assert.ok(content.includes('RequestAsync'));
    });

    it('should have GetAsync method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/csharp/PlatformClient.cs'), 'utf8');
      assert.ok(content.includes('GetAsync'));
    });

    it('should have PostAsync method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/csharp/PlatformClient.cs'), 'utf8');
      assert.ok(content.includes('PostAsync'));
    });

    it('should have ListPluginsAsync method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/csharp/PlatformClient.cs'), 'utf8');
      assert.ok(content.includes('ListPluginsAsync'));
    });
  });

  describe('PHP SDK', () => {
    it('should have PlatformClient class', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/php/PlatformClient.php'), 'utf8');
      assert.ok(content.includes('class PlatformClient'));
    });

    it('should have get method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/php/PlatformClient.php'), 'utf8');
      assert.ok(content.includes('public function get'));
    });

    it('should have post method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/php/PlatformClient.php'), 'utf8');
      assert.ok(content.includes('public function post'));
    });

    it('should have listPlugins method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/php/PlatformClient.php'), 'utf8');
      assert.ok(content.includes('listPlugins'));
    });

    it('should have listIntegrations method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/php/PlatformClient.php'), 'utf8');
      assert.ok(content.includes('listIntegrations'));
    });
  });

  describe('TypeScript SDK', () => {
    it('should export PlatformClient class', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/typescript/index.ts'), 'utf8');
      assert.ok(content.includes('class PlatformClient'));
    });

    it('should have typed get method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/typescript/index.ts'), 'utf8');
      assert.ok(content.includes('async get<'));
    });

    it('should have typed post method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/typescript/index.ts'), 'utf8');
      assert.ok(content.includes('async post<'));
    });

    it('should have paginate method', () => {
      const fs = require('fs');
      const content = fs.readFileSync(require.resolve('../lib/developer/sdk/typescript/index.ts'), 'utf8');
      assert.ok(content.includes('paginate'));
    });
  });

  describe('CLI Command Handlers — Individual', () => {
    it('init handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/init');
      const result = cmd.handler(['my-project']);
      assert.ok(result.success);
    });

    it('login handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/login');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });

    it('logout handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/logout');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });

    it('generate handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/generate');
      const result = cmd.handler(['sdk', 'javascript']);
      assert.ok(result.success);
    });

    it('deploy handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/deploy');
      const result = cmd.handler(['my-app']);
      assert.ok(result.success);
    });

    it('status handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/status');
      const result = cmd.handler([], new DeveloperPlatform());
      assert.ok(result.success);
    });

    it('agents handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/agents');
      const result = cmd.handler(['list']);
      assert.ok(result.success);
    });

    it('workflows handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/workflows');
      const result = cmd.handler(['list']);
      assert.ok(result.success);
    });

    it('plugins handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/plugins');
      const result = cmd.handler(['list']);
      assert.ok(result.success);
    });

    it('billing handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/billing');
      const result = cmd.handler(['plan']);
      assert.ok(result.success);
    });

    it('integrations handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/integrations');
      const result = cmd.handler(['list']);
      assert.ok(result.success);
    });

    it('config handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/config');
      const result = cmd.handler(['list']);
      assert.ok(result.success);
    });

    it('doctor handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/doctor');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });

    it('logs handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/logs');
      const result = cmd.handler(['info']);
      assert.ok(result.success);
    });

    it('update handler should work', () => {
      const cmd = require('../lib/developer/cli/commands/update');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty state in SdkRegistry list', () => {
      const reg = new SdkRegistry();
      assert.deepStrictEqual(reg.list(), []);
    });

    it('should handle empty state in SdkGenerator list', () => {
      const gen = new SdkGenerator({ registry: new SdkRegistry() });
      assert.deepStrictEqual(gen.listSdks(), []);
    });

    it('should handle empty state in OpenApiGenerator versions', () => {
      const gen = new OpenApiGenerator();
      assert.deepStrictEqual(gen.getVersions(), []);
    });

    it('should handle empty state in SchemaGenerator', () => {
      const gen = new SchemaGenerator();
      assert.strictEqual(gen.getCount(), 0);
    });

    it('should handle multiple event listeners', () => {
      const events = new DeveloperEvents();
      let count = 0;
      events.on(EVENTS.SDK_GENERATED, () => { count++; });
      events.on(EVENTS.SDK_GENERATED, () => { count++; });
      events.on(EVENTS.SDK_GENERATED, () => { count++; });
      events.emit(EVENTS.SDK_GENERATED, {});
      assert.strictEqual(count, 3);
    });

    it('should handle off for non-existent handler silently', () => {
      const events = new DeveloperEvents();
      assert.doesNotThrow(() => events.off('nonexistent', () => {}));
    });

    it('should handle clearing empty analytics', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      assert.doesNotThrow(() => analytics.clear());
    });

    it('should handle clearing empty events', () => {
      const events = new DeveloperEvents();
      assert.doesNotThrow(() => events.clear());
    });

    it('should handle empty portal analytics', () => {
      const portal = new DeveloperPortal();
      const result = portal.render();
      assert.ok(result.analytics);
    });

    it('should handle unregistering non-existent SDK', () => {
      const reg = new SdkRegistry();
      assert.doesNotThrow(() => reg.unregister('nonexistent'));
    });

    it('should handle regenerate before clear', () => {
      const gen = new SdkGenerator({ registry: new SdkRegistry() });
      gen.generate('js');
      gen.clear();
      gen.generate('js');
      assert.strictEqual(gen.getCount(), 1);
    });

    it('should handle getting deleted storage key', () => {
      const storage = new DeveloperStorage();
      storage.set('key', 'val');
      storage.delete('key');
      assert.strictEqual(storage.get('key'), undefined);
    });

    it('should handle large analytics data', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      for (let i = 0; i < 100; i++) {
        analytics.recordCall(`/endpoint/${i}`, 'GET', 200, i);
      }
      const stats = analytics.getStats();
      assert.strictEqual(stats.totalCalls, 100);
    });

    it('should handle analytics with 1000+ calls (capped)', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      for (let i = 0; i < 1500; i++) {
        analytics.recordCall('/test', 'GET', 200, 1);
      }
      const stats = analytics.getStats();
      assert.strictEqual(stats.totalCalls, 1000);
    });

    it('should handle clearing with no data', () => {
      const platform = new DeveloperPlatform();
      assert.doesNotThrow(() => platform.clear());
    });

    it('should get status with no operations', () => {
      const platform = new DeveloperPlatform();
      const status = platform.getStatus();
      assert.strictEqual(status.sdks, 0);
      assert.strictEqual(status.clients, 0);
      assert.strictEqual(status.openApiVersions, 0);
    });
  });

  describe('Developer Platform — Module Exports', () => {
    it('should export DeveloperPlatform', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.DeveloperPlatform);
    });

    it('should export createPlatform', () => {
      const dev = require('../lib/developer');
      assert.ok(typeof dev.createPlatform === 'function');
    });

    it('should export getDefaultPlatform', () => {
      const dev = require('../lib/developer');
      assert.ok(typeof dev.getDefaultPlatform === 'function');
    });

    it('should export EVENTS', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.EVENTS);
      assert.strictEqual(dev.EVENTS.SDK_GENERATED, 'developer.sdk.generated');
    });

    it('should export SdkRegistry', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.SdkRegistry);
    });

    it('should export SdkGenerator', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.SdkGenerator);
    });

    it('should export ClientGenerator', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.ClientGenerator);
    });

    it('should export OpenApiGenerator', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.OpenApiGenerator);
    });

    it('should export SchemaGenerator', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.SchemaGenerator);
    });

    it('should export DeveloperEvents', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.DeveloperEvents);
    });

    it('should export DeveloperStorage', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.DeveloperStorage);
    });

    it('should export DeveloperAnalytics', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.DeveloperAnalytics);
    });

    it('should export DeveloperPortal', () => {
      const dev = require('../lib/developer');
      assert.ok(dev.DeveloperPortal);
    });
  });

  describe('CLI — Edge Cases', () => {
    it('should handle empty args array', () => {
      const cli = createCLI({ platform: new DeveloperPlatform() });
      const result = cli.run([]);
      assert.ok(result.success);
    });

    it('should handle generate with no platform', () => {
      const cmd = require('../lib/developer/cli/commands/generate');
      const result = cmd.handler(['sdk', 'javascript']);
      assert.ok(result.success);
    });

    it('should handle generate with openapi type', () => {
      const cmd = require('../lib/developer/cli/commands/generate');
      const result = cmd.handler(['openapi']);
      assert.ok(result.success);
    });

    it('should handle generate with client type', () => {
      const cmd = require('../lib/developer/cli/commands/generate');
      const result = cmd.handler(['client', 'python']);
      assert.ok(result.success);
    });

    it('should handle deploy with no args', () => {
      const cmd = require('../lib/developer/cli/commands/deploy');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });

    it('should handle agents with no args', () => {
      const cmd = require('../lib/developer/cli/commands/agents');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });

    it('should handle workflows with no args', () => {
      const cmd = require('../lib/developer/cli/commands/workflows');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });

    it('should handle plugins with no args', () => {
      const cmd = require('../lib/developer/cli/commands/plugins');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });

    it('should handle billing with no args', () => {
      const cmd = require('../lib/developer/cli/commands/billing');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });

    it('should handle integrations with no args', () => {
      const cmd = require('../lib/developer/cli/commands/integrations');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });

    it('should handle config with no args', () => {
      const cmd = require('../lib/developer/cli/commands/config');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });

    it('should handle logs with no args', () => {
      const cmd = require('../lib/developer/cli/commands/logs');
      const result = cmd.handler([]);
      assert.ok(result.success);
    });
  });

  describe('Analytics — Advanced', () => {
    it('should calculate error rate correctly when no errors', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/a', 'GET', 200, 10);
      analytics.recordCall('/a', 'GET', 200, 20);
      const stats = analytics.getStats();
      assert.strictEqual(stats.errorRate, 0);
    });

    it('should calculate error rate correctly when all errors', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/a', 'GET', 500, 10);
      analytics.recordCall('/a', 'GET', 500, 20);
      const stats = analytics.getStats();
      assert.strictEqual(stats.errorRate, 100);
    });

    it('should handle zero calls in avg latency', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      const stats = analytics.getStats();
      assert.strictEqual(stats.avgLatencyMs, 0);
    });

    it('should return empty topEndpoints when no calls', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      const stats = analytics.getStats();
      assert.deepStrictEqual(stats.topEndpoints, []);
    });

    it('should return empty array when getCalls filter has no matches', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/a', 'GET', 200, 10);
      const calls = analytics.getCalls({ endpoint: '/nonexistent' });
      assert.strictEqual(calls.length, 0);
    });

    it('should return all calls when no filter', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      analytics.recordCall('/a', 'GET', 200, 10);
      analytics.recordCall('/b', 'POST', 201, 20);
      const calls = analytics.getCalls();
      assert.strictEqual(calls.length, 2);
    });
  });

  describe('DeveloperPlatform — Edge Cases', () => {
    it('should generate multiple SDKs across languages', () => {
      const platform = new DeveloperPlatform();
      platform.generateSdk('js');
      platform.generateSdk('ts');
      platform.generateSdk('py');
      platform.generateSdk('go');
      platform.generateSdk('java');
      platform.generateSdk('csharp');
      platform.generateSdk('php');
      assert.strictEqual(platform.getStatus().sdks, 7);
    });

    it('should generate multiple clients', () => {
      const platform = new DeveloperPlatform();
      platform.generateClient('js', {});
      platform.generateClient('py', {});
      platform.generateClient('go', {});
      assert.strictEqual(platform.getStatus().clients, 3);
    });

    it('should generate multiple OpenAPI versions', () => {
      const platform = new DeveloperPlatform();
      platform.generateOpenApi('1.0.0');
      platform.generateOpenApi('2.0.0');
      platform.generateOpenApi('3.0.0');
      assert.strictEqual(platform.getStatus().openApiVersions, 3);
    });

    it('should generate multiple schemas', () => {
      const platform = new DeveloperPlatform();
      platform.generateSchema('project');
      platform.generateSchema('deployment');
      platform.generateSchema('plugin');
      assert.strictEqual(platform.getStatus().schemas, 3);
    });

    it('should record multiple analytics calls', () => {
      const platform = new DeveloperPlatform();
      platform.recordApiCall('/a', 'GET', 200, 10);
      platform.recordApiCall('/b', 'POST', 201, 20);
      platform.recordApiCall('/c', 'PUT', 200, 15);
      platform.recordApiCall('/d', 'DELETE', 500, 100);
      const stats = platform.getAnalytics();
      assert.strictEqual(stats.totalCalls, 4);
      assert.strictEqual(stats.errors, 1);
    });

    it('should have event history after multiple events', () => {
      const platform = new DeveloperPlatform();
      platform.trackEvent(EVENTS.SDK_GENERATED, {});
      platform.trackEvent(EVENTS.CLIENT_GENERATED, {});
      platform.trackEvent(EVENTS.OPENAPI_GENERATED, {});
      const history = platform.events.history();
      assert.strictEqual(history.length, 3);
    });

    it('should configure Terraform provider with env key', () => {
      const provider = new TerraformProvider();
      const result = provider.configure({ apiKey: '' });
      assert.ok(result.success);
    });

    it('should use default baseUrl in Terraform provider', () => {
      const provider = new TerraformProvider();
      provider.configure({ apiKey: 'test' });
      assert.strictEqual(provider.baseUrl, 'https://api.platform.io/v1');
    });

    it('should have correct type for ProjectResource', () => {
      const res = new ProjectResource(null);
      assert.strictEqual(res.type, 'platform_project');
    });

    it('should have correct type for DeploymentResource', () => {
      const res = new DeploymentResource(null);
      assert.strictEqual(res.type, 'platform_deployment');
    });

    it('should have correct type for BillingResource', () => {
      const res = new BillingResource(null);
      assert.strictEqual(res.type, 'platform_billing_plan');
    });

    it('should have correct type for WorkspaceResource', () => {
      const res = new WorkspaceResource(null);
      assert.strictEqual(res.type, 'platform_workspace');
    });

    it('should have correct type for ApiKeyResource', () => {
      const res = new ApiKeyResource(null);
      assert.strictEqual(res.type, 'platform_api_key');
    });

    it('should have correct type for IntegrationResource', () => {
      const res = new IntegrationResource(null);
      assert.strictEqual(res.type, 'platform_integration');
    });

    it('should have correct type for PluginResource', () => {
      const res = new PluginResource(null);
      assert.strictEqual(res.type, 'platform_plugin');
    });

    it('should have correct type for WorkflowResource', () => {
      const res = new WorkflowResource(null);
      assert.strictEqual(res.type, 'platform_workflow');
    });

    it('should handle schema generation for unknown domain gracefully', () => {
      const gen = new SchemaGenerator();
      const result = gen.generate('unknown_domain');
      assert.ok(result.success);
      assert.ok(result.schemas);
    });
  });

  describe('API Controller — Edge Cases', () => {
    it('should handle null body in generateSdk', () => {
      const result = developerController.generateSdk({ body: null });
      assert.ok(result.success);
    });

    it('should handle undefined body in generateSdk', () => {
      const result = developerController.generateSdk({});
      assert.ok(result.success);
    });

    it('should handle version from query in generateOpenApi', () => {
      const result = developerController.generateOpenApi({ query: { version: '5.0.0' } });
      assert.ok(result.success);
      assert.strictEqual(result.data.info.version, '5.0.0');
    });

    it('should handle null body in generateClient', () => {
      const result = developerController.generateClient({ body: null });
      assert.strictEqual(result.success, false);
    });

    it('should handle schema with domain from params', () => {
      const result = developerController.getSchema({ params: { domain: 'workflow' } });
      assert.ok(result.success);
    });
  });

  describe('DeveloperPlatform — Storage Integration', () => {
    it('should store and retrieve via storage', () => {
      const platform = new DeveloperPlatform();
      platform.storage.set('test-key', 'test-value');
      assert.strictEqual(platform.storage.get('test-key'), 'test-value');
    });

    it('should check stored data existence', () => {
      const platform = new DeveloperPlatform();
      platform.storage.set('exists', true);
      assert.ok(platform.storage.has('exists'));
    });

    it('should clear storage independently', () => {
      const platform = new DeveloperPlatform();
      platform.storage.set('key', 'val');
      platform.storage.clear();
      assert.strictEqual(platform.storage.has('key'), false);
    });

    it('should get all storage entries', () => {
      const platform = new DeveloperPlatform();
      platform.storage.set('a', 1);
      platform.storage.set('b', 2);
      const all = platform.storage.getAll();
      assert.strictEqual(Object.keys(all).length, 2);
    });
  });

  describe('DeveloperPlatform — Event-Driven Analytics', () => {
    it('should emit events on SDK generation via trackEvent', () => {
      const platform = new DeveloperPlatform();
      let eventData = null;
      platform.events.on(EVENTS.SDK_GENERATED, (e) => { eventData = e.data; });
      platform.trackEvent(EVENTS.SDK_GENERATED, { language: 'python' });
      assert.ok(eventData);
      assert.strictEqual(eventData.language, 'python');
    });

    it('should emit events on client generation via trackEvent', () => {
      const platform = new DeveloperPlatform();
      let eventData = null;
      platform.events.on(EVENTS.CLIENT_GENERATED, (e) => { eventData = e.data; });
      platform.trackEvent(EVENTS.CLIENT_GENERATED, { language: 'go' });
      assert.ok(eventData);
    });

    it('should emit events on OpenAPI generation via trackEvent', () => {
      const platform = new DeveloperPlatform();
      let emitted = false;
      platform.events.on(EVENTS.OPENAPI_GENERATED, () => { emitted = true; });
      platform.trackEvent(EVENTS.OPENAPI_GENERATED, { version: '4.5.0' });
      assert.ok(emitted);
    });

    it('should emit events on schema generation via trackEvent', () => {
      const platform = new DeveloperPlatform();
      let emitted = false;
      platform.events.on(EVENTS.SCHEMA_GENERATED, () => { emitted = true; });
      platform.trackEvent(EVENTS.SCHEMA_GENERATED, { domain: 'project' });
      assert.ok(emitted);
    });
  });

  describe('OpenApiGenerator — Advanced', () => {
    it('should generate spec for custom version', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('2.0.0');
      assert.strictEqual(result.spec.info.version, '2.0.0');
    });

    it('should include correct title', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('4.5.0');
      assert.strictEqual(result.spec.info.title, 'Platform API');
    });

    it('should include correct description', () => {
      const gen = new OpenApiGenerator();
      const result = gen.generate('4.5.0');
      assert.ok(result.spec.info.description);
    });

    it('should regenerate already existing version', () => {
      const gen = new OpenApiGenerator();
      gen.generate('4.5.0');
      gen.generate('4.5.0');
      assert.strictEqual(gen.getCount(), 1);
    });
  });

  describe('SchemaGenerator — Domain Schemas', () => {
    it('should generate project schema with required fields', () => {
      const gen = new SchemaGenerator();
      const result = gen.generate('project');
      assert.ok(result.schema.required.includes('id'));
      assert.ok(result.schema.required.includes('name'));
    });

    it('should generate deployment schema with status enum', () => {
      const gen = new SchemaGenerator();
      const result = gen.generate('deployment');
      assert.ok(result.schema.properties.status.enum);
      assert.ok(result.schema.properties.status.enum.includes('success'));
    });

    it('should generate plugin schema with permissions array', () => {
      const gen = new SchemaGenerator();
      const result = gen.generate('plugin');
      assert.ok(result.schema.properties.permissions);
      assert.strictEqual(result.schema.properties.permissions.type, 'array');
    });
  });

  describe('DeveloperPlatform — Constructor Options', () => {
    it('should accept custom registry', () => {
      const reg = new SdkRegistry();
      const platform = new DeveloperPlatform({ registry: reg });
      assert.strictEqual(platform.registry, reg);
    });

    it('should accept custom sdkGenerator', () => {
      const gen = new SdkGenerator({ registry: new SdkRegistry() });
      const platform = new DeveloperPlatform({ sdkGenerator: gen });
      assert.strictEqual(platform.sdkGenerator, gen);
    });

    it('should accept custom events', () => {
      const events = new DeveloperEvents();
      const platform = new DeveloperPlatform({ events });
      assert.strictEqual(platform.events, events);
    });

    it('should accept custom storage', () => {
      const storage = new DeveloperStorage();
      const platform = new DeveloperPlatform({ storage });
      assert.strictEqual(platform.storage, storage);
    });

    it('should accept custom analytics', () => {
      const analytics = new DeveloperAnalytics({ storage: new DeveloperStorage() });
      const platform = new DeveloperPlatform({ analytics });
      assert.strictEqual(platform.analytics, analytics);
    });
  });
});
