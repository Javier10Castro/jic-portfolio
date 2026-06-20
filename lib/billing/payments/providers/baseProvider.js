class BasePaymentProvider {
  charge(options) { throw new Error('Not implemented — charge() must be overridden'); }
  refund(transactionId, amount, options) { throw new Error('Not implemented'); }
  createCustomer(customerData) { throw new Error('Not implemented'); }
  getTransaction(transactionId) { throw new Error('Not implemented'); }
  health() { return { status: 'ok', provider: 'base' }; }
}

module.exports = { BasePaymentProvider };
