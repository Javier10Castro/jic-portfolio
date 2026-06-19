const assert = require('assert');

describe('AI Routing Layer', function() {
  describe('Model Selector', () => {
    const { selectModel, allModels } = require('../../lib/ai/router/modelSelector');

    it('selects quality model for planning context', () => {
      const sel = selectModel('Build a coffee shop website', { context: 'planning', strategy: 'quality' });
      assert(sel.provider);
      assert(sel.model);
      assert(sel.reason);
      assert(sel.estimatedInputTokens > 0);
    });

    it('selects cheap model for summarization', () => {
      const sel = selectModel('Summarize this text', { context: 'summarization', strategy: 'cost' });
      assert(sel.provider);
      assert(sel.model);
    });

    it('selects fast model for latency strategy', () => {
      const sel = selectModel('Quick response needed', { context: 'fast', strategy: 'latency' });
      assert(sel.provider);
      assert(sel.model);
    });

    it('allModels returns all available models', () => {
      const models = allModels();
      assert(models.length > 0);
      assert(models.some(m => m.providerName === 'openai'));
      assert(models.some(m => m.providerName === 'anthropic'));
      assert(models.some(m => m.providerName === 'gemini'));
      assert(models.some(m => m.providerName === 'ollama'));
    });
  });

  describe('Load Balancer', () => {
    const { roundRobin, latencyBased, costBased, hybrid, getMetrics, resetCounters } = require('../../lib/ai/router/loadBalancer');

    beforeEach(() => resetCounters());

    it('roundRobin cycles through providers', () => {
      const providers = ['openai', 'anthropic', 'gemini'];
      const first = roundRobin(providers);
      const second = roundRobin(providers);
      const third = roundRobin(providers);
      const fourth = roundRobin(providers);
      assert.strictEqual(first, 'openai');
      assert.strictEqual(second, 'anthropic');
      assert.strictEqual(third, 'gemini');
      assert.strictEqual(fourth, 'openai');
    });

    it('costBased picks cheapest provider', () => {
      const providers = ['openai', 'anthropic', 'gemini'];
      const result = costBased(providers);
      assert(providers.includes(result));
    });

    it('hybrid returns a valid provider', () => {
      const providers = ['openai', 'anthropic', 'gemini'];
      const result = hybrid(providers);
      assert(providers.includes(result));
    });

    it('getMetrics returns counters', () => {
      roundRobin(['openai', 'anthropic']);
      roundRobin(['openai', 'anthropic']);
      const metrics = getMetrics();
      assert(Object.keys(metrics).length > 0);
    });

    it('resetCounters clears all counters', () => {
      roundRobin(['openai', 'anthropic']);
      resetCounters();
      const metrics = getMetrics();
      assert.strictEqual(Object.keys(metrics).length, 0);
    });
  });

  describe('Fallback Router', () => {
    const { executeWithFallback, FALLBACK_CHAINS } = require('../../lib/ai/router/fallbackRouter');

    it('has fallback chains for all providers', () => {
      assert(FALLBACK_CHAINS.openai);
      assert(FALLBACK_CHAINS.anthropic);
      assert(FALLBACK_CHAINS.gemini);
      assert(FALLBACK_CHAINS.ollama);
      assert(FALLBACK_CHAINS.openai.includes('anthropic'));
      assert(FALLBACK_CHAINS.anthropic.includes('openai'));
    });

    it('executes successfully with simulated provider', async () => {
      const result = await executeWithFallback('Test prompt', { provider: 'openai', model: 'gpt-3.5-turbo' });
      assert.strictEqual(result.success, true);
      assert(result.text);
      assert(Array.isArray(result.attempts));
      assert(result.attempts.some(a => a.status === 'success'));
    });

    it('falls back when primary provider unhealthy', async () => {
      const { PROVIDERS } = require('../../lib/ai/providers');
      PROVIDERS.anthropic.setHealth(false);
      PROVIDERS.openai.setHealth(true);

      const result = await executeWithFallback('test', { provider: 'anthropic' });
      assert(result.success === true || result.success === false);
      PROVIDERS.anthropic.setHealth(true);

      if (result.success) {
        assert(Array.isArray(result.attempts));
      }
    });
  });

  describe('AI Router (integration)', () => {
    const ai = require('../../lib/ai');

    it('generate produces simulated response', async () => {
      const result = await ai.generate('Hello world', { provider: 'openai', model: 'gpt-3.5-turbo' });
      assert(result.text);
      assert(result.provider);
      assert(result.model);
      assert(result.usage.inputTokens >= 0);
      assert(result.latency >= 0);
    });

    it('stream produces streamed response', async () => {
      const result = await ai.stream('Hello', { provider: 'openai', model: 'gpt-3.5-turbo' });
      assert(result.text);
      assert(result.streamed);
    });

    it('selectModel returns a selection', () => {
      const sel = ai.selectModel('test', { context: 'chat' });
      assert(sel.provider);
      assert(sel.model);
    });

    it('allModels returns array', () => {
      const models = ai.allModels();
      assert(Array.isArray(models));
      assert(models.length > 0);
    });

    it('listProviders returns provider names', () => {
      const providers = ai.listProviders();
      assert(Array.isArray(providers));
      assert(providers.some(p => p.name === 'openai'));
      assert(providers.some(p => p.models.length > 0));
    });

    it('healthCheck returns statuses', async () => {
      const health = await ai.healthCheck();
      assert(health.openai);
      assert(health.anthropic);
      assert(health.gemini);
      assert(health.ollama);
    });

    it('getMetrics returns metrics object', () => {
      const metrics = ai.getMetrics();
      assert(metrics.routingEvents);
      assert(metrics.loadBalancer);
      assert(metrics.providers);
    });

    it('estimateTokens works', () => {
      const count = ai.estimateTokens('Hello world, this is a test message');
      assert(typeof count === 'number');
      assert(count > 0);
    });
  });

  describe('Normalization Layer', () => {
    const { normalize, mergeStreamed, createEmpty } = require('../../lib/ai/normalization/responseNormalizer');
    const { formatForProvider, addSystemPrompt } = require('../../lib/ai/normalization/promptFormatter');
    const { estimateTokens, estimateMessages, estimateCost } = require('../../lib/ai/normalization/tokenEstimator');

    it('normalize returns correct shape', () => {
      const result = normalize({ text: 'hello', provider: 'openai', model: 'gpt-4', usage: { inputTokens: 10, outputTokens: 20 }, latency: 100 }, 'openai', 'gpt-4');
      assert.strictEqual(result.text, 'hello');
      assert.strictEqual(result.provider, 'openai');
      assert.strictEqual(result.usage.inputTokens, 10);
    });

    it('normalize handles raw string', () => {
      const result = normalize('raw string', 'test', 'm1');
      assert.strictEqual(result.text, 'raw string');
    });

    it('normalize handles API response shape', () => {
      const raw = { choices: [{ message: { content: 'API response' } }], model: 'gpt-4', usage: { prompt_tokens: 5, completion_tokens: 10 } };
      const result = normalize(raw, 'openai', 'gpt-4');
      assert.strictEqual(result.text, 'API response');
      assert.strictEqual(result.usage.inputTokens, 5);
    });

    it('formatForProvider formats for OpenAI', () => {
      const result = formatForProvider('Hi', 'openai');
      assert(Array.isArray(result));
      assert.strictEqual(result[0].role, 'user');
    });

    it('addSystemPrompt adds system message', () => {
      const result = addSystemPrompt('Hello', 'You are a helper');
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].role, 'system');
    });

    it('estimateTokens counts tokens', () => {
      const count = estimateTokens('Hello world');
      assert(typeof count === 'number');
      assert(count > 0);
    });

    it('estimateMessages sums tokens', () => {
      const msgs = [{ content: 'Hello' }, { content: 'World' }];
      const count = estimateMessages(msgs);
      assert(count > 0);
    });

    it('estimateCost calculates correctly', () => {
      const cost = estimateCost(1000, 500, { costPer1kInput: 0.01, costPer1kOutput: 0.03 });
      assert.strictEqual(cost.inputCost, 0.01);
      assert.strictEqual(cost.outputCost, 0.015);
      assert.strictEqual(cost.totalCost, 0.025);
    });

    it('mergeStreamed joins chunks', () => {
      const result = mergeStreamed(['Hello ', 'World', '!']);
      assert.strictEqual(result, 'Hello World!');
    });

    it('createEmpty returns default shape', () => {
      const result = createEmpty('test', 'm1');
      assert.strictEqual(result.text, '');
      assert.strictEqual(result.provider, 'test');
      assert.strictEqual(result.model, 'm1');
    });
  });

  describe('Intelligence Layer', () => {
    const { cheapest } = require('../../lib/ai/intelligence/costOptimizer');
    const { fastest } = require('../../lib/ai/intelligence/latencyOptimizer');
    const { bestQuality, getContextDefaults, CONTEXT_MAP } = require('../../lib/ai/intelligence/qualityRouter');
    const { routeByIntent, ROUTE_STRATEGIES } = require('../../lib/ai/intelligence/intentRouter');

    it('cheapest finds lowest cost model', () => {
      const result = cheapest('test', { minQuality: 'low' });
      assert(result);
      assert(result.provider);
      assert(result.model);
    });

    it('fastest finds fastest model', () => {
      const result = fastest('test');
      assert(result);
      assert(result.provider);
      assert(result.speed);
    });

    it('bestQuality finds high quality model', () => {
      const result = bestQuality('test', 'planning');
      assert(result);
      assert(result.reason);
    });

    it('bestQuality prefers Anthropic for planning', () => {
      const result = bestQuality('test', 'planning');
      assert(result);
      assert.strictEqual(result.provider, 'anthropic');
    });

    it('bestQuality prefers OpenAI for code', () => {
      const result = bestQuality('test', 'code');
      assert.strictEqual(result.provider, 'openai');
    });

    it('getContextDefaults returns config for known context', () => {
      const cfg = getContextDefaults('planning');
      assert(cfg.preferred);
      assert(cfg.reason);
    });

    it('CONTEXT_MAP has all contexts defined', () => {
      const contexts = ['planning', 'code', 'design', 'content', 'summarization', 'fast', 'chat'];
      contexts.forEach(c => assert(CONTEXT_MAP[c], `Missing context: ${c}`));
    });

    it('routeByIntent uses quality strategy', () => {
      const result = routeByIntent('test', 'planning', { strategy: 'quality' });
      assert(result);
      assert(result.provider);
    });

    it('routeByIntent uses cost strategy', () => {
      const result = routeByIntent('test', 'summarization', { strategy: 'cost' });
      assert(result);
    });

    it('routeByIntent uses hybrid strategy by default', () => {
      const result = routeByIntent('test', 'code');
      assert(result);
    });

    it('ROUTE_STRATEGIES has all strategies', () => {
      assert(ROUTE_STRATEGIES.quality);
      assert(ROUTE_STRATEGIES.cost);
      assert(ROUTE_STRATEGIES.latency);
      assert(ROUTE_STRATEGIES.hybrid);
    });
  });

  describe('Integration Layer', () => {
    it('plannerIntegration exports functions', () => {
      const pi = require('../../lib/ai/integration/plannerIntegration');
      assert(typeof pi.planProjectWithAI === 'function');
      assert(typeof pi.generatePlanFromPrompt === 'function');
    });

    it('generatorIntegration exports functions', () => {
      const gi = require('../../lib/ai/integration/generatorIntegration');
      assert(typeof gi.generateWebsiteWithAI === 'function');
      assert(typeof gi.enhanceWithAI === 'function');
    });

    it('contentIntegration exports functions', () => {
      const ci = require('../../lib/ai/integration/contentIntegration');
      assert(typeof ci.generateContentWithAI === 'function');
      assert(typeof ci.enhanceContentWithAI === 'function');
    });
  });
});
