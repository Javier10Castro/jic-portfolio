class DatasetExporter {
  constructor() {
    this.data = new Map();
  }

  setEntries(entries) {
    this.entries = entries;
  }

  exportJSON(datasetName) {
    const entries = this._getEntries(datasetName);
    return JSON.stringify(entries, null, 2);
  }

  exportCSV(datasetName) {
    const entries = this._getEntries(datasetName);
    if (entries.length === 0) return '';
    const headers = Object.keys(entries[0]);
    const lines = [headers.join(',')];
    for (const entry of entries) {
      const values = headers.map(h => {
        const v = entry[h];
        const str = v !== undefined && v !== null ? String(v) : '';
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      });
      lines.push(values.join(','));
    }
    return lines.join('\n');
  }

  exportSplit(datasetName, trainPercent) {
    const entries = this._getEntries(datasetName);
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * (trainPercent / 100));
    return {
      train: shuffled.slice(0, splitIndex),
      test: shuffled.slice(splitIndex),
    };
  }

  exportSample(datasetName, count) {
    const entries = this._getEntries(datasetName);
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  clear() {
    this.data.clear();
    this.entries = [];
  }

  _getEntries(datasetName) {
    return this.data.get(datasetName) || this.entries || [];
  }
}

module.exports = DatasetExporter;
