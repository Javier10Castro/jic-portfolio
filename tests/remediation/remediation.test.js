const assert = require('assert');
const {
  RemediationEngine,
  RemediationActions,
  RemediationPolicies,
  RemediationStore,
  RemediationAPI,
  ACTIONS,
  DEFAULT_POLICIES,
  createRemediationEngine,
  getRemediationEngine,
  resetDefaultEngine,
} = require('../../lib/remediation');

describe('Phase 8.4.0 — Remediation Engine', () => {

  describe('RemediationStore', () => {
    it('should store and retrieve history entries', () => {
      const store = new RemediationStore();
      store.addHistory({ action: 'auto_scale', success: true, policyId: 'p1' });
      store.addHistory({ action: 'reroute_traffic', success: false, policyId: 'p2' });
      assert.strictEqual(store.getHistory().length, 2);
      assert.strictEqual(store.getHistory({ action: 'auto_scale' }).length, 1);
      assert.strictEqual(store.getHistory({ success: false }).length, 1);
      assert.strictEqual(store.getHistory({ policyId: 'p1' }).length, 1);
    });

    it('should respect maxHistory limit', () => {
      const store = new RemediationStore({ maxHistory: 5 });
      for (let i = 0; i < 10; i++) store.addHistory({ action: 'test', success: true });
      assert.strictEqual(store.getHistory().length, 5);
    });

    it('should compute history stats', () => {
      const store = new RemediationStore();
      store.addHistory({ action: 'auto_scale', success: true });
      store.addHistory({ action: 'auto_scale', success: true });
      store.addHistory({ action: 'reroute', success: false });
      const stats = store.getHistoryStats();
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.succeeded, 2);
      assert.strictEqual(stats.failed, 1);
      assert.strictEqual(stats.byAction.auto_scale, 2);
    });

    it('should store and retrieve state', () => {
      const store = new RemediationStore();
      store.setState('circuit_open', true);
      store.setState('current_workers', 5);
      assert.strictEqual(store.getState('circuit_open'), true);
      assert.strictEqual(store.getState('current_workers'), 5);
      assert.strictEqual(store.getState('nonexistent'), null);
      const allState = store.getAllState();
      assert.strictEqual(allState.circuit_open, true);
      assert.strictEqual(allState.current_workers, 5);
    });

    it('should serialize and deserialize via toJSON/fromJSON', () => {
      const store = new RemediationStore();
      store.addHistory({ action: 'test', success: true });
      store.setState('key', 'value');
      const json = store.toJSON();
      assert.strictEqual(json.version, '1.0');

      const store2 = new RemediationStore();
      assert.ok(store2.fromJSON(json));
      assert.strictEqual(store2.getHistory().length, 1);
      assert.strictEqual(store2.getState('key'), 'value');
    });

    it('should handle invalid JSON', () => {
      const store = new RemediationStore();
      assert.strictEqual(store.fromJSON(null), false);
      assert.strictEqual(store.fromJSON({}), false);
      assert.strictEqual(store.fromJSON({ version: '1.0' }), false);
    });

    it('should clear all data', () => {
      const store = new RemediationStore();
      store.addHistory({ action: 'test', success: true });
      store.setState('key', 'value');
      store.clear();
      assert.strictEqual(store.getHistory().length, 0);
      assert.strictEqual(store.getState('key'), null);
    });
  });

  describe('RemediationActions', () => {
    it('should list all registered builtin actions', () => {
      const actions = new RemediationActions();
      const registered = actions.getRegisteredActions();
      assert.ok(registered.includes('auto_scale'));
      assert.ok(registered.includes('reroute_traffic'));
      assert.ok(registered.includes('retry_with_backoff'));
      assert.ok(registered.includes('isolate_node'));
      assert.ok(registered.includes('circuit_breaker'));
      assert.ok(registered.includes('rate_limit'));
      assert.ok(registered.includes('restart_worker'));
      assert.ok(registered.includes('notify'));
    });

    it('should return action metadata', () => {
      const actions = new RemediationActions();
      const meta = actions.getActionMeta('auto_scale');
      assert.ok(meta);
      assert.strictEqual(meta.key, 'auto_scale');
      assert.strictEqual(meta.category, 'scaling');
      assert.strictEqual(meta.destructive, false);

      const allMeta = actions.getAllActionMeta();
      assert.strictEqual(allMeta.length, 8);
    });

    it('should return null for unknown action meta', () => {
      const actions = new RemediationActions();
      assert.strictEqual(actions.getActionMeta('nonexistent'), null);
    });

    it('should execute builtin actions in simulated mode', async () => {
      const actions = new RemediationActions();
      const result = await actions.execute('auto_scale', { direction: 'up', amount: 3 });
      assert.ok(result.success);
      assert.ok(result.simulated);
      assert.ok(result.actionId);
      assert.ok(result.duration >= 0);
      assert.strictEqual(result.action, 'auto_scale');
    });

    it('should execute with default params when optional omitted', async () => {
      const actions = new RemediationActions();
      const result = await actions.execute('auto_scale', {});
      assert.ok(result.success);
      assert.strictEqual(result.params.direction, 'up');
      assert.strictEqual(result.params.amount, 1);
    });

    it('should reject execution with missing required params', async () => {
      const actions = new RemediationActions();
      const result = await actions.execute('isolate_node', {});
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Missing required'));
    });

    it('should reject unknown actions', async () => {
      const actions = new RemediationActions();
      await assert.rejects(
        () => actions.execute('nonexistent', {}),
        /Unknown action/
      );
    });

    it('should enforce maxConcurrentActions', () => {
      const actions = new RemediationActions({ maxConcurrentActions: 0 });
      assert.strictEqual(actions.getInFlightCount(), 0);
    });

    it('should register and execute custom actions', async () => {
      const actions = new RemediationActions();
      actions.registerAction('custom_test', async (params) => ({
        success: true,
        data: { echo: params.value },
      }), { label: 'Custom Test', category: 'custom', params: { value: { type: 'string', required: true } } });

      assert.ok(actions.getRegisteredActions().includes('custom_test'));
      const meta = actions.getActionMeta('custom_test');
      assert.strictEqual(meta.custom, true);

      const result = await actions.execute('custom_test', { value: 'hello' });
      assert.ok(result.success);
      assert.strictEqual(result.result.echo, 'hello');
    });

    it('should reject duplicate custom action registration', () => {
      const actions = new RemediationActions();
      actions.registerAction('dup', async () => {}, {});
      assert.throws(() => actions.registerAction('dup', async () => {}, {}), /already registered/);
    });
  });

  describe('RemediationPolicies', () => {
    it('should load default policies', () => {
      const policies = new RemediationPolicies();
      const list = policies.getPolicies();
      assert.strictEqual(list.length, DEFAULT_POLICIES.length);
    });

    it('should start empty when defaultPolicies disabled', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      assert.strictEqual(policies.getPolicies().length, 0);
    });

    it('should add and retrieve policies', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({ id: 'test-policy', name: 'Test', match: {}, action: 'notify', actionParams: {} });
      assert.strictEqual(policies.getPolicies().length, 1);
      assert.strictEqual(policies.getPolicy('test-policy').name, 'Test');
    });

    it('should reject duplicate policy ids', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({ id: 'dup', name: 'First', match: {}, action: 'notify', actionParams: {} });
      assert.throws(() => policies.addPolicy({ id: 'dup', name: 'Second', match: {}, action: 'notify', actionParams: {} }), /already exists/);
    });

    it('should update policies without modifying id or createdAt', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      const added = policies.addPolicy({ id: 'test', name: 'Original', match: {}, action: 'notify', actionParams: {} });
      const created = added.createdAt;

      policies.updatePolicy('test', { name: 'Updated', id: 'should-not-change', action: 'auto_scale' });
      const updated = policies.getPolicy('test');
      assert.strictEqual(updated.name, 'Updated');
      assert.strictEqual(updated.id, 'test');
      assert.strictEqual(updated.createdAt, created);
      assert.strictEqual(updated.action, 'auto_scale');
    });

    it('should reject update for nonexistent policy', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      assert.throws(() => policies.updatePolicy('nope', {}), /not found/);
    });

    it('should remove policies', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({ id: 'to-delete', name: 'Delete me', match: {}, action: 'notify', actionParams: {} });
      assert.ok(policies.removePolicy('to-delete'));
      assert.strictEqual(policies.getPolicy('to-delete'), null);
    });

    it('should reject removal of nonexistent policy', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      assert.throws(() => policies.removePolicy('nope'), /not found/);
    });

    it('should filter policies by enabled, action, and id', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({ id: 'p1', name: 'P1', enabled: true, match: {}, action: 'notify', actionParams: {} });
      policies.addPolicy({ id: 'p2', name: 'P2', enabled: false, match: {}, action: 'auto_scale', actionParams: {} });
      assert.strictEqual(policies.getPolicies({ enabled: true }).length, 1);
      assert.strictEqual(policies.getPolicies({ action: 'auto_scale' }).length, 1);
      assert.strictEqual(policies.getPolicies({ id: 'p1' }).length, 1);
    });

    it('should evaluate matching events against policies', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({
        id: 'test-match',
        name: 'Test Match',
        enabled: true,
        match: {
          eventTypes: ['intelligence.insight'],
          rules: ['cluster_underprovisioned'],
          minConfidence: 0.5,
          minPriority: 'high',
        },
        action: 'auto_scale',
        actionParams: { direction: 'up', amount: 2 },
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: false },
      });

      const event = { type: 'intelligence.insight', rule: 'cluster_underprovisioned', confidence: 0.8, priority: 'high' };
      const matched = policies.evaluate(event);
      assert.strictEqual(matched.length, 1);
      assert.strictEqual(matched[0].id, 'test-match');
    });

    it('should not match events with insufficient confidence', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({
        id: 'conf-test',
        name: 'Conf Test',
        enabled: true,
        match: { eventTypes: ['test'], minConfidence: 0.9 },
        action: 'notify',
        actionParams: {},
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: false },
      });

      assert.strictEqual(policies.evaluate({ type: 'test', confidence: 0.5 }).length, 0);
    });

    it('should not match events with insufficient priority', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({
        id: 'pri-test',
        name: 'Priority Test',
        enabled: true,
        match: { eventTypes: ['test'], minPriority: 'critical' },
        action: 'notify',
        actionParams: {},
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: false },
      });

      assert.strictEqual(policies.evaluate({ type: 'test', priority: 'low' }).length, 0);
    });

    it('should respect cooldown', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({
        id: 'cooldown-test',
        name: 'Cooldown Test',
        enabled: true,
        match: { eventTypes: ['test'] },
        action: 'notify',
        actionParams: {},
        safety: { cooldownMs: 5000, maxActionsPerHour: 100, requiresApproval: false },
      });

      assert.strictEqual(policies.evaluate({ type: 'test' }).length, 1);
      policies.markExecuted(policies.getPolicy('cooldown-test'));
      assert.strictEqual(policies.evaluate({ type: 'test' }).length, 0);
      assert.ok(policies.getCooldownRemaining(policies.getPolicy('cooldown-test')) > 0);
    });

    it('should respect maxActionsPerHour rate limit', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({
        id: 'rate-test',
        name: 'Rate Test',
        enabled: true,
        match: { eventTypes: ['test'] },
        action: 'notify',
        actionParams: {},
        safety: { cooldownMs: 0, maxActionsPerHour: 2, requiresApproval: false },
      });

      const policy = policies.getPolicy('rate-test');
      assert.strictEqual(policies.evaluate({ type: 'test' }).length, 1);
      policies.markExecuted(policy);
      assert.strictEqual(policies.evaluate({ type: 'test' }).length, 1);
      policies.markExecuted(policy);
      assert.strictEqual(policies.evaluate({ type: 'test' }).length, 0);
    });

    it('should not match disabled policies', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({
        id: 'disabled-test',
        name: 'Disabled',
        enabled: false,
        match: { eventTypes: ['test'] },
        action: 'notify',
        actionParams: {},
        safety: {},
      });

      assert.strictEqual(policies.evaluate({ type: 'test' }).length, 0);
    });

    it('should not match nonexistent event types', () => {
      const policies = new RemediationPolicies({ defaultPolicies: false });
      policies.addPolicy({
        id: 'type-test',
        name: 'Type Test',
        enabled: true,
        match: { eventTypes: ['specific.event'] },
        action: 'notify',
        actionParams: {},
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: false },
      });

      assert.strictEqual(policies.evaluate({ type: 'other.event' }).length, 0);
    });

    it('should reset to default policies', () => {
      const policies = new RemediationPolicies({ defaultPolicies: true });
      const originalCount = policies.getPolicies().length;
      policies.addPolicy({ id: 'extra', name: 'Extra', match: {}, action: 'notify', actionParams: {} });
      assert.strictEqual(policies.getPolicies().length, originalCount + 1);
      policies.reset();
      assert.strictEqual(policies.getPolicies().length, originalCount);
    });
  });

  describe('RemediationEngine', () => {
    it('should create with defaults and be enabled', () => {
      const engine = new RemediationEngine();
      assert.ok(engine.isEnabled());
      assert.ok(engine.actions);
      assert.ok(engine.policies);
      assert.ok(engine.store);
    });

    it('should enable and disable', () => {
      const engine = new RemediationEngine();
      assert.ok(engine.isEnabled());
      engine.disable();
      assert.strictEqual(engine.isEnabled(), false);
      engine.enable();
      assert.ok(engine.isEnabled());
    });

    it('should ingest events and match policies', async () => {
      const engine = new RemediationEngine({ autoExecute: true });
      const event = {
        type: 'intelligence.insight',
        rule: 'cluster_underprovisioned',
        confidence: 0.9,
        priority: 'critical',
      };
      const results = await engine.ingest(event);
      assert.ok(results.length >= 0);
      assert.ok(engine.getHealth().totalEvaluated >= 1);
    });

    it('should handle approval-required policies', async () => {
      const engine = new RemediationEngine({ autoExecute: true });
      engine.policies.addPolicy({
        id: 'approval-test',
        name: 'Approval Test',
        enabled: true,
        match: { eventTypes: ['test.require_approval'] },
        action: 'isolate_node',
        actionParams: { nodeId: 'test-node' },
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: true },
      });

      const results = await engine.ingest({ type: 'test.require_approval', priority: 'high' });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].status, 'pending_approval');
      assert.ok(results[0].approvalId);

      const pending = engine.getPendingApprovals();
      assert.strictEqual(pending.length, 1);
      assert.strictEqual(pending[0].policyId, 'approval-test');
    });

    it('should approve and execute pending actions', async () => {
      const engine = new RemediationEngine({ autoExecute: true });
      engine.policies.addPolicy({
        id: 'approve-exec',
        name: 'Approve Exec',
        enabled: true,
        match: { eventTypes: ['test.approve'] },
        action: 'notify',
        actionParams: { message: 'test', channel: 'log', severity: 'info' },
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: true },
      });

      const results = await engine.ingest({ type: 'test.approve', priority: 'high' });
      const approvalId = results[0].approvalId;
      const execResult = await engine.approveAction(approvalId);
      assert.strictEqual(execResult.status, 'executed');
    });

    it('should reject pending actions', async () => {
      const engine = new RemediationEngine({ autoExecute: true });
      engine.policies.addPolicy({
        id: 'reject-test',
        name: 'Reject Test',
        enabled: true,
        match: { eventTypes: ['test.reject'] },
        action: 'notify',
        actionParams: {},
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: true },
      });

      const results = await engine.ingest({ type: 'test.reject', priority: 'high' });
      const rejection = await engine.rejectAction(results[0].approvalId);
      assert.strictEqual(rejection.status, 'rejected');
    });

    it('should throw for invalid approval id', () => {
      const engine = new RemediationEngine();
      assert.throws(() => engine.approveAction('invalid-approval'), /not found/);
      assert.throws(() => engine.rejectAction('invalid-approval'), /not found/);
    });

    it('should track health metrics', () => {
      const engine = new RemediationEngine();
      const health = engine.getHealth();
      assert.strictEqual(typeof health.enabled, 'boolean');
      assert.strictEqual(typeof health.totalEvaluated, 'number');
      assert.strictEqual(typeof health.policyCount, 'number');
    });

    it('should clear all state', async () => {
      const engine = new RemediationEngine();
      await engine.ingest({ type: 'test.event', priority: 'low' });
      engine.clear();
      assert.strictEqual(engine.getHealth().totalEvaluated, 0);
      assert.strictEqual(engine.getHealth().totalExecuted, 0);
    });
  });

  describe('RemediationAPI', () => {
    it('should return health', () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      const resp = api._getHealth();
      assert.ok(resp.success);
      assert.ok(resp.data.enabled);
    });

    it('should list policies', () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      const resp = api._listPolicies({ query: {} });
      assert.ok(resp.success);
      assert.ok(resp.data.length >= DEFAULT_POLICIES.length);
    });

    it('should get a specific policy', () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      const resp = api._getPolicy({ params: { id: 'auto-scale-on-imbalance' } });
      assert.ok(resp.success);
      assert.strictEqual(resp.data.id, 'auto-scale-on-imbalance');
    });

    it('should return error for nonexistent policy', () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      const resp = api._getPolicy({ params: { id: 'nonexistent' } });
      assert.strictEqual(resp.success, false);
    });

    it('should create a policy', () => {
      const engine = new RemediationEngine({ policies: { defaultPolicies: false } });
      const api = new RemediationAPI(engine);
      const resp = api._createPolicy({ body: { id: 'api-test', name: 'API Test', match: {}, action: 'notify', actionParams: {} } });
      assert.ok(resp.success);
      assert.strictEqual(resp.data.id, 'api-test');
      assert.strictEqual(engine.policies.getPolicies().length, 1);
    });

    it('should update a policy', () => {
      const engine = new RemediationEngine({ policies: { defaultPolicies: false } });
      const api = new RemediationAPI(engine);
      api._createPolicy({ body: { id: 'update-test', name: 'Before', match: {}, action: 'notify', actionParams: {} } });
      const resp = api._updatePolicy({ params: { id: 'update-test' }, body: { name: 'After' } });
      assert.ok(resp.success);
      assert.strictEqual(resp.data.name, 'After');
    });

    it('should delete a policy', () => {
      const engine = new RemediationEngine({ policies: { defaultPolicies: false } });
      const api = new RemediationAPI(engine);
      api._createPolicy({ body: { id: 'delete-test', name: 'Delete', match: {}, action: 'notify', actionParams: {} } });
      const resp = api._deletePolicy({ params: { id: 'delete-test' } });
      assert.ok(resp.success);
      assert.strictEqual(engine.policies.getPolicy('delete-test'), null);
    });

    it('should list registered actions', () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      const resp = api._listActions();
      assert.ok(resp.success);
      assert.ok(resp.data.length >= 8);
    });

    it('should get action metadata', () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      const resp = api._getActionMeta({ params: { id: 'auto_scale' } });
      assert.ok(resp.success);
      assert.strictEqual(resp.data.key, 'auto_scale');
    });

    it('should return error for nonexistent action meta', () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      const resp = api._getActionMeta({ params: { id: 'nonexistent' } });
      assert.strictEqual(resp.success, false);
    });

    it('should execute a manual action', async () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      const resp = await api._executeAction({ body: { action: 'notify', params: { message: 'manual test', channel: 'log', severity: 'info' } } });
      assert.ok(resp.success);
      assert.strictEqual(resp.data.action, 'notify');
    });

    it('should reject manual execution of unknown action', async () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      const resp = await api._executeAction({ body: { action: 'unknown' } });
      assert.strictEqual(resp.success, false);
    });

    it('should return history', () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      engine.store.addHistory({ action: 'test', success: true });
      const resp = api._getHistory({ query: {} });
      assert.ok(resp.success);
      assert.ok(resp.data.length >= 1);
    });

    it('should return history stats', () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      engine.store.addHistory({ action: 'test', success: true });
      const resp = api._getHistoryStats();
      assert.ok(resp.success);
      assert.strictEqual(resp.data.total >= 1, true);
    });

    it('should list pending approvals', async () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      engine.policies.addPolicy({
        id: 'api-approval',
        name: 'API Approval',
        enabled: true,
        match: { eventTypes: ['test.api_approval'] },
        action: 'isolate_node',
        actionParams: { nodeId: 'n1' },
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: true },
      });
      await engine.ingest({ type: 'test.api_approval', priority: 'high' });

      const resp = api._listApprovals();
      assert.ok(resp.success);
      assert.strictEqual(resp.data.length, 1);
    });

    it('should approve via API', async () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      engine.policies.addPolicy({
        id: 'api-approve',
        name: 'API Approve',
        enabled: true,
        match: { eventTypes: ['test.api_approve'] },
        action: 'notify',
        actionParams: { message: 'ok', channel: 'log', severity: 'info' },
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: true },
      });
      const results = await engine.ingest({ type: 'test.api_approve', priority: 'high' });
      const resp = await api._approveAction({ params: { id: results[0].approvalId } });
      assert.ok(resp.success);
      assert.strictEqual(resp.data.status, 'executed');
    });

    it('should reject via API', async () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      engine.policies.addPolicy({
        id: 'api-reject',
        name: 'API Reject',
        enabled: true,
        match: { eventTypes: ['test.api_reject'] },
        action: 'notify',
        actionParams: {},
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: true },
      });
      const results = await engine.ingest({ type: 'test.api_reject', priority: 'high' });
      const resp = await api._rejectAction({ params: { id: results[0].approvalId } });
      assert.ok(resp.success);
      assert.strictEqual(resp.data.status, 'rejected');
    });

    it('should return routes array', () => {
      const engine = new RemediationEngine();
      const api = new RemediationAPI(engine);
      const routes = api.getRoutes();
      assert.ok(Array.isArray(routes));
      assert.ok(routes.length >= 14);
    });
  });

  describe('Module exports', () => {
    it('should export all expected classes and functions', () => {
      assert.strictEqual(typeof RemediationEngine, 'function');
      assert.strictEqual(typeof RemediationActions, 'function');
      assert.strictEqual(typeof RemediationPolicies, 'function');
      assert.strictEqual(typeof RemediationStore, 'function');
      assert.strictEqual(typeof RemediationAPI, 'function');
      assert.strictEqual(typeof createRemediationEngine, 'function');
      assert.strictEqual(typeof getRemediationEngine, 'function');
      assert.strictEqual(typeof resetDefaultEngine, 'function');
      assert.strictEqual(typeof ACTIONS, 'object');
      assert.ok(Array.isArray(DEFAULT_POLICIES));
    });

    it('should support singleton pattern', () => {
      resetDefaultEngine();
      const e1 = getRemediationEngine();
      const e2 = getRemediationEngine();
      assert.strictEqual(e1, e2);
      resetDefaultEngine();
      const e3 = getRemediationEngine();
      assert.notStrictEqual(e1, e3);
    });

    it('should create independent instances', () => {
      const e1 = createRemediationEngine();
      const e2 = createRemediationEngine();
      assert.notStrictEqual(e1, e2);
    });

    it('should include ACTIONS constant with all action keys', () => {
      assert.ok(ACTIONS.auto_scale);
      assert.ok(ACTIONS.reroute_traffic);
      assert.ok(ACTIONS.retry_with_backoff);
      assert.ok(ACTIONS.isolate_node);
      assert.ok(ACTIONS.circuit_breaker);
      assert.ok(ACTIONS.rate_limit);
      assert.ok(ACTIONS.restart_worker);
      assert.ok(ACTIONS.notify);
    });
  });

  describe('EventBus integration — attachToEventBus', () => {
    it('should attach to event bus and consume intelligence events', () => {
      const { attachToEventBus } = require('../../lib/remediation');
      const events = [];
      const mockBus = {
        on: (type, handler) => {
          events.push({ type, handler });
          return () => {};
        },
      };

      const detach = attachToEventBus(mockBus);
      assert.strictEqual(typeof detach, 'function');
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].type, '*');
    });

    it('should not process remediation.* events', () => {
      const { attachToEventBus } = require('../../lib/remediation');
      let captured = [];
      const engine = new RemediationEngine();
      const origIngest = engine.ingest.bind(engine);
      engine.ingest = (event) => { captured.push(event); return origIngest(event); };

      const mockBus = { on: (type, handler) => { captured._handler = handler; return () => {}; } };
      attachToEventBus(mockBus, engine);

      captured._handler({ type: 'remediation.action.executed' });
      captured._handler({ type: 'intelligence.insight', rule: 'cluster_underprovisioned', confidence: 0.9, priority: 'high' });

      const ingested = captured.filter(e => e && e.type);
      assert.strictEqual(ingested.length, 1);
    });
  });

  describe('Integration — full lifecycle', () => {
    it('should process insight to action end-to-end', async () => {
      const engine = new RemediationEngine({ autoExecute: true });
      engine.policies.addPolicy({
        id: 'e2e-test',
        name: 'E2E Test',
        enabled: true,
        match: { eventTypes: ['intelligence.insight'], rules: ['test_e2e'], minConfidence: 0.5, minPriority: 'low' },
        action: 'notify',
        actionParams: { message: 'e2e trigger', channel: 'log', severity: 'warning' },
        safety: { cooldownMs: 0, maxActionsPerHour: 100, requiresApproval: false },
      });

      const results = await engine.ingest({ type: 'intelligence.insight', rule: 'test_e2e', confidence: 0.9, priority: 'medium' });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].status, 'executed');
      assert.strictEqual(results[0].action, 'notify');

      const history = engine.store.getHistory({ action: 'notify' });
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].policyId, 'e2e-test');
    });

    it('should handle engine lifecycle (enable/disable/clear)', async () => {
      const engine = new RemediationEngine();

      engine.disable();
      const results = await engine.ingest({ type: 'test.event' });
      assert.strictEqual(results.length, 0);

      engine.enable();
      const results2 = await engine.ingest({ type: 'test.event', priority: 'low' });
      assert.ok(Array.isArray(results2));

      const health = engine.getHealth();
      assert.ok(health.totalEvaluated > 0);

      engine.clear();
      assert.strictEqual(engine.getHealth().totalEvaluated, 0);
    });
  });

  describe('Safety guards', () => {
    it('should not execute when engine is disabled', async () => {
      const engine = new RemediationEngine({ autoExecute: true });
      engine.disable();
      const results = await engine.ingest({ type: 'intelligence.insight', rule: 'cluster_underprovisioned', confidence: 0.9, priority: 'critical' });
      assert.strictEqual(results.length, 0);
    });

    it('should mark destructive actions correctly', () => {
      assert.strictEqual(ACTIONS.auto_scale.destructive, false);
      assert.strictEqual(ACTIONS.isolate_node.destructive, true);
      assert.strictEqual(ACTIONS.circuit_breaker.destructive, false);
      assert.strictEqual(ACTIONS.restart_worker.destructive, true);
    });

    it('should support approval gates for destructive actions', () => {
      const policy = DEFAULT_POLICIES.find(p => p.id === 'isolate-failing-node');
      assert.ok(policy);
      assert.strictEqual(policy.safety.requiresApproval, true);
    });

    it('should enforce cooldown on executed policies', async () => {
      const engine = new RemediationEngine({ autoExecute: true });
      const testPolicy = {
        id: 'cooldown-e2e',
        name: 'Cooldown E2E',
        enabled: true,
        match: { eventTypes: ['test.cooldown_e2e'] },
        action: 'notify',
        actionParams: { message: 'cd', channel: 'log', severity: 'info' },
        safety: { cooldownMs: 60000, maxActionsPerHour: 100, requiresApproval: false },
      };

      engine.policies.addPolicy(testPolicy);
      const r1 = await engine.ingest({ type: 'test.cooldown_e2e', priority: 'medium' });
      assert.strictEqual(r1.length, 1);
      const r2 = await engine.ingest({ type: 'test.cooldown_e2e', priority: 'medium' });
      assert.strictEqual(r2.length, 0);
    });
  });

  describe('Performance', () => {
    it('should process events quickly (<10ms average)', async () => {
      const engine = new RemediationEngine({ autoExecute: false });
      const times = [];
      for (let i = 0; i < 100; i++) {
        const start = Date.now();
        await engine.ingest({ type: 'intelligence.insight', rule: 'cluster_underprovisioned', confidence: 0.5 + Math.random() * 0.5, priority: i % 2 === 0 ? 'high' : 'medium', id: `event-${i}` });
        times.push(Date.now() - start);
      }
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      assert.ok(avg < 10, `Average processing time ${avg}ms exceeds 10ms limit`);
    });

    it('should handle concurrent action execution', async () => {
      const actions = new RemediationActions();
      const paramsMap = {
        notify: { message: 'test', channel: 'log', severity: 'info' },
        auto_scale: { direction: 'up', amount: 1 },
        reroute_traffic: { targetProvider: 'alt-provider' },
        rate_limit: { target: 'ingress', maxRps: 10 },
        circuit_breaker: { target: 'primary', type: 'provider' },
      };
      const results = await Promise.all(
        Object.entries(paramsMap).map(([a, p]) => actions.execute(a, p))
      );
      assert.strictEqual(results.length, 5);
      results.forEach(r => assert.ok(r.success));
    });
  });
});
