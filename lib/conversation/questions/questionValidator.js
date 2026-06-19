const { QUESTION_TYPES } = require('./questionTemplates');

function validateQuestion(q, index) {
  const errors = [];
  if (!q || typeof q !== 'object') {
    return [`Question at index ${index} must be an object`];
  }
  if (!q.field) errors.push(`Question at index ${index} missing field name`);
  if (!q.question || typeof q.question !== 'string') {
    errors.push(`Question at index ${index} missing or invalid question text`);
  }
  if (!q.type || !QUESTION_TYPES.includes(q.type)) {
    errors.push(`Question at index ${index} invalid type "${q.type}". Valid: ${QUESTION_TYPES.join(', ')}`);
  }
  if (q.priority != null && ![1, 2, 3].includes(q.priority)) {
    errors.push(`Question at index ${index} priority must be 1, 2, or 3`);
  }
  if (q.type === 'choice' && (!Array.isArray(q.options) || !q.options.length)) {
    errors.push(`Question at index ${index} of type 'choice' must have options array`);
  }
  if (q.type === 'multi_choice' && (!Array.isArray(q.options) || !q.options.length)) {
    errors.push(`Question at index ${index} of type 'multi_choice' must have options array`);
  }
  if (q.type === 'scale') {
    if (q.min == null || q.max == null) {
      errors.push(`Question at index ${index} of type 'scale' must have min and max`);
    }
  }
  if (q.required != null && typeof q.required !== 'boolean') {
    errors.push(`Question at index ${index} required must be boolean`);
  }
  return errors;
}

function validateQuestionList(questions) {
  if (!Array.isArray(questions)) return ['Questions must be an array'];
  const errors = [];
  for (let i = 0; i < questions.length; i++) {
    errors.push(...validateQuestion(questions[i], i));
  }
  return errors;
}

module.exports = { validateQuestion, validateQuestionList };
