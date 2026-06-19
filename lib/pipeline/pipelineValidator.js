const { PipelineError } = require('./errors/PipelineError');

const STAGE_ORDER = [
  'conversation_engine',
  'intent_detection',
  'question_generator',
  'context_builder',
  'planner',
  'design_strategy',
  'content_generator',
  'website_builder',
  'post_processing',
  'deployment_engine',
  'dashboard_refresh',
];

const STAGE_DEPENDENCIES = {
  conversation_engine: [],
  intent_detection: ['conversation_engine'],
  question_generator: ['intent_detection'],
  context_builder: ['question_generator', 'intent_detection', 'conversation_engine'],
  planner: ['context_builder'],
  design_strategy: ['planner'],
  content_generator: ['design_strategy', 'planner'],
  website_builder: ['content_generator', 'design_strategy'],
  post_processing: ['website_builder'],
  deployment_engine: ['post_processing'],
  dashboard_refresh: ['deployment_engine'],
};

function validateStageOrder(stages) {
  const errors = [];
  if (!Array.isArray(stages) || !stages.length) {
    return [new PipelineError('Stages array is empty')];
  }
  for (let i = 0; i < stages.length; i++) {
    const idx = STAGE_ORDER.indexOf(stages[i]);
    if (idx === -1) errors.push(new PipelineError(`Unknown stage "${stages[i]}" at position ${i}`));
    if (i > 0) {
      const prevIdx = STAGE_ORDER.indexOf(stages[i - 1]);
      if (idx <= prevIdx) {
        errors.push(new PipelineError(`Stage order violation: "${stages[i]}" should not follow "${stages[i - 1]}"`));
      }
    }
  }
  return errors;
}

function validateDependencies(stages, completedStages) {
  const errors = [];
  if (!stages) return errors;
  const completed = new Set(completedStages || []);
  for (const stage of stages) {
    const deps = STAGE_DEPENDENCIES[stage] || [];
    for (const dep of deps) {
      if (!completed.has(dep)) {
        errors.push(new PipelineError(`Stage "${stage}" requires "${dep}" to be completed first`));
      }
    }
  }
  return errors;
}

function validateRunInput(runConfig) {
  const errors = [];
  if (!runConfig) return [new PipelineError('Run config is required')];
  if (!runConfig.conversationId && !runConfig.projectId) {
    errors.push(new PipelineError('Either conversationId or projectId is required'));
  }
  return errors;
}

module.exports = { STAGE_ORDER, STAGE_DEPENDENCIES, validateStageOrder, validateDependencies, validateRunInput };
