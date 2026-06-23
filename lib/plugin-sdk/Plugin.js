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

  registerConfigurationProvider(name, provider) { if (!this._runtimeProviders) this._runtimeProviders = {}; if (!this._runtimeProviders.config) this._runtimeProviders.config = []; this._runtimeProviders.config.push({ name, provider }); }
  registerFeatureFlagProvider(name, provider) { if (!this._runtimeProviders) this._runtimeProviders = {}; if (!this._runtimeProviders.flags) this._runtimeProviders.flags = []; this._runtimeProviders.flags.push({ name, provider }); }
  registerSecretProvider(name, provider) { if (!this._runtimeProviders) this._runtimeProviders = {}; if (!this._runtimeProviders.secrets) this._runtimeProviders.secrets = []; this._runtimeProviders.secrets.push({ name, provider }); }
  registerRuntimeHook(name, hook) { if (!this._runtimeProviders) this._runtimeProviders = {}; if (!this._runtimeProviders.hooks) this._runtimeProviders.hooks = []; this._runtimeProviders.hooks.push({ name, hook }); }
  registerRolloutProvider(name, provider) { if (!this._runtimeProviders) this._runtimeProviders = {}; if (!this._runtimeProviders.rollouts) this._runtimeProviders.rollouts = []; this._runtimeProviders.rollouts.push({ name, provider }); }
  getRuntimeProviders() { return this._runtimeProviders ? { ...this._runtimeProviders } : {}; }

  registerProjectTemplate(name, template) { if (!this._lifecycleProviders) this._lifecycleProviders = {}; if (!this._lifecycleProviders.templates) this._lifecycleProviders.templates = []; this._lifecycleProviders.templates.push({ name, template }); }
  registerLifecycleHook(name, hook) { if (!this._lifecycleProviders) this._lifecycleProviders = {}; if (!this._lifecycleProviders.hooks) this._lifecycleProviders.hooks = []; this._lifecycleProviders.hooks.push({ name, hook }); }
  registerMigrationProvider(name, provider) { if (!this._lifecycleProviders) this._lifecycleProviders = {}; if (!this._lifecycleProviders.migrations) this._lifecycleProviders.migrations = []; this._lifecycleProviders.migrations.push({ name, provider }); }
  registerSnapshotProvider(name, provider) { if (!this._lifecycleProviders) this._lifecycleProviders = {}; if (!this._lifecycleProviders.snapshots) this._lifecycleProviders.snapshots = []; this._lifecycleProviders.snapshots.push({ name, provider }); }
  registerReleaseValidator(name, validator) { if (!this._lifecycleProviders) this._lifecycleProviders = {}; if (!this._lifecycleProviders.validators) this._lifecycleProviders.validators = []; this._lifecycleProviders.validators.push({ name, validator }); }
  getLifecycleProviders() { return this._lifecycleProviders ? { ...this._lifecycleProviders } : {}; }

  registerAppTemplate(name, template) { if (!this._composerProviders) this._composerProviders = {}; if (!this._composerProviders.templates) this._composerProviders.templates = []; this._composerProviders.templates.push({ name, template }); }
  registerCapabilityProvider(name, provider) { if (!this._composerProviders) this._composerProviders = {}; if (!this._composerProviders.capabilities) this._composerProviders.capabilities = []; this._composerProviders.capabilities.push({ name, provider }); }
  registerCompositionRule(name, rule) { if (!this._composerProviders) this._composerProviders = {}; if (!this._composerProviders.rules) this._composerProviders.rules = []; this._composerProviders.rules.push({ name, rule }); }
  registerGraphBuilder(name, builder) { if (!this._composerProviders) this._composerProviders = {}; if (!this._composerProviders.builders) this._composerProviders.builders = []; this._composerProviders.builders.push({ name, builder }); }
  getComposerProviders() { return this._composerProviders ? { ...this._composerProviders } : {}; }

  registerArchitecturePattern(name) { if (!this._composerProviders) this._composerProviders = {}; if (!this._composerProviders.architecturePatterns) this._composerProviders.architecturePatterns = []; const { ArchitecturePattern } = require('./ArchitecturePattern'); const instance = new ArchitecturePattern(name); this._composerProviders.architecturePatterns.push({ name, instance }); return instance; }
  registerQualityAnalyzer(name) { if (!this._composerProviders) this._composerProviders = {}; if (!this._composerProviders.qualityAnalyzers) this._composerProviders.qualityAnalyzers = []; const { QualityAnalyzer } = require('./QualityAnalyzer'); const instance = new QualityAnalyzer(name); this._composerProviders.qualityAnalyzers.push({ name, instance }); return instance; }
  registerDecisionValidator() { if (!this._composerProviders) this._composerProviders = {}; if (!this._composerProviders.decisionValidators) this._composerProviders.decisionValidators = []; const { DecisionValidator } = require('./DecisionValidator'); const instance = new DecisionValidator(); this._composerProviders.decisionValidators.push({ name: 'decision-validator', instance }); return instance; }
  registerTopologyBuilder(name) { if (!this._composerProviders) this._composerProviders = {}; if (!this._composerProviders.topologyBuilders) this._composerProviders.topologyBuilders = []; const { TopologyBuilder } = require('./TopologyBuilder'); const instance = new TopologyBuilder(name); this._composerProviders.topologyBuilders.push({ name, instance }); return instance; }
  registerBlueprintExporter() { if (!this._composerProviders) this._composerProviders = {}; if (!this._composerProviders.blueprintExporters) this._composerProviders.blueprintExporters = []; const { BlueprintExporter } = require('./BlueprintExporter'); const instance = new BlueprintExporter(); this._composerProviders.blueprintExporters.push({ name: 'blueprint-exporter', instance }); return instance; }

  registerEvolutionAnalyzer(name) { if (!this._evolutionProviders) this._evolutionProviders = {}; if (!this._evolutionProviders.analyzers) this._evolutionProviders.analyzers = []; const { EvolutionAnalyzer } = require('./EvolutionAnalyzer'); const instance = new EvolutionAnalyzer(name); this._evolutionProviders.analyzers.push({ name, instance }); return instance; }
  registerOptimizationPlanner(name) { if (!this._evolutionProviders) this._evolutionProviders = {}; if (!this._evolutionProviders.planners) this._evolutionProviders.planners = []; const { OptimizationPlanner } = require('./OptimizationPlanner'); const instance = new OptimizationPlanner(name); this._evolutionProviders.planners.push({ name, instance }); return instance; }
  registerRefactorStrategy(name) { if (!this._evolutionProviders) this._evolutionProviders = {}; if (!this._evolutionProviders.strategies) this._evolutionProviders.strategies = []; const { RefactorStrategy } = require('./RefactorStrategy'); const instance = new RefactorStrategy(name); this._evolutionProviders.strategies.push({ name, instance }); return instance; }
  registerDebtAnalyzer(name) { if (!this._evolutionProviders) this._evolutionProviders = {}; if (!this._evolutionProviders.debtAnalyzers) this._evolutionProviders.debtAnalyzers = []; const { DebtAnalyzer } = require('./DebtAnalyzer'); const instance = new DebtAnalyzer(name); this._evolutionProviders.debtAnalyzers.push({ name, instance }); return instance; }
  registerRoadmapGenerator(name) { if (!this._evolutionProviders) this._evolutionProviders = {}; if (!this._evolutionProviders.roadmaps) this._evolutionProviders.roadmaps = []; const { RoadmapGenerator } = require('./RoadmapGenerator'); const instance = new RoadmapGenerator(name); this._evolutionProviders.roadmaps.push({ name, instance }); return instance; }
  getEvolutionProviders() { return this._evolutionProviders ? { ...this._evolutionProviders } : {}; }

  registerKnowledgeProvider(name) { if (!this._knowledgeProviders) this._knowledgeProviders = {}; if (!this._knowledgeProviders.providers) this._knowledgeProviders.providers = []; const { KnowledgeProvider } = require('./KnowledgeProvider'); const instance = new KnowledgeProvider(name); this._knowledgeProviders.providers.push({ name, instance }); return instance; }
  registerKnowledgeExtractor(name) { if (!this._knowledgeProviders) this._knowledgeProviders = {}; if (!this._knowledgeProviders.extractors) this._knowledgeProviders.extractors = []; const { KnowledgeExtractor } = require('./KnowledgeExtractor'); const instance = new KnowledgeExtractor(name); this._knowledgeProviders.extractors.push({ name, instance }); return instance; }
  registerGraphEnricher(name) { if (!this._knowledgeProviders) this._knowledgeProviders = {}; if (!this._knowledgeProviders.enrichers) this._knowledgeProviders.enrichers = []; const { GraphEnricher } = require('./GraphEnricher'); const instance = new GraphEnricher(name); this._knowledgeProviders.enrichers.push({ name, instance }); return instance; }
  registerRecommendationProvider(name) { if (!this._knowledgeProviders) this._knowledgeProviders = {}; if (!this._knowledgeProviders.recommendations) this._knowledgeProviders.recommendations = []; const { RecommendationProvider } = require('./RecommendationProvider'); const instance = new RecommendationProvider(name); this._knowledgeProviders.recommendations.push({ name, instance }); return instance; }
  registerPatternAnalyzer(name) { if (!this._knowledgeProviders) this._knowledgeProviders = {}; if (!this._knowledgeProviders.analyzers) this._knowledgeProviders.analyzers = []; const { PatternAnalyzer } = require('./PatternAnalyzer'); const instance = new PatternAnalyzer(name); this._knowledgeProviders.analyzers.push({ name, instance }); return instance; }
  getKnowledgeProviders() { return this._knowledgeProviders ? { ...this._knowledgeProviders } : {}; }

  onLoad() {}
  onUnload() {}
  onEnable() {}
  onDisable() {}
}

const createPlugin = (manifest) => new Plugin(manifest);

module.exports = { Plugin, createPlugin };
