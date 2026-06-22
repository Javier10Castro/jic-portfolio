class ConsistencyEvaluator {
  constructor() {
    this._cache = null;
  }

  evaluate(outputs) {
    if (!outputs || outputs.length < 2) {
      return { score: 1, variance: 0, pairwiseSimilarity: 1, outliers: [] };
    }
    const similarities = [];
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        similarities.push(this._cosineSimilarity(outputs[i], outputs[j]));
      }
    }
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const lengths = outputs.map((o) => o ? o.split(/\s+/).filter(Boolean).length : 0);
    const meanLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + (l - meanLen) ** 2, 0) / lengths.length;
    const outlierIndices = this._findOutliers(lengths);
    const outliers = outlierIndices.map((i) => ({ index: i, text: outputs[i], length: lengths[i] }));
    const score = avgSimilarity * (1 - Math.min(variance / (meanLen + 1), 0.5));
    return { score: Math.round(score * 1000) / 1000, variance: Math.round(variance * 1000) / 1000, pairwiseSimilarity: Math.round(avgSimilarity * 1000) / 1000, outliers };
  }

  comparePair(outputA, outputB) {
    const similarity = this._cosineSimilarity(outputA, outputB);
    const differences = [];
    const aSents = (outputA || '').split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const bSents = (outputB || '').split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const maxLen = Math.max(aSents.length, bSents.length);
    for (let i = 0; i < maxLen; i++) {
      if (!aSents[i]) {
        differences.push({ index: i, type: 'missing_in_a', text: bSents[i].trim() });
      } else if (!bSents[i]) {
        differences.push({ index: i, type: 'missing_in_b', text: aSents[i].trim() });
      } else if (aSents[i].trim().toLowerCase() !== bSents[i].trim().toLowerCase()) {
        differences.push({ index: i, type: 'content_mismatch', textA: aSents[i].trim(), textB: bSents[i].trim() });
      }
    }
    return { similarity: Math.round(similarity * 1000) / 1000, differences };
  }

  getStabilityScore(outputs) {
    if (!outputs || outputs.length < 2) return 1;
    const lengths = outputs.map((o) => o ? o.split(/\s+/).filter(Boolean).length : 0);
    const meanLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + (l - meanLen) ** 2, 0) / lengths.length;
    const cv = meanLen > 0 ? Math.sqrt(variance) / meanLen : 0;
    return Math.round(Math.max(0, 1 - cv) * 1000) / 1000;
  }

  detectOutliers(outputs) {
    if (!outputs || outputs.length < 3) return [];
    const lengths = outputs.map((o) => o ? o.split(/\s+/).filter(Boolean).length : 0);
    const indices = this._findOutliers(lengths);
    return indices.map((i) => ({ index: i, text: outputs[i], length: lengths[i] }));
  }

  _findOutliers(lengths) {
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
    const std = Math.sqrt(variance);
    const outliers = [];
    for (let i = 0; i < lengths.length; i++) {
      if (std > 0 && Math.abs(lengths[i] - mean) / std > 1.5) {
        outliers.push(i);
      }
    }
    return outliers;
  }

  _cosineSimilarity(a, b) {
    if (!a || !b) return 0;
    const tokensA = a.toLowerCase().split(/\W+/).filter(Boolean);
    const tokensB = b.toLowerCase().split(/\W+/).filter(Boolean);
    const freqA = {};
    const freqB = {};
    for (const t of tokensA) freqA[t] = (freqA[t] || 0) + 1;
    for (const t of tokensB) freqB[t] = (freqB[t] || 0) + 1;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    const allTokens = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
    for (const t of allTokens) {
      const aVal = freqA[t] || 0;
      const bVal = freqB[t] || 0;
      dot += aVal * bVal;
      magA += aVal * aVal;
      magB += bVal * bVal;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  clear() {
    this._cache = null;
  }
}

module.exports = { ConsistencyEvaluator };
