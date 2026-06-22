class ScoreNormalizer {
  constructor() {
    this.data = new Map();
  }

  normalize(value, fromScale, toScale) {
    const normalized = (value - fromScale.min) / (fromScale.max - fromScale.min);
    return toScale.min + normalized * (toScale.max - toScale.min);
  }

  zScore(value, mean, stddev) {
    if (stddev === 0) return 0;
    return (value - mean) / stddev;
  }

  percentileRank(value, distribution) {
    const sorted = [...distribution].sort((a, b) => a - b);
    const count = sorted.length;
    if (count === 0) return 0;
    const lessThan = sorted.filter(x => x < value).length;
    const equalTo = sorted.filter(x => x === value).length;
    return (lessThan + 0.5 * equalTo) / count;
  }

  normalizeToScale(values, targetMax) {
    const maxVal = Math.max(...values, 0);
    if (maxVal === 0) return values.map(() => 0);
    const scale = targetMax / maxVal;
    return values.map(v => v * scale);
  }

  aggregate(scores, method) {
    if (!scores || scores.length === 0) return 0;
    switch (method) {
      case 'average':
        return scores.reduce((a, b) => a + b, 0) / scores.length;
      case 'median': {
        const sorted = [...scores].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      }
      case 'weighted':
        return scores.reduce((a, b) => a + b, 0) / scores.length;
      case 'geometric': {
        const product = scores.reduce((a, b) => a * b, 1);
        return Math.pow(product, 1 / scores.length);
      }
      default:
        return 0;
    }
  }

  clear() {
    this.data.clear();
  }
}

module.exports = ScoreNormalizer;
