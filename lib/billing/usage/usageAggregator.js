class UsageAggregator {
  aggregate(events, options = {}) {
    const grouped = {};
    const granularity = options.granularity || 'total';
    events.forEach(event => {
      const key = granularity === 'total' ? '_total' : this._getTimeBucket(event.timestamp, granularity);
      if (!grouped[key]) grouped[key] = { events: 0, total: 0, bucket: key };
      grouped[key].events++;
      grouped[key].total += event.value || 1;
    });
    const metrics = Object.values(grouped);
    return {
      metrics,
      total: metrics.reduce((s, m) => s + m.total, 0),
      totalEvents: metrics.reduce((s, m) => s + m.events, 0),
      granularity
    };
  }

  aggregateByCustomer(events) {
    const byCustomer = {};
    events.forEach(event => {
      const cid = event.customerId;
      if (!byCustomer[cid]) byCustomer[cid] = { customerId: cid, total: 0, events: 0, eventTypes: {} };
      byCustomer[cid].total += event.value || 1;
      byCustomer[cid].events++;
      const eventType = event.event || 'unknown';
      if (!byCustomer[cid].eventTypes[eventType]) byCustomer[cid].eventTypes[eventType] = 0;
      byCustomer[cid].eventTypes[eventType]++;
    });
    return Object.values(byCustomer);
  }

  aggregateByType(events) {
    const byType = {};
    events.forEach(event => {
      const type = event.event || 'unknown';
      if (!byType[type]) byType[type] = { event: type, total: 0, count: 0 };
      byType[type].total += event.value || 1;
      byType[type].count++;
    });
    return Object.values(byType);
  }

  _getTimeBucket(timestamp, granularity) {
    const d = new Date(timestamp);
    if (granularity === 'hour') return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}T${d.getHours()}:00`;
    if (granularity === 'day') return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    if (granularity === 'month') return `${d.getFullYear()}-${d.getMonth()+1}`;
    return `${d.getFullYear()}`;
  }
}

module.exports = { UsageAggregator };
