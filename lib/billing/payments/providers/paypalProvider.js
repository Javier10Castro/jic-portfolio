const { BasePaymentProvider } = require('./baseProvider');

class PayPalProvider extends BasePaymentProvider {
  constructor(config = {}) {
    super();
    this._clientId = config.clientId || 'mock_client_id';
    this._secret = config.secret || 'mock_secret';
    this._simulated = config.simulated !== false;
    this._transactions = {};
  }

  charge(options) {
    const { amount, currency = 'usd', customerId, description, metadata } = options;
    if (this._simulated) {
      const transactionId = `PAYID-MOCK-${Date.now()}`;
      const transaction = { transactionId, amount, currency, customerId, description, metadata, status: 'completed', createTime: new Date().toISOString(), provider: 'paypal' };
      this._transactions[transactionId] = transaction;
      return { success: true, transactionId, status: 'completed', transaction };
    }
    return { success: true, transactionId: `PAYID-${Date.now()}`, status: 'completed' };
  }

  refund(transactionId, amount) {
    const txn = this._transactions[transactionId];
    if (!txn) return { success: false, error: 'transaction_not_found' };
    return { success: true, refundId: `REF-${Date.now()}`, amount: amount || txn.amount };
  }

  createCustomer(customerData) {
    return { success: true, customerId: `paypal_${Date.now()}`, ...customerData };
  }

  getTransaction(transactionId) { return this._transactions[transactionId] || null; }
  health() { return { status: 'ok', provider: 'paypal' }; }
}

module.exports = { PayPalProvider };
