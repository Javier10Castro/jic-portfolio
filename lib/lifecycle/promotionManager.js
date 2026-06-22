class PromotionManager {
  constructor() {
    this._promotions = new Map();
    this._projectIndex = new Map();
    this._counter = 0;
  }

  promote(projectId, from, to, options) {
    if (!projectId || !from || !to) {
      throw new Error('projectId, from, and to are required');
    }
    const id = `promo_${++this._counter}`;
    const promotion = {
      id,
      projectId,
      from,
      to,
      status: 'pending',
      options: options || {},
      timestamp: new Date().toISOString(),
      approver: null,
      reason: null
    };
    this._promotions.set(id, promotion);
    if (!this._projectIndex.has(projectId)) {
      this._projectIndex.set(projectId, []);
    }
    this._projectIndex.get(projectId).push(id);
    return promotion;
  }

  approve(promotionId, approver) {
    if (!this._promotions.has(promotionId)) {
      throw new Error(`Promotion "${promotionId}" not found`);
    }
    if (!approver) throw new Error('Approver is required');
    const promotion = this._promotions.get(promotionId);
    if (promotion.status !== 'pending') {
      throw new Error(`Promotion "${promotionId}" is already ${promotion.status}`);
    }
    promotion.status = 'approved';
    promotion.approver = approver;
    return promotion;
  }

  reject(promotionId, approver, reason) {
    if (!this._promotions.has(promotionId)) {
      throw new Error(`Promotion "${promotionId}" not found`);
    }
    if (!approver) throw new Error('Approver is required');
    const promotion = this._promotions.get(promotionId);
    if (promotion.status !== 'pending') {
      throw new Error(`Promotion "${promotionId}" is already ${promotion.status}`);
    }
    promotion.status = 'rejected';
    promotion.approver = approver;
    promotion.reason = reason || null;
    return promotion;
  }

  getPromotion(promotionId) {
    return this._promotions.get(promotionId) || null;
  }

  listPromotions(projectId) {
    if (!this._projectIndex.has(projectId)) return [];
    return this._projectIndex.get(projectId).map(id => this._promotions.get(id));
  }

  getPendingPromotions(projectId) {
    if (!this._projectIndex.has(projectId)) return [];
    return this._projectIndex.get(projectId)
      .map(id => this._promotions.get(id))
      .filter(p => p.status === 'pending');
  }

  clear() {
    this._promotions.clear();
    this._projectIndex.clear();
  }
}

module.exports = { PromotionManager };
