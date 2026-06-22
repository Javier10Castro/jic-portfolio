class Erp {
  getName() {
    return 'ERP';
  }

  getDescription() {
    return 'An ERP application template';
  }

  getModules() {
    return ['inventory', 'orders', 'procurement', 'manufacturing', 'finance', 'hr', 'crm', 'analytics'];
  }

  getCapabilities() {
    return ['inventory-management', 'order-management', 'procurement', 'manufacturing', 'finance', 'hr', 'crm', 'analytics'];
  }

  getConfig() {
    return {
      name: 'ERP',
      inventory: { tracking: true, warehouses: [] },
      orders: { statuses: ['pending', 'processing', 'shipped', 'delivered'] },
      procurement: { enabled: true },
      manufacturing: { enabled: false },
      finance: { currency: 'USD', taxRate: 0 },
      hr: { enabled: false },
      crm: { enabled: false },
      analytics: { enabled: false },
    };
  }

  apply(customizations) {
    if (!customizations) return this.getConfig();
    const base = this.getConfig();
    return { ...base, ...customizations };
  }
}

module.exports = { Erp };
