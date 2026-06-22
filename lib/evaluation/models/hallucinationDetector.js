class HallucinationDetector {
  constructor() {
    this._evaluations = [];
  }

  evaluate(output, context) {
    const spans = [];
    let hallucinated = false;
    if (!output || !context) {
      return { hallucinated: true, score: 1, spans: [{ text: output || '', reason: 'No context provided for verification', confidence: 1 }] };
    }
    const ctxLower = context.toLowerCase();
    const sentences = output.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      const keywords = trimmed.toLowerCase().split(/\W+/).filter(Boolean);
      const supported = keywords.some((kw) => ctxLower.includes(kw));
      if (!supported && keywords.length > 0) {
        hallucinated = true;
        spans.push({ text: trimmed, reason: 'Claim not found in provided context', confidence: 0.7 });
      }
    }
    const score = spans.length / Math.max(sentences.length, 1);
    this._evaluations.push({ output, context, score, spans });
    return { hallucinated, score: Math.round(score * 1000) / 1000, spans };
  }

  checkFactualConsistency(output, facts) {
    const contradictions = [];
    if (!output || !facts) return { consistent: true, contradictions: [] };
    const outLower = output.toLowerCase();
    for (const fact of Array.isArray(facts) ? facts : [facts]) {
      const factText = typeof fact === 'string' ? fact : fact.text;
      if (factText) {
        const factWords = factText.toLowerCase().split(/\W+/).filter(Boolean);
        const negationWords = ['not', 'no', 'never', 'cannot', "can't", "doesn't", 'without'];
        const sentenceHasNegation = negationWords.some((n) => outLower.includes(n));
        const factHasNegation = negationWords.some((n) => factText.toLowerCase().includes(n));
        if (sentenceHasNegation !== factHasNegation) {
          contradictions.push({ fact: factText, outputClaim: output, reason: 'Contradictory claim detected' });
        }
      }
    }
    return { consistent: contradictions.length === 0, contradictions };
  }

  checkInternalConsistency(output) {
    const contradictions = [];
    if (!output) return { consistent: true, contradictions: [] };
    const sentences = output.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const a = sentences[i].trim().toLowerCase();
        const b = sentences[j].trim().toLowerCase();
        const negationWords = ['not', 'no', 'never', 'cannot', "can't", "doesn't", 'without'];
        const aNegation = negationWords.some((n) => a.includes(n));
        const bNegation = negationWords.some((n) => b.includes(n));
        const aWords = new Set(a.split(/\W+/).filter(Boolean));
        const bWords = new Set(b.split(/\W+/).filter(Boolean));
        const common = [...aWords].filter((w) => bWords.has(w) && w.length > 3);
        if (common.length >= 2 && aNegation !== bNegation) {
          contradictions.push({
            sentenceA: sentences[i].trim(),
            sentenceB: sentences[j].trim(),
            reason: `Self-contradiction on: ${common.slice(0, 3).join(', ')}`,
          });
        }
      }
    }
    return { consistent: contradictions.length === 0, contradictions };
  }

  getStats() {
    if (this._evaluations.length === 0) {
      return { totalEvaluations: 0, hallucinationRate: 0, avgScore: 0 };
    }
    const hallucinatedCount = this._evaluations.filter((e) => e.score > 0).length;
    const avgScore = this._evaluations.reduce((s, e) => s + e.score, 0) / this._evaluations.length;
    return {
      totalEvaluations: this._evaluations.length,
      hallucinationRate: Math.round((hallucinatedCount / this._evaluations.length) * 1000) / 1000,
      avgScore: Math.round(avgScore * 1000) / 1000,
      totalSpans: this._evaluations.reduce((s, e) => s + e.spans.length, 0),
    };
  }

  clear() {
    this._evaluations = [];
  }
}

module.exports = { HallucinationDetector };
