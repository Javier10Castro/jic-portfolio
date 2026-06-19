const assert = require('assert');

describe('AI Provider Layer — Unit Tests', function() {
  describe('BaseProvider', () => {
    const BaseProvider = require('../../lib/ai/providers/baseProvider');

    it('throws on unimplemented generate()', async () => {
      const p = new BaseProvider();
      try {
        await p.generate('test');
        assert.fail('should throw');
      } catch (err) {
        assert(err.message.includes('not implemented'));
      }
    });

    it('throws on unimplemented stream()', async () => {
      const p = new BaseProvider();
      try {
        await p.stream('test');
        assert.fail('should throw');
      } catch (err) {
        assert(err.message.includes('not implemented'));
      }
    });

    it('returns health status', async () => {
      const p = new BaseProvider();
      const h = await p.health();
      assert.strictEqual(h.status, 'ok');
      assert.strictEqual(h.name, 'base');
      assert(h.timestamp);
    });

    it('returns empty models list', () => {
      const p = new BaseProvider();
      assert.deepStrictEqual(p.models(), []);
    });

    it('setHealth controls health state', () => {
      const p = new BaseProvider();
      p.setHealth(false);
      assert.strictEqual(p._healthy, false);
      p.setHealth(true);
      assert.strictEqual(p._healthy, true);
    });
  });

  describe('OpenAI Provider (simulated)', () => {
    const OpenAIProvider = require('../../lib/ai/providers/openaiProvider');

    it('generates simulated response without API key', async () => {
      const p = new OpenAIProvider({ apiKey: null });
      const result = await p.generate('Hello world');
      assert(result.text);
      assert(result.text.includes('[openai-simulated]'));
      assert.strictEqual(result.provider, 'openai');
      assert(result.usage.inputTokens > 0);
      assert(result.latency >= 0);
      assert.strictEqual(result.simulated, true);
    });

    it('streams simulated response without API key', async () => {
      const p = new OpenAIProvider({ apiKey: null });
      const result = await p.stream('Hello');
      assert(result.streamed);
      assert(Array.isArray(result.chunks));
      assert(result.chunks.length > 0);
    });

    it('returns health as simulated without API key', async () => {
      const p = new OpenAIProvider({ apiKey: null });
      const h = await p.health();
      assert.strictEqual(h.status, 'simulated');
    });

    it('lists available models', () => {
      const p = new OpenAIProvider();
      const models = p.models();
      assert(models.length > 0);
      assert(models.some(m => m.id.includes('gpt')));
      assert(models.every(m => m.provider === 'openai'));
      models.forEach(m => {
        assert(typeof m.costPer1kInput === 'number');
        assert(typeof m.costPer1kOutput === 'number');
        assert(m.quality);
        assert(m.speed);
      });
    });
  });

  describe('Anthropic Provider (simulated)', () => {
    const AnthropicProvider = require('../../lib/ai/providers/anthropicProvider');

    it('generates simulated response without API key', async () => {
      const p = new AnthropicProvider({ apiKey: null });
      const result = await p.generate('Test prompt');
      assert(result.text.includes('[anthropic-simulated]'));
      assert.strictEqual(result.provider, 'anthropic');
      assert(result.simulated);
    });

    it('lists Claude models with correct costs', () => {
      const p = new AnthropicProvider();
      const models = p.models();
      assert(models.some(m => m.id.includes('claude-3-opus')));
      assert(models.some(m => m.id.includes('haiku')));
      const opus = models.find(m => m.id.includes('opus'));
      assert(opus.costPer1kOutput > opus.costPer1kInput);
    });
  });

  describe('Gemini Provider (simulated)', () => {
    const GeminiProvider = require('../../lib/ai/providers/geminiProvider');

    it('generates simulated response without API key', async () => {
      const p = new GeminiProvider({ apiKey: null });
      const result = await p.generate('Hello');
      assert(result.text.includes('[gemini-simulated]'));
      assert.strictEqual(result.provider, 'gemini');
    });

    it('builds contents from string prompt', () => {
      const p = new GeminiProvider({ apiKey: null });
      const contents = p._buildContents('Hello');
      assert(Array.isArray(contents));
      assert.strictEqual(contents[0].parts[0].text, 'Hello');
    });

    it('builds contents from messages array', () => {
      const p = new GeminiProvider({ apiKey: null });
      const msgs = [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }];
      const contents = p._buildContents(msgs);
      assert.strictEqual(contents.length, 2);
      assert.strictEqual(contents[1].role, 'model');
    });
  });

  describe('Ollama Provider (simulated)', () => {
    const OllamaProvider = require('../../lib/ai/providers/ollamaProvider');

    it('generates simulated response when offline', async () => {
      const p = new OllamaProvider({ ollamaUrl: 'http://localhost:19999' });
      const result = await p.generate('Test');
      assert(result.text.includes('[ollama-simulated]'));
      assert.strictEqual(result.local, true);
    });

    it('returns unavailable health when offline', async () => {
      const p = new OllamaProvider({ ollamaUrl: 'http://localhost:19999' });
      const h = await p.health();
      assert.strictEqual(h.status, 'unavailable');
    });

    it('lists local models with zero cost', () => {
      const p = new OllamaProvider();
      const models = p.models();
      assert(models.length > 0);
      assert(models.every(m => m.costPer1kInput === 0));
      assert(models.some(m => m.local));
    });
  });

  describe('Provider Index', () => {
    const { PROVIDERS, getProvider, listProviders } = require('../../lib/ai/providers');

    it('has all 4 providers registered', () => {
      assert(PROVIDERS.openai);
      assert(PROVIDERS.anthropic);
      assert(PROVIDERS.gemini);
      assert(PROVIDERS.ollama);
    });

    it('getProvider returns correct provider', () => {
      const p = getProvider('openai');
      assert(p);
      assert.strictEqual(p.name, 'openai');
    });

    it('getProvider returns null for unknown', () => {
      assert.strictEqual(getProvider('nonexistent'), null);
    });

    it('listProviders returns all names', () => {
      const list = listProviders();
      assert(list.length >= 4);
      assert(list.find(p => p.name === 'openai'));
    });

    it('healthCheck returns results for all providers', async () => {
      const results = await require('../../lib/ai/providers').healthCheck();
      assert(results.openai);
      assert(results.anthropic);
      assert(results.gemini);
      assert(results.ollama);
    });
  });
});
