class GovernanceIntegration {
  constructor(manager) {
    this._manager = manager;
    this._enabled = true;
    this._evaluationLog = [];
  }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }
  isEnabled() { return this._enabled; }

  async checkAIRouting(context) { return this._evaluate('ai-routing', context); }
  async checkAgent(agentContext) { return this._evaluate('agent', agentContext); }
  async checkWorkflow(workflowContext) { return this._evaluate('workflow', workflowContext); }
  async checkBilling(billingContext) { return this._evaluate('billing', billingContext); }
  async checkDeveloper(developerContext) { return this._evaluate('developer', developerContext); }
  async checkPlugin(pluginContext) { return this._evaluate('plugin', pluginContext); }
  async checkMarketplace(marketplaceContext) { return this._evaluate('marketplace', marketplaceContext); }
  async checkIntegration(integrationContext) { return this._evaluate('integration', integrationContext); }
  async checkSecurity(securityContext) { return this._evaluate('security', securityContext); }
  async checkDeployment(deploymentContext) { return this._evaluate('deployment', deploymentContext); }
  async checkEvaluation(evaluationContext) { return this._evaluate('evaluation', evaluationContext); }
  async checkData(dataContext) { return this._evaluate('data', dataContext); }

  _evaluate(type, data) {
    if (!this._enabled) return { allowed: true, simulation: true };
    var result = this._manager ? this._manager.evaluateAll(data) : { matched: [], warnings: [] };
    var matched = result.matched || [];
    var blocked = [];
    for (var i = 0; i < matched.length; i++) {
      if (matched[i].enforcement === 'hard') blocked.push(matched[i]);
    }
    if (blocked.length > 0) {
      this._log('blocked', type, blocked);
      return { allowed: false, blocked: blocked, warnings: result.warnings || [] };
    }
    if (result.warnings && result.warnings.length > 0) {
      this._log('warned', type, result.warnings);
    }
    return { allowed: true, warnings: result.warnings || [] };
  }

  _log(action, type, details) {
    this._evaluationLog.push({ action: action, type: type, details: details, timestamp: Date.now() });
    if (this._evaluationLog.length > 1000) this._evaluationLog.shift();
  }

  getLog(filters) {
    var log = this._evaluationLog;
    if (filters) {
      if (filters.type) log = log.filter(function(e) { return e.type === filters.type; });
      if (filters.action) log = log.filter(function(e) { return e.action === filters.action; });
      if (filters.since) log = log.filter(function(e) { return e.timestamp >= filters.since; });
    }
    return log;
  }

  getStats() {
    var total = this._evaluationLog.length;
    var byType = {};
    var blocked = 0;
    var warned = 0;
    for (var i = 0; i < this._evaluationLog.length; i++) {
      var entry = this._evaluationLog[i];
      if (!byType[entry.type]) byType[entry.type] = 0;
      byType[entry.type]++;
      if (entry.action === 'blocked') blocked++;
      if (entry.action === 'warned') warned++;
    }
    return { total: total, byType: byType, blocked: blocked, warned: warned };
  }

  clear() { this._evaluationLog = []; }
}

module.exports = { GovernanceIntegration };
