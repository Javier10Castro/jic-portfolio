class TransactionManager {
  constructor() {
    this._transactions = new Map();
  }

  begin(name) {
    const id = Date.now() + Math.random().toString(36).slice(2, 9);
    const tx = { id, name: name || 'unnamed', operations: [], status: 'active', startedAt: new Date().toISOString() };
    this._transactions.set(id, tx);
    return tx;
  }

  addOperation(txId, operation) {
    const tx = this._transactions.get(txId);
    if (!tx) return null;
    const op = { type: operation && operation.type, data: operation && operation.data, timestamp: new Date().toISOString() };
    tx.operations.push(op);
    return tx;
  }

  commit(txId) {
    const tx = this._transactions.get(txId);
    if (!tx) return null;
    if (tx.status !== 'active') return null;
    tx.status = 'committed';
    tx.committedAt = new Date().toISOString();
    return tx;
  }

  rollback(txId) {
    const tx = this._transactions.get(txId);
    if (!tx) return null;
    if (tx.status !== 'active') return null;
    tx.status = 'rolled_back';
    tx.rolledBackAt = new Date().toISOString();
    tx.operations = [];
    return tx;
  }

  getTransaction(txId) {
    if (txId == null) return null;
    const tx = this._transactions.get(txId);
    return tx ? { ...tx, operations: [...tx.operations] } : null;
  }

  listTransactions(filters) {
    let list = Array.from(this._transactions.values());
    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        list = list.filter(tx => tx[key] === value);
      });
    }
    return list.map(tx => ({ ...tx, operations: [...tx.operations] }));
  }

  getActiveTransactions() {
    return Array.from(this._transactions.values())
      .filter(tx => tx.status === 'active')
      .map(tx => ({ ...tx, operations: [...tx.operations] }));
  }

  clear() {
    this._transactions.clear();
  }
}

module.exports = { TransactionManager };
