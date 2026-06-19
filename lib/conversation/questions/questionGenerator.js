const { mapQuestions } = require('./questionMapper');
const { prioritize } = require('./questionPrioritizer');
const { scoreQuestion } = require('./questionScorer');
const { validateQuestionList } = require('./questionValidator');
const { getTemplate } = require('./questionTemplates');
const { conversationEvents } = require('../conversationEvents');

function generateQuestions(intent, conversationContext = {}, options = {}) {
  const intentType = intent?.type || intent?.intentType || 'default';
  const template = getTemplate(intentType);

  const mapped = mapQuestions(intentType, conversationContext);
  const allQuestions = [...mapped.required, ...mapped.optional];

  allQuestions.forEach((q, i) => { q.id = q.id || `q${i + 1}`; });

  const validationErrors = validateQuestionList(allQuestions);
  if (validationErrors.length && options.strict) {
    return { success: false, error: 'Question validation failed', validationErrors, conversationId: intent?.conversationId };
  }

  const prioritized = prioritize(allQuestions, intentType, options);

  const missingFields = allQuestions.map(q => q.field);

  const result = {
    conversationId: intent?.conversationId || conversationContext?.conversationId || null,
    intentType,
    intentLabel: template.label,
    primaryQuestions: prioritized.primary.map((q, i) => ({
      id: q.id || `q${i + 1}`,
      question: q.question,
      type: q.type,
      priority: q.priority || 1,
      required: q.required !== false,
      reason: q.reason || '',
      options: q.options || undefined,
    })),
    optionalQuestions: prioritized.optional.map((q, i) => ({
      id: q.id || `o${i + 1}`,
      question: q.question,
      type: q.type,
      priority: q.priority || 3,
      required: false,
      reason: q.reason || '',
      options: q.options || undefined,
    })),
    missingFields,
    generatedAt: new Date().toISOString(),
  };

  conversationEvents.emitQuestionsGenerated(intent?.conversationId, {
    questionsCount: result.primaryQuestions.length + result.optionalQuestions.length,
    requiredCount: result.primaryQuestions.length,
    intentType,
  });

  return result;
}

module.exports = { generateQuestions };
