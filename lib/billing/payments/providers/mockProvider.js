const { BasePaymentProvider } = require('./baseProvider');

class MockProvider extends BasePaymentProvider {
  constructor(config = {}) {
    super();
    this._failRate = config.failRate || 0;
    this._transactions = {};
  }

  charge(options) {
    const { amount, currency = 'usd', customerId, description, metadata } = options;
    const shouldFail = this._failRate > 0 && Math.random() < this._failRate;
    if (shouldFail) return { success: false, error: 'card_declined', status: 'failed' };
    const transactionId = `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const transaction = { transactionId, amount, currency, customerId, description, metadata, status: 'succeeded', created: Date.now(), provider: 'mock' };
    this._transactions[transactionId] = transaction;
    return { success: true, transactionId, status: 'succeeded', transaction };
  }

  refund(transactionId, amount) {
    const txn = this._transactions[transactionId];
    if (!txn) return { success: false, error: 'transaction_not_found' };
    return { success: true, refundId: `mock_ref_${Date.now()}`, amount: amount || txn.amount };
  }

  createCustomer(customerData) { return { success: true, customerId: `mock_cus_${Date.now()}`, ...customerData }; }
  getTransaction(transactionId) { return this._transactions[transactionId] || null; }
  health() { return { status: 'ok', provider: 'mock' }; }
  setFailRate(rate) { this._failRate = rate; }
}

module.exports = { MockProvider };
