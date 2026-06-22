class Crm {
  getName() {
    return 'CRM';
  }

  getDescription() {
    return 'A CRM application template';
  }

  getModules() {
    return ['contacts', 'deals', 'pipeline', 'tasks', 'analytics', 'email', 'calendar'];
  }

  getCapabilities() {
    return ['contact-management', 'deal-tracking', 'pipeline-management', 'task-management', 'analytics', 'email-integration', 'calendar-integration'];
  }

  getConfig() {
    return {
      name: 'CRM',
      contacts: { fields: ['name', 'email', 'phone'] },
      deals: { stages: ['lead', 'qualified', 'proposal', 'negotiation', 'closed'] },
      pipeline: { view: 'kanban' },
      tasks: { enabled: true },
      analytics: { enabled: false },
      email: { provider: null },
      calendar: { provider: null },
    };
  }

  apply(customizations) {
    if (!customizations) return this.getConfig();
    const base = this.getConfig();
    return { ...base, ...customizations };
  }
}

module.exports = { Crm };
