class DebtRegistry {
  constructor() {
    this._items = new Map();
    this._counter = 0;
  }

  register(evolutionId, item) {
    if (!evolutionId) throw new Error('evolutionId is required');
    if (!item || !item.type) throw new Error('item with type is required');
    const id = 'debt_' + (++this._counter);
    const entry = {
      id, evolutionId,
      type: item.type,
      description: item.description || '',
      severity: item.severity || 'medium',
      estimatedHours: item.estimatedHours || 0,
      category: item.category || 'uncategorized',
      status: 'open',
      createdAt: new Date().toISOString()
    };
    this._items.set(id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._items.get(id) || null;
  }

  list(evolutionId) {
    if (!evolutionId) return Array.from(this._items.values());
    return Array.from(this._items.values()).filter(i => i.evolutionId === evolutionId);
  }

  updateStatus(id, status) {
    if (!id || !status) return null;
    const item = this._items.get(id);
    if (!item) return null;
    item.status = status;
    return item;
  }

  remove(id) {
    if (!id) return false;
    return this._items.delete(id);
  }

  clear() {
    this._items.clear();
    this._counter = 0;
  }
}

module.exports = { DebtRegistry };
