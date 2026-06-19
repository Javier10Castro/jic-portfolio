const { scoreQuestion } = require('./questionScorer');

function prioritize(questions, intentType, options = {}) {
  if (!questions || !questions.length) return { primary: [], optional: [] };

  const scored = questions.map((q, idx) => {
    const score = scoreQuestion(q, intentType, options);
    return { ...q, _score: score, _sortKey: `${score.priorityLevel}_${String(100 - score.totalScore).padStart(5, '0')}` };
  });

  scored.sort((a, b) => {
    if (a._score.priorityLevel !== b._score.priorityLevel) {
      return a._score.priorityLevel - b._score.priorityLevel;
    }
    return b._score.totalScore - a._score.totalScore;
  });

  const primary = scored
    .filter(q => q._score.priorityLevel <= 2 || q.required)
    .map(_stripScore);

  const optional = scored
    .filter(q => q._score.priorityLevel > 2 && !q.required)
    .map(_stripScore);

  const maxQuestions = options.maxQuestions || 10;
  return {
    primary: primary.slice(0, Math.min(primary.length, Math.ceil(maxQuestions * 0.6))),
    optional: optional.slice(0, maxQuestions - primary.length),
  };
}

function _stripScore(q) {
  const { _score, ...rest } = q;
  return rest;
}

module.exports = { prioritize };
