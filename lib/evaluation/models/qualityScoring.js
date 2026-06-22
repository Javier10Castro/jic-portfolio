class QualityScoring {
  constructor() {
    this._cache = null;
  }

  score(output, expected, rubric) {
    const relevance = this.scoreRelevance(output, expected);
    const coherence = this.scoreCoherence(output);
    const completeness = this.scoreCompleteness(output, expected);
    const clarity = this.scoreClarity(output);
    const dimensions = { relevance, coherence, completeness, clarity };
    const overall = Object.values(dimensions).reduce((a, b) => a + b, 0) / 4;
    return { overall, dimensions };
  }

  scoreRelevance(output, expected) {
    if (!output || !expected) return 0;
    const outWords = new Set(output.toLowerCase().split(/\W+/).filter(Boolean));
    const expWords = new Set(expected.toLowerCase().split(/\W+/).filter(Boolean));
    if (expWords.size === 0) return 1;
    let matches = 0;
    for (const w of expWords) {
      if (outWords.has(w)) matches++;
    }
    return matches / expWords.size;
  }

  scoreCoherence(output) {
    if (!output) return 0;
    const sentences = output.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length <= 1) return 1;
    let transitions = 0;
    const transitionWords = new Set([
      'however', 'therefore', 'furthermore', 'moreover', 'consequently',
      'additionally', 'meanwhile', 'nevertheless', 'accordingly', 'besides',
      'hence', 'thus', 'otherwise', 'indeed', 'likewise',
    ]);
    for (const s of sentences) {
      const first = s.trim().toLowerCase().split(/\W+/).shift();
      if (transitionWords.has(first)) transitions++;
    }
    return Math.min(1, transitions / Math.max(1, sentences.length - 1) + 0.5);
  }

  scoreCompleteness(output, expected) {
    if (!output) return 0;
    if (!expected) return 1;
    const expParts = expected.split(/\n+/).filter((p) => p.trim().length > 0);
    if (expParts.length === 0) return 1;
    let covered = 0;
    for (const part of expParts) {
      const keywords = part.toLowerCase().split(/\W+/).filter(Boolean);
      const present = keywords.some((kw) => output.toLowerCase().includes(kw));
      if (present) covered++;
    }
    return covered / expParts.length;
  }

  scoreClarity(output) {
    if (!output) return 0;
    const sentences = output.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    const avgWords = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length;
    if (avgWords <= 8) return 1;
    if (avgWords >= 30) return 0.2;
    return 1 - (avgWords - 8) / 22 * 0.8;
  }

  aggregate(scores) {
    if (!scores || scores.length === 0) return { overall: 0, dimensions: { relevance: 0, coherence: 0, completeness: 0, clarity: 0 } };
    const dims = ['relevance', 'coherence', 'completeness', 'clarity'];
    const totals = { relevance: 0, coherence: 0, completeness: 0, clarity: 0 };
    let overallSum = 0;
    for (const s of scores) {
      for (const d of dims) {
        totals[d] += s.dimensions?.[d] || 0;
      }
      overallSum += s.overall || 0;
    }
    const n = scores.length;
    const dimensions = {};
    for (const d of dims) {
      dimensions[d] = totals[d] / n;
    }
    return { overall: overallSum / n, dimensions };
  }

  clear() {
    this._cache = null;
  }
}

module.exports = { QualityScoring };
