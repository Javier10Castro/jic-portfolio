const { PROVIDERS } = require('../providers');

const QUALITY_ORDER = ['very-high', 'high', 'medium', 'low'];

const CONTEXT_MAP = {
  planning: { minQuality: 'high', preferred: 'anthropic', reason: 'Claude excels at structured planning' },
  code: { minQuality: 'high', preferred: 'openai', reason: 'GPT-4 optimized for code generation' },
  design: { minQuality: 'high', preferred: 'anthropic', reason: 'Claude excels at UI/design reasoning' },
  content: { minQuality: 'high', preferred: 'anthropic', reason: 'Claude for nuanced content' },
  summarization: { minQuality: 'medium', preferred: 'gemini', reason: 'Cheaper models sufficient' },
  fast: { minQuality: 'low', preferred: 'gemini', reason: 'Gemini Flash for speed' },
  chat: { minQuality: 'medium', preferred: 'openai', reason: 'GPT balanced for conversation' },
};

function bestQuality(prompt, context = 'chat', requirements = {}) {
  const ctx = CONTEXT_MAP[context] || CONTEXT_MAP.chat;
  const minQuality = requirements.minQuality || ctx.minQuality;
  const minIdx = QUALITY_ORDER.indexOf(minQuality);
  if (minIdx === -1) return null;

  let best = null;
  let bestIdx = Infinity;

  const preferredProvider = requirements.preferred || ctx.preferred;

  for (const provider of Object.values(PROVIDERS)) {
    for (const model of provider.models()) {
      const qualIdx = QUALITY_ORDER.indexOf(model.quality);
      if (qualIdx === -1 || qualIdx > minIdx) continue;
      if (requirements.contextMin && model.contextWindow < requirements.contextMin) continue;

      const score = qualIdx + (provider.name === preferredProvider ? -2 : 0);
      if (score < bestIdx) {
        bestIdx = score;
        best = { provider: provider.name, model: model.id, quality: model.quality, reason: ctx.reason };
      }
    }
  }

  return best;
}

function getContextDefaults(context) {
  return CONTEXT_MAP[context] || CONTEXT_MAP.chat;
}

module.exports = { bestQuality, getContextDefaults, CONTEXT_MAP };
