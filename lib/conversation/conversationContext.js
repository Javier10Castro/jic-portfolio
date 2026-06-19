function createContext() {
  return {
    currentIntent: null,
    detectedEntities: [],
    pendingQuestions: [],
    answeredQuestions: [],
    contextVariables: {},
  };
}

function setIntent(context, intent) {
  context.currentIntent = intent;
}

function addEntity(context, entity) {
  if (!entity || !entity.type || !entity.value) return;
  const exists = context.detectedEntities.find(e => e.type === entity.type && e.value === entity.value);
  if (!exists) {
    context.detectedEntities.push({ ...entity, detectedAt: new Date().toISOString() });
  }
}

function addPendingQuestion(context, question) {
  if (!question) return;
  context.pendingQuestions.push({ text: question, askedAt: new Date().toISOString() });
}

function answerQuestion(context, questionText) {
  const idx = context.pendingQuestions.findIndex(q => q.text === questionText);
  if (idx !== -1) {
    const [q] = context.pendingQuestions.splice(idx, 1);
    context.answeredQuestions.push({ ...q, answeredAt: new Date().toISOString() });
  }
}

function setContextVariable(context, key, value) {
  context.contextVariables[key] = value;
}

function getContextVariable(context, key) {
  return context.contextVariables[key];
}

function mergeContext(target, source) {
  if (source.currentIntent) target.currentIntent = source.currentIntent;
  for (const e of (source.detectedEntities || [])) addEntity(target, e);
  for (const q of (source.pendingQuestions || [])) addPendingQuestion(target, q);
  for (const q of (source.answeredQuestions || [])) answerQuestion(target, q.text);
  for (const [k, v] of Object.entries(source.contextVariables || {})) setContextVariable(target, k, v);
}

module.exports = { createContext, setIntent, addEntity, addPendingQuestion, answerQuestion, setContextVariable, getContextVariable, mergeContext };
