const { getTemplate, GENERIC_QUESTIONS } = require('./questionTemplates');

function mapQuestions(intentType, conversationContext = {}) {
  const template = getTemplate(intentType);
  const contextVars = conversationContext.contextVariables || {};
  const answeredFields = (conversationContext.answeredQuestions || []).map(q => {
    if (typeof q === 'string') return q;
    return q.text || q.field || '';
  });
  const pendingFields = (conversationContext.pendingQuestions || []).map(q => {
    if (typeof q === 'string') return q;
    return q.text || q.field || '';
  });
  const entities = conversationContext.detectedEntities || [];

  const knownFields = new Set();
  for (const [key, val] of Object.entries(contextVars)) {
    if (val) knownFields.add(key);
  }
  for (const e of entities) {
    if (e.value) knownFields.add(e.type);
  }
  for (const f of answeredFields) {
    knownFields.add(f);
  }

  const fieldToQuestion = (tpl) => ({
    field: tpl.field,
    question: tpl.question,
    type: tpl.type,
    reason: tpl.reason,
    options: tpl.options || undefined,
  });

  const required = [];
  const optional = [];

  for (const q of (template.required || [])) {
    const isKnown = knownFields.has(q.field);
    const isPending = pendingFields.some(p => p.includes(q.field) || q.field.includes(p));
    if (!isKnown && !isPending) {
      required.push({ ...fieldToQuestion(q), priority: 1, required: true });
    }
  }

  for (const q of (template.optional || [])) {
    const isKnown = knownFields.has(q.field);
    const isPending = pendingFields.some(p => p.includes(q.field) || q.field.includes(p));
    if (!isKnown && !isPending) {
      optional.push({ ...fieldToQuestion(q), priority: 3, required: false });
    }
  }

  for (const q of GENERIC_QUESTIONS) {
    const isKnown = knownFields.has(q.field);
    const isPending = pendingFields.some(p => p.includes(q.field) || q.field.includes(p));
    if (!isKnown && !isPending) {
      const prio = q.priority_adjustment || 3;
      optional.push({ ...fieldToQuestion(q), priority: prio, required: false });
    }
  }

  return { required, optional };
}

module.exports = { mapQuestions };
