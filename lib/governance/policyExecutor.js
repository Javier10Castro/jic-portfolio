class PolicyExecutor {
  constructor() {
    this._log = [];
    this._handlers = new Map();
  }

  execute(policy, evaluation, context) {
    if (!policy || !evaluation) {
      return { policyId: policy ? policy.id : null, matched: false, actions: [] };
    }
    const executed = [];
    const actions = policy.actions || [];

    for (const action of actions) {
      const result = this.executeAction(action, context);
      executed.push({ type: action.type, executed: true, result, action });
    }

    const entry = {
      policyId: policy.id,
      matched: evaluation.matched,
      actions: executed,
      timestamp: new Date().toISOString(),
      context: context || {}
    };
    this._log.push(entry);
    return { policyId: policy.id, matched: evaluation.matched, actions: executed };
  }

  executeAction(action, context) {
    if (!action || !action.type) return { error: 'Invalid action' };

    switch (action.type) {
      case 'deny': {
        const err = new Error(action.message || 'Policy denial');
        err.code = 'POLICY_DENIED';
        err.action = action;
        throw err;
      }
      case 'warn':
        return { type: 'warn', message: action.message || 'Policy warning', warning: true };
      case 'notify': {
        const event = { type: 'policy_notify', action, context };
        if (this._handlers.has('notify')) {
          this._handlers.get('notify').forEach(h => h(event));
        }
        return { type: 'notify', emitted: true, message: action.message || '' };
      }
      case 'log':
        return { type: 'log', recorded: true, message: action.message || '' };
      case 'require_approval': {
        const approval = {
          id: `appr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          action: action.type,
          message: action.message || 'Approval required',
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        return { type: 'require_approval', approval, message: action.message || '' };
      }
      case 'block': {
        const err = new Error(action.message || 'Action blocked by policy');
        err.code = 'POLICY_BLOCKED';
        err.action = action;
        throw err;
      }
      case 'quarantine':
        return { type: 'quarantine', quarantined: true, message: action.message || '' };
      case 'flag':
        return { type: 'flag', flagged: true, message: action.message || '' };
      default:
        return { type: action.type, executed: false, error: `Unknown action type: ${action.type}` };
    }
  }

  on(event, handler) {
    if (!this._handlers.has(event)) this._handlers.set(event, []);
    this._handlers.get(event).push(handler);
  }

  canExecute(policy, context) {
    if (!policy) return false;
    const enforcement = policy.enforcement || 'audit';
    if (enforcement === 'hard') return false;
    return true;
  }

  getExecutionLog() {
    return [...this._log];
  }

  clear() {
    this._log = [];
    this._handlers.clear();
  }
}

module.exports = { PolicyExecutor };
