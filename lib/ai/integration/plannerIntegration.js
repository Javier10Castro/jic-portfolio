const planner = require('../../planner');
const ai = require('../../ai');
const { formatForProvider } = require('../normalization/promptFormatter');

function planProjectWithAI(planIR, options = {}) {
  const useAI = options.useAI !== false && process.env.AI_PLANNER !== 'off';

  if (!useAI) {
    return planner.planProject(planIR);
  }

  return planner.planProject(planIR);
}

async function generatePlanFromPrompt(prompt, options = {}) {
  const modelContext = options.modelContext || 'planning';
  const systemPrompt = options.systemPrompt || 'You are a senior software architect. Given a project description, produce a detailed plan covering pages, navigation, sections, and components.';

  const result = await ai.generate(prompt, {
    context: modelContext,
    strategy: options.strategy || 'quality',
    systemPrompt,
    preferredProvider: options.preferredProvider || 'anthropic',
    ...options,
  });

  let planIR;
  try {
    planIR = typeof result.text === 'string' ? JSON.parse(result.text) : result.text;
  } catch {
    planIR = { prompt: result.text, generated: true, aiMetadata: result };
  }

  return planner.planProject(planIR);
}

module.exports = { planProjectWithAI, generatePlanFromPrompt };
