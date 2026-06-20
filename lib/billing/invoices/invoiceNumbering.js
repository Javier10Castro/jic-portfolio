class InvoiceNumbering {
  constructor() {
    this._counters = {};
    this._format = 'INV-{year}{month}-{number}';
  }

  setFormat(format) { this._format = format; }

  nextNumber(prefix = 'INV') {
    const now = new Date();
    const key = `${prefix}-${now.getFullYear()}-${now.getMonth() + 1}`;
    if (!this._counters[key]) this._counters[key] = 0;
    this._counters[key]++;
    return this._formatNumber(prefix, now, this._counters[key]);
  }

  _formatNumber(prefix, date, number) {
    let result = this._format;
    result = result.replace('{prefix}', prefix);
    result = result.replace('{year}', date.getFullYear());
    result = result.replace('{month}', String(date.getMonth() + 1).padStart(2, '0'));
    result = result.replace('{day}', String(date.getDate()).padStart(2, '0'));
    result = result.replace('{number}', String(number).padStart(5, '0'));
    return result;
  }

  getCurrentNumber(prefix = 'INV') {
    const key = `${prefix}-${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
    return this._counters[key] || 0;
  }

  reset() { this._counters = {}; }
}

module.exports = { InvoiceNumbering };
