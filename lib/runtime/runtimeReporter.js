class RuntimeReporter {
  constructor() {
    this._reports = new Map();
    this._nextId = 1;
  }

  generateReport(data) {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const sections = [];
    const keys = Object.keys(data);
    for (const key of keys) {
      sections.push({
        title: key,
        content: data[key],
      });
    }
    const report = {
      id: this._nextId++,
      timestamp: Date.now(),
      summary: 'Runtime report generated with ' + sections.length + ' section(s)',
      sections: sections,
    };
    this._reports.set(report.id, report);
    return report;
  }

  getReport(id) {
    if (!this._reports.has(id)) {
      return null;
    }
    return this._reports.get(id);
  }

  listReports() {
    const result = [];
    for (const [, report] of this._reports) {
      result.push({
        id: report.id,
        timestamp: report.timestamp,
        summary: report.summary,
      });
    }
    return result;
  }

  exportJSON(id) {
    if (!this._reports.has(id)) {
      return null;
    }
    const report = this._reports.get(id);
    return JSON.stringify(report);
  }

  clear() {
    this._reports.clear();
    this._nextId = 1;
  }
}

module.exports = { RuntimeReporter };
