const { PROVIDERS, healthCheck } = require('../providers');
const { selectModel } = require('./modelSelector');

const MAX_RETRIES = 3;
const FALLBACK_CHAINS = {
  'anthropic': ['openai', 'gemini', 'ollama'],
  'openai': ['anthropic', 'gemini', 'ollama'],
  'gemini': ['openai', 'anthropic', 'ollama'],
  'ollama': ['openai', 'gemini', 'anthropic'],
};

async function executeWithFallback(prompt, options = {}) {
  const events = options.eventEmitter || null;
  const maxRetries = options.maxRetries || MAX_RETRIES;
  const runId = options.runId || `ai-${Date.now()}`;

  let selection;

  if (options.provider && options.model) {
    selection = { provider: options.provider, model: options.model, reason: 'explicit' };
  } else {
    selection = selectModel(prompt, options);
  }

  if (!selection) {
    return { success: false, error: 'No model could be selected', provider: null, model: null };
  }

  const attempts = [];
  const chain = [selection.provider, ...(FALLBACK_CHAINS[selection.provider] || [])];

  for (let attempt = 0; attempt < Math.min(chain.length, maxRetries + 1); attempt++) {
    const providerName = attempt === 0 ? selection.provider : chain[attempt];
    const provider = PROVIDERS[providerName];

    if (!provider || !provider._healthy) {
      attempts.push({ provider: providerName, status: 'skipped', reason: 'provider unhealthy' });
      continue;
    }

    try {
      emitEvent(events, 'ai.routing.attempt', { runId, provider: providerName, attempt: attempt + 1 });

      const modelId = attempt === 0 ? selection.model : (options.fallbackModel || provider.models()[0]?.id);
      const result = await provider.generate(prompt, { ...options, model: modelId });

      attempts.push({ provider: providerName, model: modelId, status: 'success' });

      if (attempt > 0) {
        emitEvent(events, 'ai.routing.fallback', { runId, from: selection.provider, to: providerName, model: modelId });
      }

      return { success: true, ...result, attempts };
    } catch (err) {
      attempts.push({ provider: providerName, status: 'failed', error: err.message });

      if (providerName !== 'ollama') {
        provider.setHealth(false);
        setTimeout(() => provider.setHealth(true), 30000);
      }

      emitEvent(events, 'ai.routing.failed', { runId, provider: providerName, error: err.message, attempt: attempt + 1 });

      const nextProvider = chain[attempt + 1];
      if (nextProvider) {
        emitEvent(events, 'ai.provider.unavailable', { runId, provider: providerName, fallbackTo: nextProvider });
      }
    }
  }

  emitEvent(events, 'ai.routing.failed', { runId, error: 'All providers exhausted', attempts: attempts.length });
  return { success: false, error: 'All providers failed', attempts, provider: null, model: null };
}

function emitEvent(emitter, type, data) {
  if (emitter && typeof emitter.emit === 'function') {
    emitter.emit(type, data);
  }
}

module.exports = { executeWithFallback, FALLBACK_CHAINS };
