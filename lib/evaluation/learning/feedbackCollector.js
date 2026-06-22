class FeedbackCollector {
  constructor() {
    this.feedback = new Map();
  }

  collect(source, data) {
    const id = 'fb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const entry = {
      id,
      source,
      data,
      type: data.type || 'generic',
      rating: data.rating || null,
      timestamp: new Date(),
    };
    this.feedback.set(id, entry);
    return entry;
  }

  getFeedback(id) {
    return this.feedback.get(id) || null;
  }

  query(filter) {
    let results = Array.from(this.feedback.values());
    if (filter) {
      if (filter.source) results = results.filter(f => f.source === filter.source);
      if (filter.type) results = results.filter(f => f.type === filter.type);
      if (filter.rating) results = results.filter(f => f.rating === filter.rating);
      if (filter.since) results = results.filter(f => f.timestamp >= new Date(filter.since));
    }
    return results;
  }

  getStats() {
    const all = Array.from(this.feedback.values());
    if (all.length === 0) {
      return { total: 0, bySource: {}, byType: {}, averageRating: null };
    }
    const bySource = {};
    const byType = {};
    let ratingSum = 0;
    let ratingCount = 0;
    for (const fb of all) {
      bySource[fb.source] = (bySource[fb.source] || 0) + 1;
      byType[fb.type] = (byType[fb.type] || 0) + 1;
      if (fb.rating !== null) {
        ratingSum += fb.rating;
        ratingCount++;
      }
    }
    return {
      total: all.length,
      bySource,
      byType,
      averageRating: ratingCount > 0 ? ratingSum / ratingCount : null,
    };
  }

  clear() {
    this.feedback.clear();
  }
}

module.exports = FeedbackCollector;
