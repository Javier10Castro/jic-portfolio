class Plugin {
  constructor(manifest) {
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.manifest = manifest;
    this._hooks = {};
    this._commands = {};
    this._widgets = {};
    this._apiExtensions = {};
    this._workflowExtensions = {};
    this._agentExtensions = {};
    this._storage = {};
  }

  registerHook(hook, handler) {
    if (!this._hooks[hook]) this._hooks[hook] = [];
    this._hooks[hook].push(handler);
  }

  getHooks() { return { ...this._hooks }; }

  registerCommand(name, handler, options = {}) {
    this._commands[name] = { handler, description: options.description || '', usage: options.usage || '' };
  }

  getCommands() { return { ...this._commands }; }

  registerWidget(name, renderer, options = {}) {
    this._widgets[name] = { renderer, title: options.title || name, width: options.width || 1, height: options.height || 1 };
  }

  getWidgets() { return { ...this._widgets }; }

  extendAPI(path, handler, method = 'GET') {
    if (!this._apiExtensions[path]) this._apiExtensions[path] = {};
    this._apiExtensions[path][method] = handler;
  }

  getAPIExtensions() { return { ...this._apiExtensions }; }

  extendWorkflow(type, handler) {
    if (!this._workflowExtensions[type]) this._workflowExtensions[type] = [];
    this._workflowExtensions[type].push(handler);
  }

  getWorkflowExtensions() { return { ...this._workflowExtensions }; }

  extendAgent(type, handler) {
    if (!this._agentExtensions[type]) this._agentExtensions[type] = [];
    this._agentExtensions[type].push(handler);
  }

  getAgentExtensions() { return { ...this._agentExtensions }; }

  setStorage(key, value) { this._storage[key] = value; }
  getStorage(key) { return this._storage[key]; }
  getAllStorage() { return { ...this._storage }; }

  registerIntegration(name, config) {
    if (!this._integrations) this._integrations = {};
    const { createIntegration } = require('./Integration');
    this._integrations[name] = createIntegration({ ...config, provider: name });
  }

  getIntegrations() { return this._integrations ? { ...this._integrations } : {}; }

  registerWebhook(name, config) {
    if (!this._webhooks) this._webhooks = {};
    const { createWebhook } = require('./Webhook');
    this._webhooks[name] = createWebhook({ ...config, provider: this.id, name });
  }

  getWebhooks() { return this._webhooks ? { ...this._webhooks } : {}; }

  registerOAuthProvider(name, config) {
    if (!this._oauthProviders) this._oauthProviders = {};
    const { createOAuthProvider } = require('./OAuthProvider');
    this._oauthProviders[name] = createOAuthProvider({ ...config, name });
  }

  getOAuthProviders() { return this._oauthProviders ? { ...this._oauthProviders } : {}; }

  registerEvaluationMetric(name, config) {
    if (!this._evaluation) { const { createEvaluationExtension } = require('./EvaluationExtension'); this._evaluation = createEvaluationExtension(this); }
    const { createEvaluationMetric } = require('./EvaluationMetric');
    this._evaluation.registerMetric(name, createEvaluationMetric(config));
  }

  registerBenchmark(name, benchmark) {
    if (!this._evaluation) { const { createEvaluationExtension } = require('./EvaluationExtension'); this._evaluation = createEvaluationExtension(this); }
    this._evaluation.registerBenchmark(name, benchmark);
  }

  registerRubric(name, rubric) {
    if (!this._evaluation) { const { createEvaluationExtension } = require('./EvaluationExtension'); this._evaluation = createEvaluationExtension(this); }
    this._evaluation.registerRubric(name, rubric);
  }

  registerDataset(name, dataset) {
    if (!this._evaluation) { const { createEvaluationExtension } = require('./EvaluationExtension'); this._evaluation = createEvaluationExtension(this); }
    this._evaluation.registerDataset(name, dataset);
  }

  registerTemplate(name, template) {
    if (!this._evaluation) { const { createEvaluationExtension } = require('./EvaluationExtension'); this._evaluation = createEvaluationExtension(this); }
    this._evaluation.registerTemplate(name, template);
  }

  registerPolicyProvider(name, provider) {
    if (!this._governance) { const { PolicyProvider } = require('./PolicyProvider'); this._governance = new PolicyProvider(this); }
    this._governance.registerProvider({ name: name, provider: provider });
  }

  registerGovernancePolicy(name, policy) {
    if (!this._governance) { const { PolicyProvider } = require('./PolicyProvider'); this._governance = new PolicyProvider(this); }
    this._governance.registerPolicy(Object.assign({}, policy, { id: this.id + '-' + name, pluginId: this.id }));
  }

  registerComplianceTemplate(name, template) {
    if (!this._complianceTemplates) this._complianceTemplates = {};
    this._complianceTemplates[name] = template;
  }

  registerApprovalRule(name, rule) {
    if (!this._approvalRules) this._approvalRules = {};
    this._approvalRules[name] = rule;
  }

  getGovernanceExtension() { return this._governance; }

  getEvaluationExtension() {
    if (!this._evaluation) { const { createEvaluationExtension } = require('./EvaluationExtension'); this._evaluation = createEvaluationExtension(this); }
    return this._evaluation;
  }

  registerStorageProvider(name, provider) { if (!this._dataProviders) this._dataProviders = {}; if (!this._dataProviders.storage) this._dataProviders.storage = []; this._dataProviders.storage.push({ name, provider }); }
  registerDatabaseProvider(name, provider) { if (!this._dataProviders) this._dataProviders = {}; if (!this._dataProviders.database) this._dataProviders.database = []; this._dataProviders.database.push({ name, provider }); }
  registerEmbeddingProvider(name, provider) { if (!this._dataProviders) this._dataProviders = {}; if (!this._dataProviders.embedding) this._dataProviders.embedding = []; this._dataProviders.embedding.push({ name, provider }); }
  registerSearchProvider(name, provider) { if (!this._dataProviders) this._dataProviders = {}; if (!this._dataProviders.search) this._dataProviders.search = []; this._dataProviders.search.push({ name, provider }); }
  registerBackupProvider(name, provider) { if (!this._dataProviders) this._dataProviders = {}; if (!this._dataProviders.backup) this._dataProviders.backup = []; this._dataProviders.backup.push({ name, provider }); }
  getDataProviders() { return this._dataProviders ? { ...this._dataProviders } : {}; }

  onLoad() {}
  onUnload() {}
  onEnable() {}
  onDisable() {}
}

const createPlugin = (manifest) => new Plugin(manifest);

module.exports = { Plugin, createPlugin };
