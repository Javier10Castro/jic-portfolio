const { BasePaymentProvider } = require('./baseProvider');

class ManualProvider extends BasePaymentProvider {
  constructor(config = {}) {
    super();
    this._config = config;
    this._transactions = {};
  }

  charge(options) {
    const { amount, currency = 'usd', customerId, description, metadata } = options;
    const transactionId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const transaction = {
      transactionId, amount, currency, customerId, description, metadata,
      status: 'pending', provider: 'manual', created: Date.now(),
      instructions: this._config.instructions || 'Awaiting manual payment confirmation'
    };
    this._transactions[transactionId] = transaction;
    return { success: true, transactionId, status: 'pending', transaction, instructions: transaction.instructions };
  }

  confirmPayment(transactionId) {
    const txn = this._transactions[transactionId];
    if (!txn) return { success: false, error: 'transaction_not_found' };
    txn.status = 'succeeded';
    txn.confirmedAt = Date.now();
    return { success: true, transaction: txn };
  }

  refund(transactionId, amount) {
    const txn = this._transactions[transactionId];
    if (!txn) return { success: false, error: 'transaction_not_found' };
    return { success: true, refundId: `manual_ref_${Date.now()}`, amount: amount || txn.amount };
  }

  getTransaction(transactionId) { return this._transactions[transactionId] || null; }
  health() { return { status: 'ok', provider: 'manual' }; }
}

module.exports = { ManualProvider };
