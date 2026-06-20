const { BasePaymentProvider } = require('./baseProvider');

class StripeProvider extends BasePaymentProvider {
  constructor(config = {}) {
    super();
    this._apiKey = config.apiKey || 'sk_test_mock';
    this._webhookSecret = config.webhookSecret || 'whsec_mock';
    this._simulated = config.simulated !== false;
    this._transactions = {};
  }

  charge(options) {
    const { amount, currency = 'usd', customerId, method = 'card', description, metadata } = options;
    if (this._simulated) {
      const transactionId = `ch_mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const transaction = { transactionId, amount, currency, customerId, method, description, metadata, status: 'succeeded', created: Date.now(), provider: 'stripe' };
      this._transactions[transactionId] = transaction;
      return { success: true, transactionId, status: 'succeeded', transaction };
    }
    return { success: true, transactionId: `ch_${Date.now()}`, status: 'succeeded' };
  }

  refund(transactionId, amount) {
    const txn = this._transactions[transactionId];
    if (!txn) return { success: false, error: 'transaction_not_found' };
    return { success: true, refundId: `ref_mock_${Date.now()}`, amount: amount || txn.amount };
  }

  createCustomer(customerData) {
    return { success: true, customerId: `cus_mock_${Date.now()}`, ...customerData };
  }

  getTransaction(transactionId) { return this._transactions[transactionId] || null; }
  health() { return { status: 'ok', provider: 'stripe' }; }
}

module.exports = { StripeProvider };
