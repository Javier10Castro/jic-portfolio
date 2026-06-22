class FeedbackAggregator {
  constructor() {
    this.data = new Map();
  }

  setSource(source, feedbackArray) {
    this.data.set(source, feedbackArray);
  }

  aggregate(source) {
    const feedbacks = this.data.get(source) || [];
    if (feedbacks.length === 0) return { source, count: 0, averageRating: null, breakdown: {} };
    const breakdown = {};
    let ratingSum = 0;
    let ratingCount = 0;
    for (const fb of feedbacks) {
      const type = fb.type || 'generic';
      if (!breakdown[type]) breakdown[type] = { count: 0, ratingSum: 0, ratingCount: 0 };
      breakdown[type].count++;
      if (fb.rating !== undefined && fb.rating !== null) {
        breakdown[type].ratingSum += fb.rating;
        breakdown[type].ratingCount++;
        ratingSum += fb.rating;
        ratingCount++;
      }
    }
    for (const type of Object.keys(breakdown)) {
      const b = breakdown[type];
      b.averageRating = b.ratingCount > 0 ? b.ratingSum / b.ratingCount : null;
    }
    return {
      source,
      count: feedbacks.length,
      averageRating: ratingCount > 0 ? ratingSum / ratingCount : null,
      breakdown,
    };
  }

  getTrends(source) {
    const feedbacks = this.data.get(source) || [];
    if (feedbacks.length === 0) return [];
    const byDay = {};
    for (const fb of feedbacks) {
      const day = fb.timestamp ? fb.timestamp.toISOString().slice(0, 10) : 'unknown';
      if (!byDay[day]) byDay[day] = { ratings: [], count: 0 };
      byDay[day].count++;
      if (fb.rating !== undefined && fb.rating !== null) {
        byDay[day].ratings.push(fb.rating);
      }
    }
    return Object.entries(byDay)
      .map(([day, data]) => ({
        date: day,
        count: data.count,
        averageRating:
          data.ratings.length > 0
            ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
            : null,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getTopIssues(limit) {
    const issues = {};
    for (const [, feedbacks] of this.data) {
      for (const fb of feedbacks) {
        if (fb.data && fb.data.issue) {
          const issue = fb.data.issue;
          issues[issue] = (issues[issue] || 0) + 1;
        }
      }
    }
    return Object.entries(issues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit || 10)
      .map(([issue, count]) => ({ issue, count }));
  }

  getSentiment(feedback) {
    if (!feedback || feedback.length === 0) return { score: 0, label: 'neutral' };
    const ratings = feedback.filter(f => f.rating !== undefined && f.rating !== null).map(f => f.rating);
    if (ratings.length === 0) return { score: 0, label: 'neutral' };
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const score = avg;
    const label = score >= 0.7 ? 'positive' : score >= 0.4 ? 'neutral' : 'negative';
    return { score, label };
  }

  correlate(sourceA, sourceB) {
    const dataA = this.data.get(sourceA) || [];
    const dataB = this.data.get(sourceB) || [];
    const ratingsA = dataA.filter(f => f.rating !== null).map(f => f.rating);
    const ratingsB = dataB.filter(f => f.rating !== null).map(f => f.rating);
    const minLen = Math.min(ratingsA.length, ratingsB.length);
    if (minLen < 2) return { correlation: 0, strength: 'insufficient data' };
    const pairsA = ratingsA.slice(0, minLen);
    const pairsB = ratingsB.slice(0, minLen);
    const meanA = pairsA.reduce((a, b) => a + b, 0) / minLen;
    const meanB = pairsB.reduce((a, b) => a + b, 0) / minLen;
    let num = 0;
    let denA = 0;
    let denB = 0;
    for (let i = 0; i < minLen; i++) {
      const devA = pairsA[i] - meanA;
      const devB = pairsB[i] - meanB;
      num += devA * devB;
      denA += devA * devA;
      denB += devB * devB;
    }
    const denom = Math.sqrt(denA * denB);
    const correlation = denom === 0 ? 0 : num / denom;
    const strength = Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.4 ? 'moderate' : 'weak';
    return { correlation, strength };
  }

  clear() {
    this.data.clear();
  }
}

module.exports = FeedbackAggregator;
