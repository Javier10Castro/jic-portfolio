class CohortAnalyzer {
  analyze(subscriptions, options = {}) {
    const cohorts = {};
    subscriptions.forEach(sub => {
      const created = new Date(sub.createdAt);
      const cohort = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (!cohorts[cohort]) cohorts[cohort] = { cohort, customers: 0, active: 0, canceled: 0, revenue: 0, retention: [] };
      cohorts[cohort].customers++;
      if (sub.status === 'active') cohorts[cohort].active++;
      if (sub.status === 'canceled') cohorts[cohort].canceled++;
      const price = sub.price || (sub.prices && sub.prices[sub.interval]) || 0;
      cohorts[cohort].revenue += sub.interval === 'yearly' ? price / 12 : price;
    });
    return {
      cohorts: Object.values(cohorts).map(c => ({
        ...c, revenue: Math.round(c.revenue * 100) / 100,
        retentionRate: c.customers > 0 ? Math.round((c.active / c.customers) * 10000) / 100 : 0
      })),
      totalCohorts: Object.keys(cohorts).length,
      calculatedAt: Date.now()
    };
  }

  retentionCohort(subscriptions) {
    const cohorts = {};
    subscriptions.forEach(sub => {
      const created = new Date(sub.createdAt);
      const cohort = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (!cohorts[cohort]) cohorts[cohort] = { cohort, month0: 0, month1: 0, month2: 0, month3: 0, month6: 0, month12: 0 };
      cohorts[cohort].month0++;
      const monthsSinceCreation = (Date.now() - sub.createdAt) / (30 * 86400000);
      if (sub.status === 'active' || sub.status === 'canceled') {
        if (monthsSinceCreation >= 1) cohorts[cohort].month1++;
        if (monthsSinceCreation >= 2) cohorts[cohort].month2++;
        if (monthsSinceCreation >= 3) cohorts[cohort].month3++;
        if (monthsSinceCreation >= 6) cohorts[cohort].month6++;
        if (monthsSinceCreation >= 12) cohorts[cohort].month12++;
      }
    });
    return Object.values(cohorts);
  }
}

module.exports = { CohortAnalyzer };
