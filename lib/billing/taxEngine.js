class TaxEngine {
  constructor() {
    this._taxRates = {};
    this._defaultTaxRate = 0;
  }

  registerTaxRate(region, rate, options = {}) {
    this._taxRates[region] = { rate, name: options.name || 'Tax', inclusive: options.inclusive || false };
  }

  calculateTax(amount, region, options = {}) {
    const taxConfig = this._taxRates[region] || { rate: this._defaultTaxRate, name: 'Tax', inclusive: false };
    const rate = options.rate !== undefined ? options.rate : taxConfig.rate;
    const inclusive = options.inclusive !== undefined ? options.inclusive : taxConfig.inclusive;
    const taxAmount = inclusive ? amount - (amount / (1 + rate)) : amount * rate;
    return {
      amount: Math.round(taxAmount * 100) / 100,
      rate,
      region,
      name: taxConfig.name,
      inclusive,
      total: inclusive ? amount : amount + Math.round(taxAmount * 100) / 100
    };
  }

  setDefaultRate(rate) { this._defaultTaxRate = rate; }
  getTaxRate(region) { return this._taxRates[region] || null; }
  listRegions() { return Object.keys(this._taxRates); }
  clear() { this._taxRates = {}; this._defaultTaxRate = 0; }
}

module.exports = { TaxEngine };
