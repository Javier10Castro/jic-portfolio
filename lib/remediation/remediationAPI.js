class RemediationAPI {
  constructor(engine) {
    this._engine = engine;
  }

  getRoutes() {
    return [
      { method: 'GET', path: '/api/v1/remediation/health', handler: this._getHealth.bind(this) },
      { method: 'GET', path: '/api/v1/remediation/policies', handler: this._listPolicies.bind(this) },
      { method: 'GET', path: '/api/v1/remediation/policies/:id', handler: this._getPolicy.bind(this) },
      { method: 'POST', path: '/api/v1/remediation/policies', handler: this._createPolicy.bind(this) },
      { method: 'PUT', path: '/api/v1/remediation/policies/:id', handler: this._updatePolicy.bind(this) },
      { method: 'DELETE', path: '/api/v1/remediation/policies/:id', handler: this._deletePolicy.bind(this) },
      { method: 'POST', path: '/api/v1/remediation/actions/execute', handler: this._executeAction.bind(this) },
      { method: 'GET', path: '/api/v1/remediation/actions', handler: this._listActions.bind(this) },
      { method: 'GET', path: '/api/v1/remediation/actions/:id', handler: this._getActionMeta.bind(this) },
      { method: 'GET', path: '/api/v1/remediation/history', handler: this._getHistory.bind(this) },
      { method: 'GET', path: '/api/v1/remediation/history/stats', handler: this._getHistoryStats.bind(this) },
      { method: 'GET', path: '/api/v1/remediation/approvals', handler: this._listApprovals.bind(this) },
      { method: 'POST', path: '/api/v1/remediation/approvals/:id/approve', handler: this._approveAction.bind(this) },
      { method: 'POST', path: '/api/v1/remediation/approvals/:id/reject', handler: this._rejectAction.bind(this) },
    ];
  }

  _getHealth(req, res) {
    return { success: true, data: this._engine.getHealth() };
  }

  _listPolicies(req, res) {
    const filter = {};
    if (req.query.enabled !== undefined) filter.enabled = req.query.enabled === 'true';
    if (req.query.action) filter.action = req.query.action;
    const policies = this._engine.policies.getPolicies(filter);
    return { success: true, data: policies };
  }

  _getPolicy(req, res) {
    const policy = this._engine.policies.getPolicy(req.params.id);
    if (!policy) return { success: false, errors: [{ message: 'Policy not found' }] };
    return { success: true, data: policy };
  }

  _createPolicy(req, res) {
    try {
      const policy = this._engine.policies.addPolicy(req.body);
      return { success: true, data: policy };
    } catch (e) {
      return { success: false, errors: [{ message: e.message }] };
    }
  }

  _updatePolicy(req, res) {
    try {
      const policy = this._engine.policies.updatePolicy(req.params.id, req.body);
      return { success: true, data: policy };
    } catch (e) {
      return { success: false, errors: [{ message: e.message }] };
    }
  }

  _deletePolicy(req, res) {
    try {
      this._engine.policies.removePolicy(req.params.id);
      return { success: true, data: { deleted: true } };
    } catch (e) {
      return { success: false, errors: [{ message: e.message }] };
    }
  }

  async _executeAction(req, res) {
    const { action, params } = req.body;
    if (!action) return { success: false, errors: [{ message: 'Action key is required' }] };
    const meta = this._engine.actions.getActionMeta(action);
    if (!meta) return { success: false, errors: [{ message: `Unknown action: ${action}` }] };
    const result = await this._engine.actions.execute(action, params || {}, { manual: true });
    return { success: result.success, data: result };
  }

  _listActions(req, res) {
    return { success: true, data: this._engine.actions.getAllActionMeta() };
  }

  _getActionMeta(req, res) {
    const meta = this._engine.actions.getActionMeta(req.params.id);
    if (!meta) return { success: false, errors: [{ message: 'Action not found' }] };
    return { success: true, data: { key: req.params.id, ...meta } };
  }

  _getHistory(req, res) {
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.success !== undefined) filter.success = req.query.success === 'true';
    if (req.query.since) filter.since = parseInt(req.query.since);
    if (req.query.policyId) filter.policyId = req.query.policyId;
    if (req.query.limit) filter.limit = parseInt(req.query.limit);
    return { success: true, data: this._engine.store.getHistory(filter) };
  }

  _getHistoryStats(req, res) {
    return { success: true, data: this._engine.store.getHistoryStats() };
  }

  _listApprovals(req, res) {
    return { success: true, data: this._engine.getPendingApprovals() };
  }

  async _approveAction(req, res) {
    try {
      const result = await this._engine.approveAction(req.params.id);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, errors: [{ message: e.message }] };
    }
  }

  async _rejectAction(req, res) {
    try {
      const result = await this._engine.rejectAction(req.params.id);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, errors: [{ message: e.message }] };
    }
  }
}

module.exports = RemediationAPI;
