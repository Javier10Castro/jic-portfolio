const RATES = { text: 0.25, char: 0.25, word: 1.3, code: 0.75 };

function estimateTokens(text, type = 'text') {
  if (!text) return 0;
  const str = String(text);
  const charCount = str.length;
  const wordCount = str.split(/\s+/).filter(Boolean).length;
  const codeTokens = (str.match(/[{}();\][<>]/g) || []).length;

  const rate = RATES[type] || RATES.text;
  return Math.ceil((charCount * 0.25 + wordCount * rate + codeTokens * 0.5));
}

function estimateMessages(messages) {
  if (!Array.isArray(messages)) return estimateTokens(messages);
  return messages.reduce((sum, msg) => {
    return sum + estimateTokens(msg.content || msg.text || '');
  }, 0);
}

function estimateCost(inputTokens, outputTokens, modelCosts) {
  const inputCost = (inputTokens / 1000) * (modelCosts.costPer1kInput || 0);
  const outputCost = (outputTokens / 1000) * (modelCosts.costPer1kOutput || 0);
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

module.exports = { estimateTokens, estimateMessages, estimateCost };
