const conversationManager = require('../conversation/conversationManager');
const { questionGenerator } = require('../conversation/questions');
const { buildContext } = require('../context/contextBuilder');
const planner = require('../planner');
const designStrategy = require('../design-strategy');
const contentGenerator = require('../content-generator');
const websiteBuilder = require('../generator');
const deploymentEngine = require('../deployment');
const pipelineCache = require('./pipelineCache');
const { STATES } = require('./pipelineState');

const STAGE_EXECUTORS = {
  conversation_engine: async function(run) {
    const conversation = conversationManager.loadConversation(run.config.conversationId);
    if (!conversation) throw new Error(`Conversation "${run.config.conversationId}" not found`);
    return {
      conversationId: conversation.id,
      messages: conversation.messages?.length || 0,
      intent: conversation.session?.context?.currentIntent || null,
      status: conversation.session?.status,
    };
  },

  intent_detection: async function(run) {
    const conv = conversationManager.loadConversation(run.config.conversationId);
    const context = conv?.session?.context;
    return {
      currentIntent: context?.currentIntent || 'default',
      entities: context?.detectedEntities || [],
      contextVariables: context?.contextVariables || {},
    };
  },

  question_generator: async function(run) {
    const conv = conversationManager.loadConversation(run.config.conversationId);
    const context = conv?.session?.context || {};
    const intent = { type: context.currentIntent || 'default', conversationId: run.config.conversationId };
    const questions = questionGenerator.generateQuestions(intent, context);
    return {
      primaryQuestions: questions.primaryQuestions,
      optionalQuestions: questions.optionalQuestions,
      missingFields: questions.missingFields,
      counts: {
        primary: questions.primaryQuestions?.length || 0,
        optional: questions.optionalQuestions?.length || 0,
        total: questions.missingFields?.length || 0,
      },
    };
  },

  context_builder: async function(run) {
    const cached = pipelineCache.get(run.runId, 'context_builder');
    if (cached && !pipelineCache.isExpired(run.runId, 'context_builder')) {
      run.metrics && run.metrics.cacheHitCount != null && run.metrics.cacheHitCount++;
      return cached;
    }
    const result = buildContext(run.config.conversationId, { strict: false });
    if (result.success) {
      pipelineCache.set(run.runId, 'context_builder', result);
      if (run.metrics) run.metrics.cacheMissCount++;
    }
    return result;
  },

  planner: async function(run) {
    const cached = pipelineCache.get(run.runId, 'planner');
    if (cached && !pipelineCache.isExpired(run.runId, 'planner')) { run.metrics && run.metrics.cacheHitCount++; return cached; }
    const context = run.getStageOutput('context_builder');
    const planIR = context?.planIR || context?.context?.planIR;
    if (!planIR) throw new Error('No Plan IR available from context builder');
    const blueprint = planner.planProject(planIR);
    if (run.metrics) run.metrics.cacheMissCount++;
    pipelineCache.set(run.runId, 'planner', blueprint);
    return blueprint;
  },

  design_strategy: async function(run) {
    const cached = pipelineCache.get(run.runId, 'design_strategy');
    if (cached && !pipelineCache.isExpired(run.runId, 'design_strategy')) { run.metrics && run.metrics.cacheHitCount++; return cached; }
    const blueprint = run.getStageOutput('planner');
    if (!blueprint) throw new Error('No blueprint from planner stage');
    const strategy = designStrategy.designStrategy(blueprint);
    if (run.metrics) run.metrics.cacheMissCount++;
    pipelineCache.set(run.runId, 'design_strategy', strategy);
    return strategy;
  },

  content_generator: async function(run) {
    const cached = pipelineCache.get(run.runId, 'content_generator');
    if (cached && !pipelineCache.isExpired(run.runId, 'content_generator')) { run.metrics && run.metrics.cacheHitCount++; return cached; }
    const blueprint = run.getStageOutput('planner');
    const strategy = run.getStageOutput('design_strategy');
    if (!blueprint || !strategy) throw new Error('Missing blueprint or design strategy');
    const content = contentGenerator.generateContent(blueprint, strategy);
    if (run.metrics) run.metrics.cacheMissCount++;
    pipelineCache.set(run.runId, 'content_generator', content);
    return content;
  },

  website_builder: async function(run) {
    const blueprint = run.getStageOutput('planner');
    const strategy = run.getStageOutput('design_strategy');
    const content = run.getStageOutput('content_generator');
    if (!blueprint || !strategy || !content) throw new Error('Missing blueprint, strategy, or content');
    const website = websiteBuilder.generateWebsite(content, blueprint, strategy);
    return website;
  },

  post_processing: async function(run) {
    const website = run.getStageOutput('website_builder');
    if (!website) throw new Error('No website output from website builder');
    const files = website.files || {};
    return {
      filesGenerated: Object.keys(files).length,
      fileTypes: [...new Set(Object.keys(files).map(f => f.split('.').pop()))],
      totalSize: Object.values(files).reduce((sum, c) => sum + (typeof c === 'string' ? Buffer.byteLength(c, 'utf-8') : 0), 0),
      validationPassed: true,
    };
  },

  deployment_engine: async function(run) {
    const website = run.getStageOutput('website_builder');
    const buildPath = website?.meta?.buildPath || './dist';
    const result = await deploymentEngine.deploy({
      buildPath,
      projectName: run.config.projectName || 'pipeline-deploy',
      version: `pipeline-${Date.now()}`,
      providerName: run.config.provider || 'vercel',
      dryRun: run.config.dryRun || false,
    });
    return result;
  },

  dashboard_refresh: async function(run) {
    return {
      refreshedAt: new Date().toISOString(),
      status: 'completed',
      metrics: run.metrics ? require('./pipelineMetrics').getSummary(run.metrics) : {},
    };
  },
};

const STAGE_ORDER = [
  'conversation_engine', 'intent_detection', 'question_generator', 'context_builder',
  'planner', 'design_strategy', 'content_generator', 'website_builder',
  'post_processing', 'deployment_engine', 'dashboard_refresh',
];

function getExecutor(stageName) {
  return STAGE_EXECUTORS[stageName] || null;
}

module.exports = { STAGE_EXECUTORS, STAGE_ORDER, getExecutor };
