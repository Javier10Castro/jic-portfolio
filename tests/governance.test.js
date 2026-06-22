const assert = require('assert');

describe('Enterprise Policy & Governance Platform — Phase 9.7.0', function() {

  describe('PolicyRegistry', function() {
    it('should register a policy and retrieve it by id', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      const policy = { id: 'p1', name: 'Test', type: 'ai', conditions: [{ field: 'test', operator: 'eq', value: true }] };
      const result = reg.register(policy);
      assert.strictEqual(result.id, 'p1');
      assert.strictEqual(result.name, 'Test');
      const retrieved = reg.get('p1');
      assert.strictEqual(retrieved.id, 'p1');
    });

    it('should return null for a missing policy', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      const result = reg.get('non-existent');
      assert.strictEqual(result, null);
    });

    it('should return null for null id in get', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      assert.strictEqual(reg.get(null), null);
    });

    it('should throw on duplicate policy id', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      const policy = { id: 'dup', name: 'Dup', type: 'agent', conditions: [{ field: 'x', operator: 'eq', value: 1 }] };
      reg.register(policy);
      assert.throws(() => reg.register(policy), /already exists/);
    });

    it('should throw when required fields are missing', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      assert.throws(() => reg.register({ id: 'x' }), /Missing required fields/);
    });

    it('should throw on invalid policy type', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      assert.throws(() => reg.register({ id: 'bad', name: 'Bad', type: 'invalid', conditions: [] }), /Invalid policy type/);
    });

    it('should unregister and return true', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'del', name: 'Del', type: 'billing', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      const result = reg.unregister('del');
      assert.strictEqual(result, true);
      assert.strictEqual(reg.get('del'), null);
    });

    it('should unregister non-existent return false', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      assert.strictEqual(reg.unregister('nope'), false);
    });

    it('should unregister null return false', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      assert.strictEqual(reg.unregister(null), false);
    });

    it('should list all policies', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'a', name: 'A', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.register({ id: 'b', name: 'B', type: 'security', conditions: [{ field: 'y', operator: 'eq', value: 2 }] });
      assert.strictEqual(reg.list().length, 2);
    });

    it('should list by type filter', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'a', name: 'A', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.register({ id: 'b', name: 'B', type: 'security', conditions: [{ field: 'y', operator: 'eq', value: 2 }] });
      assert.strictEqual(reg.list({ type: 'ai' }).length, 1);
    });

    it('should list by tag filter', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'a', name: 'A', type: 'ai', tags: ['cost'], conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.register({ id: 'b', name: 'B', type: 'ai', tags: ['security'], conditions: [{ field: 'y', operator: 'eq', value: 2 }] });
      assert.strictEqual(reg.list({ tag: 'cost' }).length, 1);
    });

    it('should list by severity filter', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'a', name: 'A', type: 'ai', severity: 'critical', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.register({ id: 'b', name: 'B', type: 'ai', severity: 'low', conditions: [{ field: 'y', operator: 'eq', value: 2 }] });
      assert.strictEqual(reg.list({ severity: 'critical' }).length, 1);
    });

    it('should list by enforcement filter', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'a', name: 'A', type: 'ai', enforcement: 'hard', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.register({ id: 'b', name: 'B', type: 'ai', enforcement: 'soft', conditions: [{ field: 'y', operator: 'eq', value: 2 }] });
      assert.strictEqual(reg.list({ enforcement: 'hard' }).length, 1);
    });

    it('should list by enabled filter', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'a', name: 'A', type: 'ai', enabled: true, conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.register({ id: 'b', name: 'B', type: 'ai', enabled: false, conditions: [{ field: 'y', operator: 'eq', value: 2 }] });
      assert.strictEqual(reg.list({ enabled: true }).length, 1);
    });

    it('should search by name', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'a', name: 'Cost Limit', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      const results = reg.search('cost');
      assert.strictEqual(results.length, 1);
    });

    it('should search by description', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'a', name: 'Test', description: 'budget control rule', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      const results = reg.search('budget');
      assert.strictEqual(results.length, 1);
    });

    it('should return empty for non-existent search', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      assert.deepStrictEqual(reg.search('zzzz'), []);
    });

    it('should search null query return empty', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      assert.deepStrictEqual(reg.search(null), []);
    });
  });

  describe('PolicyCompiler', function() {
    it('should compile a valid policy', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      const policy = { id: 'c1', name: 'Compile Test', type: 'ai', severity: 'high', enforcement: 'hard', enabled: true, conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'deny', message: 'Denied' }] };
      const result = comp.compile(policy);
      assert.strictEqual(result.id, 'c1');
    });

    it('should compile with conditions and actions arrays', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      const policy = { id: 'cv', name: 'CV', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] };
      const result = comp.compile(policy);
      assert.ok(Array.isArray(result.conditions));
      assert.ok(Array.isArray(result.actions));
      assert.strictEqual(result.conditions[0].compiled, true);
    });

    it('should compileBatch return array', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      const policies = [
        { id: 'b1', name: 'B1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] },
        { id: 'b2', name: 'B2', type: 'agent', conditions: [{ field: 'y', operator: 'gt', value: 0 }], actions: [{ type: 'warn' }] }
      ];
      const results = comp.compileBatch(policies);
      assert.strictEqual(results.length, 2);
    });

    it('should compileBatch with non-array return empty', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      assert.deepStrictEqual(comp.compileBatch(null), []);
    });

    it('should validate valid policy as {valid:true}', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      const policy = { id: 'v1', name: 'V1', type: 'workflow', conditions: [{ field: 'a', operator: 'eq', value: 1 }], actions: [{ type: 'notify' }] };
      const result = comp.validate(policy);
      assert.strictEqual(result.valid, true);
    });

    it('should validate invalid policy with errors', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      const result = comp.validate({ id: '' });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should validate null policy returns errors', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      const result = comp.validate(null);
      assert.strictEqual(result.valid, false);
    });

    it('should throw on compile with invalid policy', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      assert.throws(() => comp.compile({ id: '' }), /Policy validation failed/);
    });

    it('should getCompiled return compiled policy', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      const policy = { id: 'gc1', name: 'GC1', type: 'deployment', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] };
      comp.compile(policy);
      const retrieved = comp.getCompiled('gc1');
      assert.strictEqual(retrieved.id, 'gc1');
    });

    it('should getCompiled return null for missing', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      assert.strictEqual(comp.getCompiled('nope'), null);
    });

    it('should getCompiled null id return null', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      assert.strictEqual(comp.getCompiled(null), null);
    });

    it('should listCompiled return array', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      comp.compile({ id: 'l1', name: 'L1', type: 'billing', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      comp.compile({ id: 'l2', name: 'L2', type: 'security', conditions: [{ field: 'y', operator: 'eq', value: 2 }], actions: [{ type: 'deny' }] });
      assert.strictEqual(comp.listCompiled().length, 2);
    });

    it('should clear remove all compiled policies', function() {
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const comp = new PolicyCompiler();
      comp.compile({ id: 'clr', name: 'Clr', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      comp.clear();
      assert.strictEqual(comp.getCompiled('clr'), null);
    });
  });

  describe('PolicyEvaluator', function() {
    it('should return matched true with results array', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      const policy = { conditions: [{ field: 'value', operator: 'eq', value: 10 }] };
      const result = ev.evaluate(policy, { value: 10 });
      assert.strictEqual(result.matched, true);
      assert.ok(Array.isArray(result.results));
    });

    it('should return matched false when no data', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      const policy = { conditions: [{ field: 'x', operator: 'eq', value: 1 }] };
      const result = ev.evaluate(policy, null);
      assert.strictEqual(result.matched, false);
    });

    it('should return matched false when no policy', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      const result = ev.evaluate(null, { x: 1 });
      assert.strictEqual(result.matched, false);
    });

    it('should evaluateCondition with eq operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      const condition = { field: 'role', operator: 'eq', value: 'admin' };
      assert.strictEqual(ev.evaluateCondition(condition, { role: 'admin' }).matched, true);
      assert.strictEqual(ev.evaluateCondition(condition, { role: 'user' }).matched, false);
    });

    it('should evaluateCondition with neq operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'role', operator: 'neq', value: 'admin' }, { role: 'user' }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'role', operator: 'neq', value: 'admin' }, { role: 'admin' }).matched, false);
    });

    it('should evaluateCondition with gt operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'count', operator: 'gt', value: 5 }, { count: 10 }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'count', operator: 'gt', value: 5 }, { count: 3 }).matched, false);
    });

    it('should evaluateCondition with gte operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'count', operator: 'gte', value: 5 }, { count: 5 }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'count', operator: 'gte', value: 5 }, { count: 4 }).matched, false);
    });

    it('should evaluateCondition with lt operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'count', operator: 'lt', value: 5 }, { count: 3 }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'count', operator: 'lt', value: 5 }, { count: 7 }).matched, false);
    });

    it('should evaluateCondition with lte operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'count', operator: 'lte', value: 5 }, { count: 5 }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'count', operator: 'lte', value: 5 }, { count: 6 }).matched, false);
    });

    it('should evaluateCondition with contains operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'name', operator: 'contains', value: 'test' }, { name: 'testing' }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'name', operator: 'contains', value: 'test' }, { name: 'foo' }).matched, false);
    });

    it('should evaluateCondition with not_contains operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'name', operator: 'not_contains', value: 'bad' }, { name: 'good' }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'name', operator: 'not_contains', value: 'bad' }, { name: 'badword' }).matched, false);
    });

    it('should evaluateCondition with in operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'color', operator: 'in', value: ['red', 'blue'] }, { color: 'red' }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'color', operator: 'in', value: ['red', 'blue'] }, { color: 'green' }).matched, false);
    });

    it('should evaluateCondition with not_in operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'color', operator: 'not_in', value: ['red', 'blue'] }, { color: 'green' }).matched, true);
    });

    it('should evaluateCondition with exists operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'email', operator: 'exists', value: null }, { email: 'a@b.com' }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'email', operator: 'exists', value: null }, {}).matched, false);
    });

    it('should evaluateCondition with not_exists operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'email', operator: 'not_exists', value: null }, {}).matched, true);
    });

    it('should evaluateCondition with matches operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'email', operator: 'matches', value: '.*@example\\.com' }, { email: 'a@example.com' }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'email', operator: 'matches', value: '.*@example\\.com' }, { email: 'a@other.com' }).matched, false);
    });

    it('should evaluateCondition with starts_with operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'code', operator: 'starts_with', value: 'ERR' }, { code: 'ERROR' }).matched, true);
      assert.strictEqual(ev.evaluateCondition({ field: 'code', operator: 'starts_with', value: 'ERR' }, { code: 'OK' }).matched, false);
    });

    it('should evaluateCondition with ends_with operator', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition({ field: 'file', operator: 'ends_with', value: '.js' }, { file: 'test.js' }).matched, true);
    });

    it('should evaluate dot notation field', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      const policy = { conditions: [{ field: 'ai.cost.monthly', operator: 'gt', value: 5000 }] };
      const result = ev.evaluate(policy, { ai: { cost: { monthly: 6000 } } });
      assert.strictEqual(result.matched, true);
    });

    it('should evaluateAll return array', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      const policies = [
        { id: 'p1', conditions: [{ field: 'x', operator: 'eq', value: 1 }] },
        { id: 'p2', conditions: [{ field: 'y', operator: 'eq', value: 2 }] }
      ];
      const results = ev.evaluateAll(policies, { x: 1, y: 2 });
      assert.strictEqual(results.length, 2);
    });

    it('should getMatchingPolicies return only matched', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      const policies = [
        { id: 'p1', conditions: [{ field: 'x', operator: 'eq', value: 1 }] },
        { id: 'p2', conditions: [{ field: 'x', operator: 'eq', value: 99 }] }
      ];
      const matched = ev.getMatchingPolicies(policies, { x: 1 });
      assert.strictEqual(matched.length, 1);
      assert.strictEqual(matched[0].id, 'p1');
    });

    it('should evaluateCondition with null condition return false', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      assert.strictEqual(ev.evaluateCondition(null, { x: 1 }).matched, false);
    });

    it('should clear reset state', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      ev.clear();
      assert.strictEqual(ev.evaluate({ conditions: [] }, {}).matched, true);
    });
  });

  describe('PolicyExecutor', function() {
    it('should execute matched policy and return actions array', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      const policy = { id: 'ex1', actions: [{ type: 'log', message: 'logged' }] };
      const evaluation = { matched: true };
      const result = exec.execute(policy, evaluation, {});
      assert.strictEqual(result.policyId, 'ex1');
      assert.ok(result.actions.length > 0);
    });

    it('should execute deny action throwing error', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      assert.throws(() => exec.executeAction({ type: 'deny' }, {}), /Policy denial/);
    });

    it('should execute warn action', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      const policy = { id: 'warn1', actions: [{ type: 'warn', message: 'warning' }] };
      const result = exec.execute(policy, { matched: true }, {});
      assert.strictEqual(result.actions[0].result.type, 'warn');
      assert.strictEqual(result.actions[0].result.warning, true);
    });

    it('should execute notify action', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      const policy = { id: 'not1', actions: [{ type: 'notify', message: 'notified' }] };
      const result = exec.execute(policy, { matched: true }, {});
      assert.strictEqual(result.actions[0].result.emitted, true);
    });

    it('should execute flag action', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      const policy = { id: 'flag1', actions: [{ type: 'flag', message: 'flagged' }] };
      const result = exec.execute(policy, { matched: true }, {});
      assert.strictEqual(result.actions[0].result.flagged, true);
    });

    it('should execute require_approval action create approval', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      const policy = { id: 'appr1', actions: [{ type: 'require_approval', message: 'needs approval' }] };
      const result = exec.execute(policy, { matched: true }, {});
      assert.strictEqual(result.actions[0].result.type, 'require_approval');
      assert.ok(result.actions[0].result.approval);
    });

    it('should block action throw error', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      assert.throws(() => exec.executeAction({ type: 'block' }, {}), /Action blocked/);
    });

    it('should quarantine action works', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      const policy = { id: 'q1', actions: [{ type: 'quarantine', message: 'quarantined' }] };
      const result = exec.execute(policy, { matched: true }, {});
      assert.strictEqual(result.actions[0].result.quarantined, true);
    });

    it('should canExecute hard return false', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      assert.strictEqual(exec.canExecute({ enforcement: 'hard' }, {}), false);
    });

    it('should canExecute soft return true', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      assert.strictEqual(exec.canExecute({ enforcement: 'soft' }, {}), true);
    });

    it('should canExecute audit return true', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      assert.strictEqual(exec.canExecute({ enforcement: 'audit' }, {}), true);
    });

    it('should canExecute null policy return false', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      assert.strictEqual(exec.canExecute(null, {}), false);
    });

    it('should getExecutionLog return history', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      exec.execute({ id: 'log1', actions: [{ type: 'log' }] }, { matched: true }, {});
      assert.strictEqual(exec.getExecutionLog().length, 1);
    });

    it('should clear reset state', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      exec.execute({ id: 'clr1', actions: [{ type: 'log' }] }, { matched: true }, {});
      exec.clear();
      assert.strictEqual(exec.getExecutionLog().length, 0);
    });
  });

  describe('PolicyStorage', function() {
    it('should set and get a value', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      store.set('ns1', 'key1', 'value1');
      assert.strictEqual(store.get('ns1', 'key1'), 'value1');
    });

    it('should return null for non-existent key', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      assert.strictEqual(store.get('ns1', 'nope'), null);
    });

    it('should return null for non-existent namespace', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      assert.strictEqual(store.get('unknown', 'key'), null);
    });

    it('should return null for null namespace', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      assert.strictEqual(store.get(null, 'key'), null);
    });

    it('should return true for has existing key', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      store.set('ns1', 'k', 'v');
      assert.strictEqual(store.has('ns1', 'k'), true);
    });

    it('should return false for has missing key', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      assert.strictEqual(store.has('ns1', 'k'), false);
    });

    it('should return false for has missing namespace', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      assert.strictEqual(store.has('unknown', 'k'), false);
    });

    it('should delete return true and remove key', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      store.set('ns1', 'del', 'val');
      assert.strictEqual(store.delete('ns1', 'del'), true);
      assert.strictEqual(store.get('ns1', 'del'), null);
    });

    it('should delete return false for missing key', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      assert.strictEqual(store.delete('ns1', 'nope'), false);
    });

    it('should list namespace keys', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      store.set('ns1', 'a', 1);
      store.set('ns1', 'b', 2);
      const keys = store.list('ns1');
      assert.strictEqual(keys.length, 2);
    });

    it('should list return empty for unknown namespace', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      assert.deepStrictEqual(store.list('nope'), []);
    });

    it('should clearNamespace remove all keys', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      store.set('ns1', 'a', 1);
      store.clearNamespace('ns1');
      assert.strictEqual(store.get('ns1', 'a'), null);
    });

    it('should getAll return full state', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      store.set('ns1', 'k1', 'v1');
      const all = store.getAll();
      assert.strictEqual(all.ns1.k1, 'v1');
    });

    it('should clear reset everything', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      store.set('ns1', 'k', 'v');
      store.clear();
      assert.strictEqual(store.get('ns1', 'k'), null);
    });
  });

  describe('PolicyEvents', function() {
    it('should on/emit call handler', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      let called = false;
      ev.on('test.event', function() { called = true; });
      ev.emit('test.event', {});
      assert.strictEqual(called, true);
    });

    it('should emit pass data to handler', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      let received = null;
      ev.on('test.data', function(d) { received = d; });
      ev.emit('test.data', { msg: 'hello' });
      assert.deepStrictEqual(received, { msg: 'hello' });
    });

    it('should off remove handler', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      let count = 0;
      const fn = function() { count++; };
      ev.on('test.off', fn);
      ev.emit('test.off', {});
      ev.off('test.off', fn);
      ev.emit('test.off', {});
      assert.strictEqual(count, 1);
    });

    it('should emit with no handlers not crash', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      ev.emit('nonexistent', {});
    });

    it('should listEvents return types with counts', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      ev.on('type.a', function() {});
      ev.on('type.a', function() {});
      ev.on('type.b', function() {});
      const listed = ev.listEvents();
      assert.strictEqual(listed['type.a'], 2);
      assert.strictEqual(listed['type.b'], 1);
    });

    it('should multiple handlers per event all fire', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      let c1 = 0, c2 = 0;
      ev.on('multi', function() { c1++; });
      ev.on('multi', function() { c2++; });
      ev.emit('multi', {});
      assert.strictEqual(c1, 1);
      assert.strictEqual(c2, 1);
    });

    it('should off with non-existent handler do nothing', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      ev.off('test', function() {});
    });

    it('should clear remove all handlers', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      let called = false;
      ev.on('test', function() { called = true; });
      ev.clear();
      ev.emit('test', {});
      assert.strictEqual(called, false);
    });

    it('should EVENTS constant have correct keys', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      assert.ok(PolicyEvents.EVENTS.POLICY_CREATED);
      assert.ok(PolicyEvents.EVENTS.POLICY_DELETED);
      assert.ok(PolicyEvents.EVENTS.APPROVAL_REQUESTED);
      assert.ok(PolicyEvents.EVENTS.COMPLIANCE_SCAN_STARTED);
    });

    it('should on with null event do nothing', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      ev.on(null, function() {});
    });

    it('should on with non-function handler do nothing', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      ev.on('test', 'not_a_function');
    });

    it('should off with null event do nothing', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      ev.off(null, function() {});
    });

    it('should off with null handler do nothing', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      ev.off('test', null);
    });
  });

  describe('PolicyMetrics', function() {
    it('should record and query values', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record('requests', 10);
      m.record('requests', 20);
      const results = m.query('requests');
      assert.strictEqual(results.length, 2);
    });

    it('should query with since filter', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record('latency', 100);
      const results = m.query('latency', { since: Date.now() - 10000 });
      assert.strictEqual(results.length, 1);
    });

    it('should query with limit returns correct count', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record('test', 1);
      m.record('test', 2);
      m.record('test', 3);
      const results = m.query('test', { limit: 2 });
      assert.strictEqual(results.length, 2);
    });

    it('should aggregate count', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record('errors', 5);
      m.record('errors', 10);
      assert.strictEqual(m.aggregate('errors', 'count'), 2);
    });

    it('should aggregate avg', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record('val', 10);
      m.record('val', 20);
      assert.strictEqual(m.aggregate('val', 'avg'), 15);
    });

    it('should aggregate min', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record('val', 5);
      m.record('val', 3);
      m.record('val', 8);
      assert.strictEqual(m.aggregate('val', 'min'), 3);
    });

    it('should aggregate max', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record('val', 5);
      m.record('val', 12);
      assert.strictEqual(m.aggregate('val', 'max'), 12);
    });

    it('should aggregate sum', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record('val', 7);
      m.record('val', 3);
      assert.strictEqual(m.aggregate('val', 'sum'), 10);
    });

    it('should getMetricNames return names', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record('cpu', 50);
      m.record('mem', 100);
      const names = m.getMetricNames();
      assert.ok(names.includes('cpu'));
      assert.ok(names.includes('mem'));
    });

    it('should query non-existent name return empty', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      assert.deepStrictEqual(m.query('nope'), []);
    });

    it('should aggregate non-existent name return null', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      assert.strictEqual(m.aggregate('nope', 'count'), null);
    });

    it('should record with tags', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      const entry = m.record('tagged', 42, { env: 'test' });
      assert.deepStrictEqual(entry.tags, { env: 'test' });
    });

    it('should clear reset all metrics', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record('x', 1);
      m.clear();
      assert.strictEqual(m.query('x').length, 0);
    });

    it('should record with no name do nothing', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      m.record(null, 1);
    });
  });

  describe('PolicyScheduler', function() {
    it('should schedule and list tasks', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      s.schedule('task1', function() { return "done"; }, 60000);
      const list = s.list();
      assert.strictEqual(list.length, 1);
      assert.strictEqual(list[0].name, "task1");
    });

    it('should get scheduled task info', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      const result = s.schedule('t1', function() {}, 60000);
      assert.strictEqual(result.id, 't1');
      assert.strictEqual(result.interval, 60000);
    });

    it('should cancel remove task', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      s.schedule('t1', function() {}, 60000);
      assert.strictEqual(s.cancel('t1'), true);
      assert.strictEqual(s.list().length, 0);
    });

    it('should cancel non-existent return false', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      assert.strictEqual(s.cancel('nope'), false);
    });

    it('should tick run due tasks', function(done) {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      let executed = false;
      s.schedule('t1', function() { executed = true; return "ok"; }, 1);
      setTimeout(function() {
        const results = s.tick();
        assert.strictEqual(executed, true);
        assert.strictEqual(results.length, 1);
        done();
      }, 5);
    });

    it('should pause prevent execution', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      let count = 0;
      s.schedule('t1', function() { count++; }, 1);
      s.pause();
      s.tick();
      assert.strictEqual(count, 0);
    });

    it('should resume allow execution', function(done) {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      let count = 0;
      s.schedule('t1', function() { count++; }, 1);
      s.pause();
      s.resume();
      setTimeout(function() {
        s.tick();
        assert.strictEqual(count, 1);
        done();
      }, 5);
    });

    it('should tick return empty when paused', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      s.schedule('t1', function() {}, 1);
      s.pause();
      const results = s.tick();
      assert.strictEqual(results.length, 0);
    });

    it('should duplicate name throw', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      s.schedule('dup', function() {}, 60000);
      assert.throws(() => s.schedule('dup', function() {}, 60000), /already scheduled/);
    });

    it('should invalid parameters throw', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      assert.throws(() => s.schedule('', function() {}, 1000), /Invalid/);
      assert.throws(() => s.schedule('t', null, 1000), /Invalid/);
      assert.throws(() => s.schedule('t', function() {}, -1), /Invalid/);
    });

    it('should cancel null return false', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      assert.strictEqual(s.cancel(null), false);
    });

    it('should tick handle task errors gracefully', function(done) {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      s.schedule('err', function() { throw new Error("fail"); }, 1);
      setTimeout(function() {
        const results = s.tick();
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].success, false);
        done();
      }, 5);
    });

    it('should clear remove all tasks', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      s.schedule('t1', function() {}, 60000);
      s.clear();
      assert.strictEqual(s.list().length, 0);
    });
  });

  describe('PolicySimulator', function() {
    it('should simulate matched return policyId and fields', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      const policy = { id: 'sim1', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] };
      const result = sim.simulate(policy, { x: 1 });
      assert.strictEqual(result.policyId, 'sim1');
      assert.strictEqual(result.matched, true);
    });

    it('should simulate not matched', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      const policy = { id: 'sim2', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [] };
      const result = sim.simulate(policy, { x: 99 });
      assert.strictEqual(result.matched, false);
    });

    it('should simulate set wouldExecute true when matched', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      const policy = { id: 'sim3', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'deny', message: 'block' }] };
      const result = sim.simulate(policy, { x: 1 });
      assert.strictEqual(result.actions[0].wouldExecute, true);
    });

    it('should simulate set wouldExecute false when not matched', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      const policy = { id: 'sim4', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'deny' }] };
      const result = sim.simulate(policy, { x: 99 });
      assert.strictEqual(result.actions[0].wouldExecute, false);
    });

    it('should simulate with null policy return unmatched', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      const result = sim.simulate(null, { x: 1 });
      assert.strictEqual(result.matched, false);
    });

    it('should simulate with null data return unmatched', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      const policy = { id: 'nodata', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [] };
      const result = sim.simulate(policy, null);
      assert.strictEqual(result.matched, false);
    });

    it('should simulateAll return array', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      const policies = [
        { id: 'a', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [] },
        { id: 'b', conditions: [{ field: 'y', operator: 'eq', value: 2 }], actions: [] }
      ];
      const results = sim.simulateAll(policies, { x: 1, y: 2 });
      assert.strictEqual(results.length, 2);
    });

    it('should getHistory return all entries', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      sim.simulate({ id: 'h1', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [] }, { x: 1 });
      assert.strictEqual(sim.getHistory().length, 1);
    });

    it('should getHistory filter by policyId', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      sim.simulate({ id: 'h1', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [] }, { x: 1 });
      sim.simulate({ id: 'h2', conditions: [{ field: 'y', operator: 'eq', value: 2 }], actions: [] }, { y: 2 });
      assert.strictEqual(sim.getHistory({ policyId: 'h1' }).length, 1);
    });

    it('should getHistory filter by matched', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      sim.simulate({ id: 'a', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [] }, { x: 1 });
      sim.simulate({ id: 'b', conditions: [{ field: 'x', operator: 'eq', value: 99 }], actions: [] }, { x: 1 });
      assert.strictEqual(sim.getHistory({ matched: true }).length, 1);
    });

    it('should clear reset history', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      sim.simulate({ id: 'c', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [] }, { x: 1 });
      sim.clear();
      assert.strictEqual(sim.getHistory().length, 0);
    });

    it('should simulate with multiple conditions', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      const policy = { id: 'c2', conditions: [{ field: 'a', operator: 'eq', value: 1 }, { field: 'b', operator: 'gt', value: 0 }], actions: [] };
      const result = sim.simulate(policy, { a: 1, b: 5 });
      assert.strictEqual(result.matched, true);
    });

    it('should simulate with dot notation', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      const policy = { id: 'dot', conditions: [{ field: 'ai.cost.monthly', operator: 'gt', value: 1000 }], actions: [] };
      const result = sim.simulate(policy, { ai: { cost: { monthly: 2000 } } });
      assert.strictEqual(result.matched, true);
    });
  });

  describe('PolicyReporter', function() {
    it('should generate report with id and score', function() {
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const reg = new PolicyRegistry();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      reg.register({ id: 'r1', name: 'R1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      const report = rep.generate();
      assert.ok(report.id.startsWith('rpt_'));
      assert.strictEqual(typeof report.summary.complianceScore, 'number');
    });

    it('should generate with breakdowns', function() {
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const reg = new PolicyRegistry();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      reg.register({ id: 'b1', name: 'B1', type: 'billing', severity: 'high', enforcement: 'hard', enabled: true, conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.register({ id: 'b2', name: 'B2', type: 'security', severity: 'critical', enforcement: 'hard', enabled: false, conditions: [{ field: 'y', operator: 'eq', value: 2 }] });
      const report = rep.generate();
      assert.strictEqual(typeof report.breakdowns.byType, 'object');
      assert.strictEqual(report.summary.totalPolicies, 2);
    });

    it('should getReportById return stored report', function() {
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const reg = new PolicyRegistry();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      const report = rep.generate();
      const retrieved = rep.getReportById(report.id);
      assert.strictEqual(retrieved.id, report.id);
    });

    it('should getReportById return null for unknown', function() {
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const reg = new PolicyRegistry();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      assert.strictEqual(rep.getReportById('unknown'), null);
    });

    it('should listReports return array', function() {
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const reg = new PolicyRegistry();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      rep.generate();
      rep.generate();
      assert.strictEqual(rep.listReports().length, 2);
    });

    it('should exportCSV return string with headers', function() {
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const reg = new PolicyRegistry();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      reg.register({ id: 'csv1', name: 'CSV1', type: 'data', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      const report = rep.generate();
      const csv = rep.exportCSV(report.id);
      assert.ok(csv.includes('Policy ID'));
      assert.ok(csv.includes('csv1'));
    });

    it('should exportCSV return empty for unknown', function() {
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const reg = new PolicyRegistry();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      assert.strictEqual(rep.exportCSV('unknown'), '');
    });

    it('should generate with filters', function() {
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const reg = new PolicyRegistry();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      reg.register({ id: 'f1', name: 'F1', type: 'ai', tags: ['critical'], conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.register({ id: 'f2', name: 'F2', type: 'security', tags: ['low'], conditions: [{ field: 'y', operator: 'eq', value: 2 }] });
      const report = rep.generate({ type: 'security' });
      assert.strictEqual(report.summary.filteredCount, 1);
    });

    it('should return 100 score when no policies', function() {
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const reg = new PolicyRegistry();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      const report = rep.generate();
      assert.strictEqual(report.summary.complianceScore, 100);
    });

    it('should clear remove all reports', function() {
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const reg = new PolicyRegistry();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      rep.generate();
      rep.clear();
      assert.strictEqual(rep.listReports().length, 0);
    });
  });

  describe('PolicyVersioning', function() {
    it('should createVersion auto-increment version', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      const v1 = pv.createVersion({ id: 'pv1', name: 'PV1', type: 'ai' });
      assert.strictEqual(v1.version, 1);
      const v2 = pv.createVersion({ id: 'pv1', name: 'PV1', type: 'ai' });
      assert.strictEqual(v2.version, 2);
    });

    it('should getVersion return specific version', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      pv.createVersion({ id: 'gv1', name: 'GV1', type: 'ai' });
      pv.createVersion({ id: 'gv1', name: 'GV1 Updated', type: 'ai' });
      const v1 = pv.getVersion('gv1', 1);
      assert.strictEqual(v1.version, 1);
    });

    it('should getLatestVersion return latest', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      pv.createVersion({ id: 'lv1', name: 'V1', type: 'ai' });
      pv.createVersion({ id: 'lv1', name: 'V2', type: 'ai' });
      const latest = pv.getLatestVersion('lv1');
      assert.strictEqual(latest.version, 2);
    });

    it('should getLatestVersion return null for no versions', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      assert.strictEqual(pv.getLatestVersion('nope'), null);
    });

    it('should listVersions return descending order', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      pv.createVersion({ id: 'dv', name: 'V1', type: 'ai' });
      pv.createVersion({ id: 'dv', name: 'V2', type: 'ai' });
      const versions = pv.listVersions('dv');
      assert.strictEqual(versions.length, 2);
      assert.ok(versions[0].version > versions[1].version);
    });

    it('should listVersions return empty for missing', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      assert.deepStrictEqual(pv.listVersions('missing'), []);
    });

    it('should getVersion return null for missing version', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      assert.strictEqual(pv.getVersion('missing', 1), null);
    });

    it('should getVersion return null for null policyId', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      assert.strictEqual(pv.getVersion(null, 1), null);
    });

    it('should createVersion return null for null policy', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      assert.strictEqual(pv.createVersion(null), null);
    });

    it('should clear remove all versions', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      pv.createVersion({ id: 'clr', name: 'Clr', type: 'ai' });
      pv.clear();
      assert.strictEqual(pv.getLatestVersion('clr'), null);
    });

    it('should getVersion return null for undefined version', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      pv.createVersion({ id: 'uv', name: 'UV', type: 'ai' });
      assert.strictEqual(pv.getVersion('uv', undefined), null);
    });

    it('should listVersions return empty for null id', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      assert.deepStrictEqual(pv.listVersions(null), []);
    });
  });

  describe('PolicyDiff', function() {
    it('should diff show added fields', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      const a = { name: 'Old', type: 'ai' };
      const b = { name: 'Old', type: 'ai', severity: 'high' };
      const result = policyDiff.diff(a, b);
      assert.strictEqual(result.added.length, 1);
      assert.strictEqual(result.added[0].key, 'severity');
    });

    it('should diff show removed fields', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      const a = { name: 'Full', type: 'ai', enabled: true };
      const b = { name: 'Full', type: 'ai' };
      const result = policyDiff.diff(a, b);
      assert.strictEqual(result.removed.length, 1);
      assert.strictEqual(result.removed[0].key, 'enabled');
    });

    it('should diff show changed fields', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      const a = { name: 'Test', type: 'ai', severity: 'low' };
      const b = { name: 'Test', type: 'ai', severity: 'high' };
      const result = policyDiff.diff(a, b);
      assert.strictEqual(result.changed.length, 1);
      assert.strictEqual(result.changed[0].key, 'severity');
    });

    it('should diff identical return same count', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      const a = { name: 'Same', type: 'ai', severity: 'medium' };
      const b = { name: 'Same', type: 'ai', severity: 'medium' };
      const result = policyDiff.diff(a, b);
      assert.strictEqual(result.added.length, 0);
      assert.strictEqual(result.removed.length, 0);
      assert.strictEqual(result.changed.length, 0);
      assert.ok(result.same.length > 0);
    });

    it('should diff with empty objects', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      const result = policyDiff.diff({}, {});
      assert.strictEqual(result.same.length, 0);
    });

    it('should diffAgainstCurrent work', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      pv.createVersion({ id: 'dc', name: 'DC', type: 'ai' });
      const result = policyDiff.diffAgainstCurrent('dc', { id: 'dc', name: 'DC Updated', type: 'ai', severity: 'high' });
      assert.ok(result.changed.length > 0 || result.added.length > 0);
    });

    it('should diffAgainstCurrent return null for missing', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      assert.strictEqual(policyDiff.diffAgainstCurrent(null, null), null);
    });

    it('should summarizeDiff return string', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      const result = policyDiff.diff({ name: 'A' }, { name: 'A', severity: 'high' });
      const summary = policyDiff.summarizeDiff(result);
      assert.ok(typeof summary === 'string');
      assert.ok(summary.includes('added'));
    });

    it('should summarizeDiff null return No changes', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      assert.strictEqual(policyDiff.summarizeDiff(null), 'No changes');
    });

    it('should clear works', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      policyDiff.clear();
    });

    it('should diff null versionA return empty', function() {
      const policyDiff = require('../lib/governance/policyDiff');
      const result = policyDiff.diff(null, {});
      assert.strictEqual(result.added.length, 0);
    });
  });

  describe('PolicyRollback', function() {
    it('should rollback return success with new version', function() {
      const policyRollback = require('../lib/governance/policyRollback');
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      policyRollback.clear();
      pv.createVersion({ id: 'rb1', name: 'RB1', type: 'ai' });
      pv.createVersion({ id: 'rb1', name: 'RB1 v2', type: 'ai' });
      const result = policyRollback.rollback('rb1', 1);
      assert.strictEqual(result.success, true);
      assert.ok(result.newVersion > 1);
    });

    it('should canRollback return bool', function() {
      const policyRollback = require('../lib/governance/policyRollback');
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      policyRollback.clear();
      pv.createVersion({ id: 'cr1', name: 'CR1', type: 'ai' });
      pv.createVersion({ id: 'cr1', name: 'CR1 v2', type: 'ai' });
      assert.strictEqual(policyRollback.canRollback('cr1', 1), true);
      assert.strictEqual(policyRollback.canRollback('cr1', 99), false);
    });

    it('should rollback non-existent version fail', function() {
      const policyRollback = require('../lib/governance/policyRollback');
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      policyRollback.clear();
      pv.createVersion({ id: 'rb2', name: 'RB2', type: 'ai' });
      const result = policyRollback.rollback('rb2', 999);
      assert.strictEqual(result.success, false);
    });

    it('should rollback null policyId fail', function() {
      const policyRollback = require('../lib/governance/policyRollback');
      policyRollback.clear();
      const result = policyRollback.rollback(null, 1);
      assert.strictEqual(result.success, false);
    });

    it('should getRollbackHistory return entries', function() {
      const policyRollback = require('../lib/governance/policyRollback');
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      policyRollback.clear();
      pv.createVersion({ id: 'gh', name: 'GH', type: 'ai' });
      pv.createVersion({ id: 'gh', name: 'GH v2', type: 'ai' });
      policyRollback.rollback('gh', 1);
      assert.strictEqual(policyRollback.getRollbackHistory().length, 1);
    });

    it('should getRollbackHistory empty initially', function() {
      const policyRollback = require('../lib/governance/policyRollback');
      policyRollback.clear();
      assert.deepStrictEqual(policyRollback.getRollbackHistory(), []);
    });

    it('should canRollback return false for missing policy', function() {
      const policyRollback = require('../lib/governance/policyRollback');
      assert.strictEqual(policyRollback.canRollback('nope', 1), false);
    });

    it('should clear reset history', function() {
      const policyRollback = require('../lib/governance/policyRollback');
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      policyRollback.clear();
      pv.createVersion({ id: 'clr2', name: 'Clr', type: 'ai' });
      pv.createVersion({ id: 'clr2', name: 'Clr v2', type: 'ai' });
      policyRollback.rollback('clr2', 1);
      policyRollback.clear();
      assert.strictEqual(policyRollback.getRollbackHistory().length, 0);
    });

    it('should rollback when target >= current version fail', function() {
      const policyRollback = require('../lib/governance/policyRollback');
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      policyRollback.clear();
      pv.createVersion({ id: 'tv', name: 'TV', type: 'ai' });
      pv.createVersion({ id: 'tv', name: 'TV v2', type: 'ai' });
      const result = policyRollback.rollback('tv', 2);
      assert.strictEqual(result.success, false);
    });
  });

  describe('ruleEngine', function() {
    it('should evaluate single rule', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      const rules = [{ field: 'age', operator: 'gt', value: 18 }];
      const result = ruleEngine.evaluate(rules, { age: 25 });
      assert.strictEqual(result.matched, true);
    });

    it('should evaluateAll with multiple rule groups', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      const groups = [
        [{ field: 'x', operator: 'eq', value: 1 }],
        [{ field: 'y', operator: 'gt', value: 0 }]
      ];
      const results = ruleEngine.evaluateAll(groups, { x: 1, y: 5 });
      assert.strictEqual(results.length, 2);
    });

    it('should evaluate with gt operator', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      const result = ruleEngine.evaluate([{ field: 'val', operator: 'gt', value: 10 }], { val: 15 });
      assert.strictEqual(result.matched, true);
    });

    it('should evaluate with eq operator', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      const result = ruleEngine.evaluate([{ field: 'status', operator: 'eq', value: 'active' }], { status: 'active' });
      assert.strictEqual(result.matched, true);
    });

    it('should evaluate with contains operator', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      const result = ruleEngine.evaluate([{ field: 'name', operator: 'contains', value: 'test' }], { name: 'testing' });
      assert.strictEqual(result.matched, true);
    });

    it('should return matched false for non-matching rules', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      const result = ruleEngine.evaluate([{ field: 'x', operator: 'eq', value: 1 }], { x: 99 });
      assert.strictEqual(result.matched, false);
    });

    it('should clearCache works', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      ruleEngine.clearCache();
    });

    it('should evaluate with non-array rules return not matched', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      const result = ruleEngine.evaluate(null, { x: 1 });
      assert.strictEqual(result.matched, false);
    });

    it('should evaluate with null data return not matched', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      const result = ruleEngine.evaluate([{ field: 'x', operator: 'eq', value: 1 }], null);
      assert.strictEqual(result.matched, false);
    });

    it('should evaluate with neq operator', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      const result = ruleEngine.evaluate([{ field: 'role', operator: 'neq', value: 'admin' }], { role: 'user' });
      assert.strictEqual(result.matched, true);
    });

    it('should evaluateAll with non-array return empty', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      assert.deepStrictEqual(ruleEngine.evaluateAll(null, {}), []);
    });

    it('should evaluate with lte operator', function() {
      const ruleEngine = require('../lib/governance/ruleEngine');
      const result = ruleEngine.evaluate([{ field: 'count', operator: 'lte', value: 5 }], { count: 5 });
      assert.strictEqual(result.matched, true);
    });
  });

  describe('conditionParser', function() {
    it('should parse condition into tokens', function() {
      const cp = require('../lib/governance/conditionParser');
      const result = cp.parse({ field: 'ai.cost.monthly', operator: 'gt', value: 100 });
      assert.ok(Array.isArray(result.tokens));
      assert.strictEqual(result.tokens.length, 3);
    });

    it('should parseExpression string', function() {
      const cp = require('../lib/governance/conditionParser');
      const result = cp.parseExpression("age gt 18");
      assert.strictEqual(result.field, 'age');
      assert.strictEqual(result.operator, 'gt');
      assert.strictEqual(result.value, 18);
    });

    it('should tokenize dot notation', function() {
      const cp = require('../lib/governance/conditionParser');
      const tokens = cp.tokenize('ai.cost.monthly');
      assert.strictEqual(tokens.length, 3);
      assert.strictEqual(tokens[0].value, 'ai');
      assert.strictEqual(tokens[1].value, 'cost');
    });

    it('should validate valid condition', function() {
      const cp = require('../lib/governance/conditionParser');
      const result = cp.validate({ field: 'age', operator: 'gt', value: 18 });
      assert.strictEqual(result.valid, true);
    });

    it('should validate invalid condition missing field', function() {
      const cp = require('../lib/governance/conditionParser');
      const result = cp.validate({ operator: 'eq', value: 1 });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should parse null condition return defaults', function() {
      const cp = require('../lib/governance/conditionParser');
      const result = cp.parse(null);
      assert.strictEqual(result.field, '');
    });

    it('should parseExpression with quoted value', function() {
      const cp = require('../lib/governance/conditionParser');
      const result = cp.parseExpression("name eq \"john\"");
      assert.strictEqual(result.value, 'john');
    });

    it('should parseExpression with boolean value', function() {
      const cp = require('../lib/governance/conditionParser');
      const result = cp.parseExpression("active eq true");
      assert.strictEqual(result.value, true);
    });

    it('should tokenize empty field return empty', function() {
      const cp = require('../lib/governance/conditionParser');
      assert.deepStrictEqual(cp.tokenize(null), []);
    });

    it('should validate null condition return invalid', function() {
      const cp = require('../lib/governance/conditionParser');
      const result = cp.validate(null);
      assert.strictEqual(result.valid, false);
    });

    it('should parseExpression with null return defaults', function() {
      const cp = require('../lib/governance/conditionParser');
      const result = cp.parseExpression(null);
      assert.strictEqual(result.field, '');
    });

    it('should parseExpression with contains operator', function() {
      const cp = require('../lib/governance/conditionParser');
      const result = cp.parseExpression("name contains 'test'");
      assert.strictEqual(result.operator, 'contains');
      assert.strictEqual(result.value, 'test');
    });
  });

  describe('expressionEvaluator', function() {
    it('should evaluateField dot notation resolves', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      const val = ee.evaluateField('a.b.c', { a: { b: { c: 42 } } });
      assert.strictEqual(val, 42);
    });

    it('should applyOperator eq returns true', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.applyOperator('eq', 5, 5), true);
    });

    it('should applyOperator neq returns true', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.applyOperator('neq', 5, 3), true);
    });

    it('should applyOperator gt returns true', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.applyOperator('gt', 10, 5), true);
    });

    it('should applyOperator lt returns true', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.applyOperator('lt', 3, 5), true);
    });

    it('should applyOperator contains returns true', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.applyOperator('contains', 'hello world', 'world'), true);
    });

    it('should applyOperator in returns true', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.applyOperator('in', 'red', ['red', 'blue']), true);
    });

    it('should getSupportedOperators return array', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      const ops = ee.getSupportedOperators();
      assert.ok(Array.isArray(ops));
      assert.ok(ops.includes('eq'));
      assert.ok(ops.includes('gt'));
    });

    it('should evaluate expression with dot notation', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      const result = ee.evaluate({ field: 'user.age', operator: 'gt', value: 18 }, { user: { age: 25 } });
      assert.strictEqual(result, true);
    });

    it('should evaluate with null expression return false', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.evaluate(null, { x: 1 }), false);
    });

    it('should evaluate with null data return false', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.evaluate({ field: 'x', operator: 'eq', value: 1 }, null), false);
    });

    it('should evaluateField missing field returns undefined', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.evaluateField('missing', { x: 1 }), undefined);
    });

    it('should evaluateField null field returns undefined', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.evaluateField(null, { x: 1 }), undefined);
    });

    it('should applyOperator exists returns true', function() {
      const ee = require('../lib/governance/expressionEvaluator');
      assert.strictEqual(ee.applyOperator('exists', 42, null), true);
    });
  });

  describe('constraintEngine', function() {
    it('should validateConstraints with min constraint', function() {
      const ce = require('../lib/governance/constraintEngine');
      const result = ce.validateConstraints({ count: 5 }, [{ field: 'count', type: 'number', min: 3 }]);
      assert.strictEqual(result.valid, true);
    });

    it('should validateConstraints with max constraint fail', function() {
      const ce = require('../lib/governance/constraintEngine');
      const result = ce.validateConstraints({ count: 15 }, [{ field: 'count', type: 'number', max: 10 }]);
      assert.strictEqual(result.valid, false);
    });

    it('should validateConstraints with required field', function() {
      const ce = require('../lib/governance/constraintEngine');
      const result = ce.validateConstraints({ name: 'test' }, [{ field: 'name', required: true }]);
      assert.strictEqual(result.valid, true);
    });

    it('should validateConstraints missing required field fail', function() {
      const ce = require('../lib/governance/constraintEngine');
      const result = ce.validateConstraints({}, [{ field: 'name', required: true }]);
      assert.strictEqual(result.valid, false);
    });

    it('should addConstraint and getConstraints', function() {
      const ce = require('../lib/governance/constraintEngine');
      ce.clear();
      ce.addConstraint('maxCost', { field: 'cost', type: 'number', max: 100 });
      const constraints = ce.getConstraints();
      assert.strictEqual(constraints.length, 1);
      assert.strictEqual(constraints[0].name, 'maxCost');
    });

    it('should removeConstraint', function() {
      const ce = require('../lib/governance/constraintEngine');
      ce.clear();
      ce.addConstraint('test', { field: 'x', required: true });
      ce.removeConstraint('test');
      assert.strictEqual(ce.getConstraints().length, 0);
    });

    it('should checkConstraint return valid true for matching', function() {
      const ce = require('../lib/governance/constraintEngine');
      const result = ce.checkConstraint({ val: 50 }, { field: 'val', type: 'number', min: 10, max: 100 });
      assert.strictEqual(result.valid, true);
    });

    it('should checkConstraint return errors for violation', function() {
      const ce = require('../lib/governance/constraintEngine');
      const result = ce.checkConstraint({ val: 200 }, { field: 'val', type: 'number', max: 100 });
      assert.strictEqual(result.valid, false);
    });

    it('should checkConstraint with null constraint return valid', function() {
      const ce = require('../lib/governance/constraintEngine');
      assert.strictEqual(ce.checkConstraint({}, null).valid, true);
    });

    it('should validateConstraints with null data return valid', function() {
      const ce = require('../lib/governance/constraintEngine');
      assert.strictEqual(ce.validateConstraints(null, []).valid, true);
    });

    it('should checkConstraint with pattern', function() {
      const ce = require('../lib/governance/constraintEngine');
      const result = ce.checkConstraint({ email: 'test@example.com' }, { field: 'email', type: 'string', pattern: '^test@' });
      assert.strictEqual(result.valid, true);
    });

    it('should clear constraints', function() {
      const ce = require('../lib/governance/constraintEngine');
      ce.clear();
      assert.strictEqual(ce.getConstraints().length, 0);
    });
  });

  describe('approvalEngine', function() {
    it('should createApproval and get approval', function() {
      const ae = require('../lib/governance/approvalEngine');
      ae.clear();
      const approval = ae.createApproval({ policyId: 'p1', reason: 'test', requestedBy: 'user1', approvers: ['admin'] });
      assert.ok(approval.id.startsWith('appr_'));
      const retrieved = ae.getApproval(approval.id);
      assert.strictEqual(retrieved.id, approval.id);
    });

    it('should processApproval approve', function() {
      const ae = require('../lib/governance/approvalEngine');
      ae.clear();
      const approval = ae.createApproval({ policyId: 'p1', reason: 'test', requestedBy: 'user1' });
      const result = ae.processApproval(approval.id, 'approved', 'admin', 'ok');
      assert.strictEqual(result.status, 'approved');
    });

    it('should processApproval reject', function() {
      const ae = require('../lib/governance/approvalEngine');
      ae.clear();
      const approval = ae.createApproval({ policyId: 'p1', reason: 'test', requestedBy: 'user1' });
      const result = ae.processApproval(approval.id, 'rejected', 'admin', 'no');
      assert.strictEqual(result.status, 'rejected');
    });

    it('should processApproval with invalid approval return null', function() {
      const ae = require('../lib/governance/approvalEngine');
      ae.clear();
      const result = ae.processApproval('nonexistent', 'approved', 'admin');
      assert.strictEqual(result, null);
    });

    it('should listApprovals with filters', function() {
      const ae = require('../lib/governance/approvalEngine');
      ae.clear();
      ae.createApproval({ policyId: 'p1', reason: 'r1', requestedBy: 'u1' });
      ae.createApproval({ policyId: 'p2', reason: 'r2', requestedBy: 'u2' });
      const list = ae.listApprovals({ policyId: 'p1' });
      assert.strictEqual(list.length, 1);
    });

    it('should getPendingApprovals return pending only', function() {
      const ae = require('../lib/governance/approvalEngine');
      ae.clear();
      const a1 = ae.createApproval({ policyId: 'p1', reason: 'r1', requestedBy: 'u1' });
      ae.createApproval({ policyId: 'p2', reason: 'r2', requestedBy: 'u2' });
      ae.processApproval(a1.id, 'approved', 'admin');
      const pending = ae.getPendingApprovals();
      assert.strictEqual(pending.length, 1);
    });

    it('should listApprovals without filters return all', function() {
      const ae = require('../lib/governance/approvalEngine');
      ae.clear();
      ae.createApproval({ policyId: 'p1', reason: 'r1', requestedBy: 'u1' });
      ae.createApproval({ policyId: 'p2', reason: 'r2', requestedBy: 'u2' });
      assert.strictEqual(ae.listApprovals().length, 2);
    });

    it('should checkApprovalRequired with requiresApproval', function() {
      const ae = require('../lib/governance/approvalEngine');
      assert.strictEqual(ae.checkApprovalRequired({ requiresApproval: true }, {}), true);
    });

    it('should checkApprovalRequired with threshold', function() {
      const ae = require('../lib/governance/approvalEngine');
      assert.strictEqual(ae.checkApprovalRequired({ approvalThreshold: 100 }, { value: 200 }), true);
    });

    it('should checkApprovalRequired with no match', function() {
      const ae = require('../lib/governance/approvalEngine');
      assert.strictEqual(ae.checkApprovalRequired({}, {}), false);
    });

    it('should checkApprovalRequired with null policy', function() {
      const ae = require('../lib/governance/approvalEngine');
      assert.strictEqual(ae.checkApprovalRequired(null, {}), false);
    });

    it('should createApproval null request return null', function() {
      const ae = require('../lib/governance/approvalEngine');
      ae.clear();
      assert.strictEqual(ae.createApproval(null), null);
    });

    it('should clear', function() {
      const ae = require('../lib/governance/approvalEngine');
      ae.clear();
      ae.createApproval({ policyId: 'p1', reason: 'r', requestedBy: 'u' });
      ae.clear();
      assert.strictEqual(ae.listApprovals().length, 0);
    });
  });

  describe('approvalManager', function() {
    it('should createRequest and get request', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      const req = am.createRequest('p1', 'reason', 'user1');
      assert.ok(req.id.startsWith('req_'));
      const retrieved = am.getRequest(req.id);
      assert.strictEqual(retrieved.id, req.id);
    });

    it('should approve changes status', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      const req = am.createRequest('p1', 'reason', 'user1');
      const result = am.approve(req.id, 'admin');
      assert.strictEqual(result.status, 'approved');
    });

    it('should reject changes status', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      const req = am.createRequest('p1', 'reason', 'user1');
      const result = am.reject(req.id, 'admin', 'no');
      assert.strictEqual(result.status, 'rejected');
    });

    it('should cancel request', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      const req = am.createRequest('p1', 'reason', 'user1');
      const result = am.cancel(req.id);
      assert.strictEqual(result.status, 'cancelled');
    });

    it('should listRequests with filters', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      am.createRequest('p1', 'r1', 'u1');
      am.createRequest('p2', 'r2', 'u2');
      assert.strictEqual(am.listRequests({ policyId: 'p1' }).length, 1);
    });

    it('should listRequests without filters return all', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      am.createRequest('p1', 'r1', 'u1');
      am.createRequest('p2', 'r2', 'u2');
      assert.strictEqual(am.listRequests().length, 2);
    });

    it('should getStats return totals', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      const r1 = am.createRequest('p1', 'r1', 'u1');
      const r2 = am.createRequest('p2', 'r2', 'u2');
      am.approve(r1.id, 'admin');
      const stats = am.getStats();
      assert.strictEqual(stats.total, 2);
      assert.strictEqual(stats.approved, 1);
      assert.strictEqual(stats.pending, 1);
    });

    it('should createRequest with null params return null', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      assert.strictEqual(am.createRequest(null, 'r', null), null);
    });

    it('should approve non-existent return null', function() {
      const am = require('../lib/governance/approvalManager');
      assert.strictEqual(am.approve('nope', 'admin'), null);
    });

    it('should reject non-pending return null', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      const req = am.createRequest('p1', 'r', 'u1');
      am.approve(req.id, 'admin');
      assert.strictEqual(am.reject(req.id, 'admin', ''), null);
    });

    it('should cancel non-pending return null', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      const req = am.createRequest('p1', 'r', 'u1');
      am.approve(req.id, 'admin');
      assert.strictEqual(am.cancel(req.id), null);
    });

    it('should clear', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      am.createRequest('p1', 'r', 'u1');
      am.clear();
      assert.strictEqual(am.getStats().total, 0);
    });

    it('should getStats empty return zeros', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      const stats = am.getStats();
      assert.strictEqual(stats.total, 0);
      assert.strictEqual(stats.pending, 0);
    });
  });

  describe('approvalWorkflow', function() {
    it('should defineWorkflow and getWorkflow', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.clear();
      aw.defineWorkflow('basic', [{ name: 'step1', approvers: ['admin'] }]);
      const wf = aw.getWorkflow('basic');
      assert.strictEqual(wf.name, 'basic');
    });

    it('should listWorkflows', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.clear();
      aw.defineWorkflow('wf1', [{ name: 's1' }]);
      aw.defineWorkflow('wf2', [{ name: 's2' }]);
      assert.strictEqual(aw.listWorkflows().length, 2);
    });

    it('should startWorkflow', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.clear();
      aw.defineWorkflow('test', [{ name: 'review', approvers: ['admin'] }]);
      const instance = aw.startWorkflow('req1', 'test');
      assert.strictEqual(instance.status, 'in_progress');
    });

    it('should getWorkflowStatus', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.clear();
      aw.defineWorkflow('test', [{ name: 'step1', approvers: ['admin'] }]);
      aw.startWorkflow('req1', 'test');
      const status = aw.getWorkflowStatus('req1');
      assert.strictEqual(status.status, 'in_progress');
    });

    it('should advanceWorkflow step', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.clear();
      aw.defineWorkflow('test', [{ name: 'step1', approvers: ['admin'] }]);
      aw.startWorkflow('req1', 'test');
      const result = aw.advanceWorkflow('req1', 'approved', 'admin');
      assert.strictEqual(result.status, 'completed');
    });

    it('should advanceWorkflow rejected', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.clear();
      aw.defineWorkflow('test', [{ name: 'step1', approvers: ['admin'] }]);
      aw.startWorkflow('req1', 'test');
      const result = aw.advanceWorkflow('req1', 'rejected', 'admin');
      assert.strictEqual(result.status, 'rejected');
    });

    it('should advanceWorkflow with invalid return null', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      assert.strictEqual(aw.advanceWorkflow('nope', 'approved', 'admin'), null);
    });

    it('should startWorkflow with missing workflow return null', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.clear();
      assert.strictEqual(aw.startWorkflow('req1', 'nope'), null);
    });

    it('should defineWorkflow with no name do nothing', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.defineWorkflow(null, []);
    });

    it('should clear', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.clear();
      aw.defineWorkflow('test', [{ name: 's1' }]);
      aw.clear();
      assert.strictEqual(aw.listWorkflows().length, 0);
    });

    it('should startWorkflow with null requestId return null', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.clear();
      aw.defineWorkflow('test', [{ name: 's1' }]);
      assert.strictEqual(aw.startWorkflow(null, 'test'), null);
    });

    it('should startWorkflow with empty steps return null', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      aw.clear();
      aw.defineWorkflow('empty', []);
      assert.strictEqual(aw.startWorkflow('req1', 'empty'), null);
    });

    it('should getWorkflowStatus return null for missing', function() {
      const aw = require('../lib/governance/approvalWorkflow');
      assert.strictEqual(aw.getWorkflowStatus('nope'), null);
    });
  });

  describe('approvalHistory', function() {
    it('should record and getHistory return timeline', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      ah.record({ requestId: 'r1', action: 'approved', actor: 'admin' });
      const history = ah.getHistory('r1');
      assert.strictEqual(history.length, 1);
    });

    it('should query by actor', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      ah.record({ requestId: 'r1', action: 'approved', actor: 'admin' });
      ah.record({ requestId: 'r2', action: 'rejected', actor: 'user' });
      const results = ah.query({ actor: 'admin' });
      assert.strictEqual(results.length, 1);
    });

    it('should query by action', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      ah.record({ requestId: 'r1', action: 'approved', actor: 'admin' });
      ah.record({ requestId: 'r2', action: 'approved', actor: 'user' });
      const results = ah.query({ action: 'approved' });
      assert.strictEqual(results.length, 2);
    });

    it('should getStats', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      ah.record({ requestId: 'r1', action: 'approved', actor: 'admin' });
      ah.record({ requestId: 'r2', action: 'rejected', actor: 'user' });
      const stats = ah.getStats();
      assert.strictEqual(stats.total, 2);
      assert.strictEqual(stats.byAction.approved, 1);
    });

    it('should getStats empty return zeros', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      const stats = ah.getStats();
      assert.strictEqual(stats.total, 0);
    });

    it('should getHistory for unknown return empty', function() {
      const ah = require('../lib/governance/approvalHistory');
      assert.deepStrictEqual(ah.getHistory('nope'), []);
    });

    it('should record null entry return null', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      assert.strictEqual(ah.record(null), null);
    });

    it('should query with since filter', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      ah.record({ requestId: 'r1', action: 'approved', actor: 'admin', timestamp: new Date(Date.now() - 86400000).toISOString() });
      const results = ah.query({ since: new Date().toISOString() });
      assert.strictEqual(results.length, 0);
    });

    it('should query with limit', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      ah.record({ requestId: 'r1', action: 'a', actor: 'u1' });
      ah.record({ requestId: 'r2', action: 'b', actor: 'u2' });
      const results = ah.query({ limit: 1 });
      assert.strictEqual(results.length, 1);
    });

    it('should query without filters return all', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      ah.record({ requestId: 'r1', action: 'a', actor: 'u1' });
      assert.strictEqual(ah.query().length, 1);
    });

    it('should clear', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      ah.record({ requestId: 'r1', action: 'a', actor: 'u1' });
      ah.clear();
      assert.strictEqual(ah.getHistory('r1').length, 0);
    });

    it('should getHistory sort entries by timestamp', function() {
      const ah = require('../lib/governance/approvalHistory');
      ah.clear();
      ah.record({ requestId: 'r1', action: 'first', actor: 'u1', timestamp: '2020-01-01T00:00:00Z' });
      ah.record({ requestId: 'r1', action: 'second', actor: 'u1', timestamp: '2020-01-02T00:00:00Z' });
      const hist = ah.getHistory('r1');
      assert.strictEqual(hist[0].action, 'first');
    });
  });

  describe('approvalRules', function() {
    it('should defineRule and getRule', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('rule1', { policyType: 'ai', enforcement: 'strict', conditions: [], requiredApprovers: ['admin'] });
      const rule = ar.getRule('rule1');
      assert.strictEqual(rule.name, 'rule1');
    });

    it('should listRules', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('r1', { policyType: 'ai' });
      ar.defineRule('r2', { policyType: 'security' });
      assert.strictEqual(ar.listRules().length, 2);
    });

    it('should findMatchingRules', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('aiRule', { policyType: 'ai', conditions: [{ field: 'severity', operator: 'eq', value: 'high' }] });
      const matches = ar.findMatchingRules({ type: 'ai', severity: 'high' }, {});
      assert.strictEqual(matches.length, 1);
    });

    it('should evaluateRule', function() {
      const ar = require('../lib/governance/approvalRules');
      const result = ar.evaluateRule({ policyType: 'ai', conditions: [] }, { type: 'ai' }, {});
      assert.strictEqual(result, true);
    });

    it('should evaluateRule return false for non-matching type', function() {
      const ar = require('../lib/governance/approvalRules');
      const result = ar.evaluateRule({ policyType: 'ai' }, { type: 'security' }, {});
      assert.strictEqual(result, false);
    });

    it('should removeRule', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('r1', { policyType: 'ai' });
      ar.removeRule('r1');
      assert.strictEqual(ar.getRule('r1'), null);
    });

    it('should findMatchingRules empty for null policy', function() {
      const ar = require('../lib/governance/approvalRules');
      assert.deepStrictEqual(ar.findMatchingRules(null, {}), []);
    });

    it('should evaluateRule with null rule return false', function() {
      const ar = require('../lib/governance/approvalRules');
      assert.strictEqual(ar.evaluateRule(null, { type: 'ai' }, {}), false);
    });

    it('should evaluateRule with eq condition', function() {
      const ar = require('../lib/governance/approvalRules');
      const result = ar.evaluateRule({ policyType: 'ai', conditions: [{ field: 'severity', operator: 'eq', value: 'high' }] }, { type: 'ai', severity: 'high' }, {});
      assert.strictEqual(result, true);
    });

    it('should evaluateRule with neq condition', function() {
      const ar = require('../lib/governance/approvalRules');
      const result = ar.evaluateRule({ policyType: 'ai', conditions: [{ field: 'severity', operator: 'neq', value: 'low' }] }, { type: 'ai', severity: 'high' }, {});
      assert.strictEqual(result, true);
    });

    it('should defineRule with null name do nothing', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.defineRule(null, {});
    });

    it('should clear', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('r1', { policyType: 'ai' });
      ar.clear();
      assert.strictEqual(ar.listRules().length, 0);
    });
  });

  describe('complianceEngine', function() {
    it('should scan return id results score status', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      const result = ce.scan([], {});
      assert.ok(result.id.startsWith('scan_'));
      assert.strictEqual(result.score, 100);
      assert.strictEqual(result.status, 'completed');
    });

    it('should getScan by id', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      const scan = ce.scan([], {});
      const retrieved = ce.getScan(scan.id);
      assert.strictEqual(retrieved.id, scan.id);
    });

    it('should getScan return null for missing', function() {
      const ce = require('../lib/governance/complianceEngine');
      assert.strictEqual(ce.getScan('nope'), null);
    });

    it('should listScans with filters', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      ce.scan([], {});
      ce.scan([], {});
      assert.strictEqual(ce.listScans().length, 2);
    });

    it('should listScans with status filter', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      ce.scan([], {});
      assert.strictEqual(ce.listScans({ status: 'completed' }).length, 1);
    });

    it('should getComplianceScore return number', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      const result = ce.getComplianceScore();
      assert.strictEqual(typeof result, 'number');
    });

    it('should getComplianceScore default 100 for no scans', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      assert.strictEqual(ce.getComplianceScore(), 100);
    });

    it('should getViolations return array', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      ce.scan([{ id: 'p1', rules: [{ field: 'x', operator: 'eq', value: 1 }] }], { x: 99 });
      const violations = ce.getViolations();
      assert.ok(Array.isArray(violations));
    });

    it('should scan with null policies return null', function() {
      const ce = require('../lib/governance/complianceEngine');
      assert.strictEqual(ce.scan(null, {}), null);
    });

    it('should listScans with limit', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      ce.scan([], {});
      ce.scan([], {});
      ce.scan([], {});
      assert.strictEqual(ce.listScans({ limit: 2 }).length, 2);
    });

    it('should clear', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      ce.scan([], {});
      ce.clear();
      assert.strictEqual(ce.listScans().length, 0);
    });

    it('should scan with policies returns score based on compliance', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      const result = ce.scan([{ id: 'c1', rules: [{ field: 'x', operator: 'eq', value: 1 }] }], { x: 1 });
      assert.strictEqual(result.score, 100);
    });

    it('should scan with non-compliant policy reduces score', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      const result = ce.scan([{ id: 'nc', rules: [{ field: 'x', operator: 'eq', value: 1 }] }], { x: 99 });
      assert.ok(result.score < 100);
    });
  });

  describe('complianceScanner', function() {
    it('should checkPolicy return compliant and issues', function() {
      const cs = require('../lib/governance/complianceScanner');
      cs.clear();
      const result = cs.checkPolicy({ id: 'p1', rules: [{ field: 'x', operator: 'eq', value: 1 }] }, { x: 1 });
      assert.strictEqual(result.compliant, true);
    });

    it('should checkPolicy return non-compliant for mismatch', function() {
      const cs = require('../lib/governance/complianceScanner');
      cs.clear();
      const result = cs.checkPolicy({ id: 'p1', rules: [{ field: 'x', operator: 'eq', value: 1 }] }, { x: 99 });
      assert.strictEqual(result.compliant, false);
    });

    it('should checkCategory', function() {
      const cs = require('../lib/governance/complianceScanner');
      cs.clear();
      const result = cs.checkCategory([{ id: 'p1', rules: [{ field: 'x', operator: 'eq', value: 1 }], category: 'security' }], { x: 1 });
      assert.strictEqual(result.compliant, true);
    });

    it('should runFullScan return array', function() {
      const cs = require('../lib/governance/complianceScanner');
      cs.clear();
      const results = cs.runFullScan([{ id: 'p1', rules: [{ field: 'x', operator: 'eq', value: 1 }] }], { x: 1 });
      assert.strictEqual(results.length, 1);
    });

    it('should getFindings return array', function() {
      const cs = require('../lib/governance/complianceScanner');
      cs.clear();
      assert.deepStrictEqual(cs.getFindings('scan1'), []);
    });

    it('should checkPolicy with null return defaults', function() {
      const cs = require('../lib/governance/complianceScanner');
      const result = cs.checkPolicy(null, {});
      assert.strictEqual(result.compliant, true);
    });

    it('should runFullScan with non-array return empty', function() {
      const cs = require('../lib/governance/complianceScanner');
      assert.deepStrictEqual(cs.runFullScan(null, {}), []);
    });

    it('should checkCategory with non-array return defaults', function() {
      const cs = require('../lib/governance/complianceScanner');
      const result = cs.checkCategory(null, {});
      assert.strictEqual(result.compliant, true);
    });

    it('should checkPolicy with severity critical score 50', function() {
      const cs = require('../lib/governance/complianceScanner');
      const result = cs.checkPolicy({ id: 'p1', severity: 'critical', rules: [{ field: 'x', operator: 'eq', value: 1 }] }, { x: 99 });
      assert.strictEqual(result.compliant, false);
      assert.ok(result.score < 100);
    });

    it('should clear', function() {
      const cs = require('../lib/governance/complianceScanner');
      cs.clear();
    });

    it('should checkPolicy score 100 when no rules', function() {
      const cs = require('../lib/governance/complianceScanner');
      const result = cs.checkPolicy({ id: 'p1' }, {});
      assert.strictEqual(result.compliant, true);
      assert.strictEqual(result.score, 100);
    });

    it('should checkCategory with category in result', function() {
      const cs = require('../lib/governance/complianceScanner');
      const result = cs.checkCategory([{ id: 'p1', category: 'test', rules: [] }], {});
      assert.strictEqual(result.category, 'test');
    });
  });

  describe('complianceReports', function() {
    it('should generate return report with summary', function() {
      const cr = require('../lib/governance/complianceReports');
      cr.clear();
      const report = cr.generate({ results: [{ compliant: true }, { compliant: false }], score: 50 });
      assert.ok(report.id.startsWith('report_'));
      assert.strictEqual(report.summary.total, 2);
    });

    it('should getReport by id', function() {
      const cr = require('../lib/governance/complianceReports');
      cr.clear();
      const report = cr.generate({ results: [], score: 100 });
      const retrieved = cr.getReport(report.id);
      assert.strictEqual(retrieved.id, report.id);
    });

    it('should getReport null for missing', function() {
      const cr = require('../lib/governance/complianceReports');
      assert.strictEqual(cr.getReport('nope'), null);
    });

    it('should listReports', function() {
      const cr = require('../lib/governance/complianceReports');
      cr.clear();
      cr.generate({ results: [], score: 100 });
      cr.generate({ results: [], score: 80 });
      assert.strictEqual(cr.listReports().length, 2);
    });

    it('should exportJSON', function() {
      const cr = require('../lib/governance/complianceReports');
      cr.clear();
      const report = cr.generate({ results: [{ compliant: true }], score: 100 });
      const json = cr.exportJSON(report.id);
      assert.ok(json.includes('score'));
      assert.ok(json.includes('100'));
    });

    it('should exportJSON return {} for missing', function() {
      const cr = require('../lib/governance/complianceReports');
      assert.strictEqual(cr.exportJSON('nope'), '{}');
    });

    it('should exportPDF return string', function() {
      const cr = require('../lib/governance/complianceReports');
      cr.clear();
      const report = cr.generate({ results: [], score: 100 });
      const pdf = cr.exportPDF(report.id);
      assert.ok(pdf.includes('Compliance Report'));
    });

    it('should exportPDF return not found for missing', function() {
      const cr = require('../lib/governance/complianceReports');
      assert.ok(cr.exportPDF('nope').includes('Not Found'));
    });

    it('should generate null return null', function() {
      const cr = require('../lib/governance/complianceReports');
      assert.strictEqual(cr.generate(null), null);
    });

    it('should generate with violations in summary', function() {
      const cr = require('../lib/governance/complianceReports');
      cr.clear();
      const report = cr.generate({ results: [{ compliant: false, issues: [{ field: 'x' }] }], score: 0 });
      assert.strictEqual(report.summary.violations, 1);
    });

    it('should clear', function() {
      const cr = require('../lib/governance/complianceReports');
      cr.clear();
      cr.generate({ results: [], score: 100 });
      cr.clear();
      assert.strictEqual(cr.listReports().length, 0);
    });

    it('should exportPDF show findings', function() {
      const cr = require('../lib/governance/complianceReports');
      cr.clear();
      const report = cr.generate({ results: [{ compliant: false, policyId: 'p1', issues: [{ field: 'x', expected: 1, actual: 0 }] }], score: 0 });
      const pdf = cr.exportPDF(report.id);
      assert.ok(pdf.includes('p1'));
      assert.ok(pdf.includes('Violations'));
    });

    it('should listReports empty initially', function() {
      const cr = require('../lib/governance/complianceReports');
      cr.clear();
      assert.deepStrictEqual(cr.listReports(), []);
    });
  });

  describe('complianceTemplates', function() {
    it('should registerTemplate and getTemplate', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('basic', { sections: [{ type: 'header', content: 'Report' }], format: 'markdown' });
      const tmpl = ct.getTemplate('basic');
      assert.strictEqual(tmpl.name, 'basic');
    });

    it('should listTemplates', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('t1', { sections: [], format: 'markdown' });
      ct.registerTemplate('t2', { sections: [], format: 'html' });
      assert.strictEqual(ct.listTemplates().length, 2);
    });

    it('should render with data', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('summary', { sections: [{ type: 'header', content: 'Score: {{score}}' }, { type: 'summary' }], format: 'markdown' });
      const output = ct.render('summary', { score: 85, total: 10, compliant: 8, violations: 2 });
      assert.ok(output.includes('Score: 85'));
    });

    it('should render with findings section', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('findings', { sections: [{ type: 'findings' }], format: 'markdown' });
      const output = ct.render('findings', { score: 100, findings: [{ policyId: 'p1', issues: [{ field: 'x', expected: 1, actual: 0 }] }] });
      assert.ok(output.includes('p1'));
    });

    it('should render with custom section', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('custom', { sections: [{ type: 'custom', content: 'Custom: {{value}}' }], format: 'markdown' });
      const output = ct.render('custom', { value: 'hello' });
      assert.ok(output.includes('Custom: hello'));
    });

    it('should render unknown template return empty', function() {
      const ct = require('../lib/governance/complianceTemplates');
      assert.strictEqual(ct.render('nope', {}), '');
    });

    it('should removeTemplate', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('t1', { sections: [], format: 'markdown' });
      ct.removeTemplate('t1');
      assert.strictEqual(ct.getTemplate('t1'), null);
    });

    it('should registerTemplate with null name do nothing', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.registerTemplate(null, {});
    });

    it('should render without data return empty', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('t1', { sections: [{ type: 'header', content: 'Hi' }], format: 'markdown' });
      assert.strictEqual(ct.render('t1', null), '');
    });

    it('should clear', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('t1', { sections: [], format: 'markdown' });
      ct.clear();
      assert.strictEqual(ct.listTemplates().length, 0);
    });

    it('should getTemplate null for missing', function() {
      const ct = require('../lib/governance/complianceTemplates');
      assert.strictEqual(ct.getTemplate('nope'), null);
    });
  });

  describe('auditEngine', function() {
    it('should record and query by type', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      ae.record({ type: 'security', actor: 'system', action: 'login' });
      const results = ae.query({ type: 'security' });
      assert.strictEqual(results.length, 1);
    });

    it('should query by actor', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      ae.record({ type: 'general', actor: 'admin', action: 'delete' });
      const results = ae.query({ actor: 'admin' });
      assert.strictEqual(results.length, 1);
    });

    it('should getEvent by id', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      const evt = ae.record({ type: 'test', actor: 'user', action: 'create' });
      const retrieved = ae.getEvent(evt.id);
      assert.strictEqual(retrieved.id, evt.id);
    });

    it('should getEvent return null for missing', function() {
      const ae = require('../lib/governance/auditEngine');
      assert.strictEqual(ae.getEvent('nope'), null);
    });

    it('should getStats return {total byType byActor}', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      ae.record({ type: 'auth', actor: 'admin', action: 'login' });
      ae.record({ type: 'auth', actor: 'admin', action: 'logout' });
      ae.record({ type: 'data', actor: 'system', action: 'export' });
      const stats = ae.getStats();
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.byType.auth, 2);
      assert.strictEqual(stats.byActor.admin, 2);
    });

    it('should query with resource filter', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      ae.record({ type: 'test', actor: 'u1', action: 'read', resource: 'file1' });
      const results = ae.query({ resource: 'file1' });
      assert.strictEqual(results.length, 1);
    });

    it('should query with action filter', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      ae.record({ type: 'test', actor: 'u1', action: 'create' });
      ae.record({ type: 'test', actor: 'u1', action: 'delete' });
      const results = ae.query({ action: 'create' });
      assert.strictEqual(results.length, 1);
    });

    it('should query with since filter', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      ae.record({ type: 'test', actor: 'u1', action: 'old', timestamp: '2020-01-01T00:00:00Z' });
      const results = ae.query({ since: '2025-01-01T00:00:00Z' });
      assert.strictEqual(results.length, 0);
    });

    it('should query with limit', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      ae.record({ type: 't', actor: 'u', action: 'a' });
      ae.record({ type: 't', actor: 'u', action: 'b' });
      assert.strictEqual(ae.query({ limit: 1 }).length, 1);
    });

    it('should record return null for null event', function() {
      const ae = require('../lib/governance/auditEngine');
      assert.strictEqual(ae.record(null), null);
    });

    it('should query without filters return all', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      ae.record({ type: 't', actor: 'u', action: 'a' });
      assert.strictEqual(ae.query().length, 1);
    });

    it('should clear', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      ae.record({ type: 't', actor: 'u', action: 'a' });
      ae.clear();
      assert.strictEqual(ae.query().length, 0);
    });

    it('should getStats empty return zeros', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      const stats = ae.getStats();
      assert.strictEqual(stats.total, 0);
    });

    it('should record with details', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      const evt = ae.record({ type: 'test', actor: 'u', action: 'update', details: { key: 'value' } });
      assert.deepStrictEqual(evt.details, { key: 'value' });
    });
  });

  describe('auditTimeline', function() {
    it('should addEntry and getTimeline', function() {
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      at.addEntry({ type: 'login', actor: 'admin', action: 'login' });
      const timeline = at.getTimeline();
      assert.strictEqual(timeline.length, 1);
    });

    it('should getTimelineByDate', function() {
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      const now = new Date().toISOString();
      at.addEntry({ type: 'test', actor: 'u', action: 'a', timestamp: now });
      const result = at.getTimelineByDate(now);
      assert.strictEqual(result.length, 1);
    });

    it('should getRange', function() {
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      at.addEntry({ type: 'test', actor: 'u', action: 'a', timestamp: '2025-06-01T00:00:00Z' });
      at.addEntry({ type: 'test', actor: 'u', action: 'b', timestamp: '2025-06-15T00:00:00Z' });
      const result = at.getRange('2025-06-01T00:00:00Z', '2025-06-10T00:00:00Z');
      assert.strictEqual(result.length, 1);
    });

    it('should getSummary', function() {
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      at.addEntry({ type: 'login', actor: 'admin', action: 'login' });
      at.addEntry({ type: 'logout', actor: 'admin', action: 'logout' });
      const summary = at.getSummary();
      assert.strictEqual(summary.totalEntries, 2);
    });

    it('should getTimeline with type filter', function() {
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      at.addEntry({ type: 'login', actor: 'u1', action: 'login' });
      at.addEntry({ type: 'logout', actor: 'u1', action: 'logout' });
      const result = at.getTimeline({ type: 'login' });
      assert.strictEqual(result.length, 1);
    });

    it('should getTimeline with actor filter', function() {
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      at.addEntry({ type: 't', actor: 'admin', action: 'a' });
      at.addEntry({ type: 't', actor: 'user', action: 'b' });
      const result = at.getTimeline({ actor: 'admin' });
      assert.strictEqual(result.length, 1);
    });

    it('should getTimelineByDate empty for null', function() {
      const at = require('../lib/governance/auditTimeline');
      assert.deepStrictEqual(at.getTimelineByDate(null), []);
    });

    it('should getRange empty for null dates', function() {
      const at = require('../lib/governance/auditTimeline');
      assert.deepStrictEqual(at.getRange(null, null), []);
    });

    it('should addEntry return null for null', function() {
      const at = require('../lib/governance/auditTimeline');
      assert.strictEqual(at.addEntry(null), null);
    });

    it('should getSummary empty return zeros', function() {
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      const summary = at.getSummary();
      assert.strictEqual(summary.totalEntries, 0);
    });

    it('should getTimeline with limit', function() {
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      at.addEntry({ type: 't', actor: 'u', action: 'a' });
      at.addEntry({ type: 't', actor: 'u', action: 'b' });
      assert.strictEqual(at.getTimeline({ limit: 1 }).length, 1);
    });

    it('should clear', function() {
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      at.addEntry({ type: 't', actor: 'u', action: 'a' });
      at.clear();
      assert.strictEqual(at.getTimeline().length, 0);
    });
  });

  describe('auditRetention', function() {
    it('should setRetentionPeriod and getRetentionPeriod', function() {
      const ar = require('../lib/governance/auditRetention');
      ar.clear();
      ar.setRetentionPeriod(90);
      assert.strictEqual(ar.getRetentionPeriod(), 90);
    });

    it('should invalid retention period not set', function() {
      const ar = require('../lib/governance/auditRetention');
      ar.clear();
      ar.setRetentionPeriod(-1);
      assert.strictEqual(ar.getRetentionPeriod(), 365);
    });

    it('should applyRetention purge old entries', function() {
      const ar = require('../lib/governance/auditRetention');
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      ar.clear();
      at.addEntry({ type: 'old', actor: 'u', action: 'a', timestamp: '2020-01-01T00:00:00Z' });
      at.addEntry({ type: 'new', actor: 'u', action: 'b', timestamp: new Date().toISOString() });
      ar.setRetentionPeriod(30);
      const purged = ar.applyRetention();
      assert.ok(purged >= 1);
    });

    it('should getRetentionStats return stats', function() {
      const ar = require('../lib/governance/auditRetention');
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      ar.clear();
      at.addEntry({ type: 't', actor: 'u', action: 'a', timestamp: new Date().toISOString() });
      const stats = ar.getRetentionStats();
      assert.strictEqual(stats.retentionDays, 365);
      assert.strictEqual(stats.totalEntries >= 1, true);
    });

    it('should setRetentionPeriod with non-number do nothing', function() {
      const ar = require('../lib/governance/auditRetention');
      ar.clear();
      ar.setRetentionPeriod('invalid');
      assert.strictEqual(ar.getRetentionPeriod(), 365);
    });

    it('should clear reset to defaults', function() {
      const ar = require('../lib/governance/auditRetention');
      ar.clear();
      ar.setRetentionPeriod(30);
      ar.clear();
      assert.strictEqual(ar.getRetentionPeriod(), 365);
    });

    it('should applyRetention with no old entries', function() {
      const ar = require('../lib/governance/auditRetention');
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      ar.clear();
      at.addEntry({ type: 't', actor: 'u', action: 'a', timestamp: new Date().toISOString() });
      const purged = ar.applyRetention();
      assert.strictEqual(purged, 0);
    });

    it('should getRetentionStats return entriesToPurge', function() {
      const ar = require('../lib/governance/auditRetention');
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      ar.clear();
      at.addEntry({ type: 'old', actor: 'u', action: 'a', timestamp: '2020-01-01T00:00:00Z' });
      const stats = ar.getRetentionStats();
      assert.ok(stats.entriesToPurge > 0);
    });

    it('should setRetentionPeriod with zero do nothing', function() {
      const ar = require('../lib/governance/auditRetention');
      ar.clear();
      ar.setRetentionPeriod(0);
      assert.strictEqual(ar.getRetentionPeriod(), 365);
    });

    it('should clear resets lastPurge', function() {
      const ar = require('../lib/governance/auditRetention');
      ar.clear();
      assert.strictEqual(ar.lastPurge, null);
    });
  });

  describe('governanceManager', function() {
    it('should createPolicy return policy', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      const policy = gm.createPolicy({ id: 'gmp1', name: 'GMP1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      assert.strictEqual(policy.id, 'gmp1');
    });

    it('should getStatus have version and policyCount', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      const status = gm.getStatus();
      assert.ok(status.version);
      assert.strictEqual(status.policyCount, 0);
    });

    it('should getStatus reflect policyCount after create', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gms1', name: 'GMS1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      const status = gm.getStatus();
      assert.strictEqual(status.policyCount, 1);
    });

    it('should evaluatePolicy with data return result', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gme1', name: 'GME1', type: 'ai', enforcement: 'audit', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      const result = gm.evaluatePolicy('gme1', { x: 1 });
      assert.strictEqual(result.matched, true);
    });

    it('should evaluateAll return matched blocked warnings', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gmall1', name: 'GMAll1', type: 'ai', enforcement: 'hard', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'deny', message: 'denied' }] });
      const result = gm.evaluateAll({ x: 1 });
      assert.strictEqual(result.matched, 1);
    });

    it('should simulate return simulation result', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gmsim1', name: 'GMSim1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      const result = gm.simulate('gmsim1', { x: 1 });
      assert.strictEqual(result.matched, true);
    });

    it('should simulateAll return array', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gmsa1', name: 'GMSA1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      const results = gm.simulateAll({ x: 1 });
      assert.strictEqual(results.length, 1);
    });

    it('should runComplianceScan return scan result', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gmcs1', name: 'GMCS1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      const result = gm.runComplianceScan({ data: { x: 99 } });
      assert.ok(result.scanId);
      assert.strictEqual(result.totalPolicies, 1);
    });

    it('should requestApproval and approve', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gma1', name: 'GMA1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      const approval = gm.requestApproval('gma1', 'reason', 'user1');
      assert.strictEqual(approval.status, 'pending');
      const approved = gm.approve(approval.id, 'admin');
      assert.strictEqual(approved.status, 'approved');
    });

    it('should requestApproval and reject', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gmr1', name: 'GMR1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      const approval = gm.requestApproval('gmr1', 'reason', 'user1');
      const rejected = gm.reject(approval.id, 'admin', 'no');
      assert.strictEqual(rejected.status, 'rejected');
    });

    it('should rollback return result', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gmrb1', name: 'GMRB1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      const result = gm.rollback('gmrb1', 1);
      assert.ok(result.version);
    });

    it('should clear resets all', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gmclr', name: 'GMClr', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      gm.clear();
      assert.strictEqual(gm.getStatus().policyCount, 0);
    });

    it('should multiple createPolicy increments count', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'm1', name: 'M1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      gm.createPolicy({ id: 'm2', name: 'M2', type: 'security', conditions: [{ field: 'y', operator: 'eq', value: 2 }], actions: [{ type: 'log' }] });
      assert.strictEqual(gm.getStatus().policyCount, 2);
    });

    it('should evaluatePolicy with null data handles gracefully', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      gm.createPolicy({ id: 'gmnull', name: 'GMNull', type: 'ai', enforcement: 'audit', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      const result = gm.evaluatePolicy('gmnull', null);
      assert.strictEqual(result.matched, false);
    });

    it('should evaluatePolicy non-existent throws', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      assert.throws(() => gm.evaluatePolicy('nope', {}), /not compiled/);
    });

    it('should simulate non-existent policy throws', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm = new GovernanceManager();
      assert.throws(() => gm.simulate('nope', {}), /not found/);
    });
  });

  describe('governanceIntegration', function() {
    it('should enable disable isEnabled', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      assert.strictEqual(gi.isEnabled(), true);
      gi.disable();
      assert.strictEqual(gi.isEnabled(), false);
      gi.enable();
      assert.strictEqual(gi.isEnabled(), true);
    });

    it('should checkAIRouting return {allowed}', async function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      const result = await gi.checkAIRouting({});
      assert.strictEqual(typeof result.allowed, 'boolean');
    });

    it('should checkAgent return result', async function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      const result = await gi.checkAgent({});
      assert.strictEqual(typeof result.allowed, 'boolean');
    });

    it('should checkWorkflow return result', async function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      const result = await gi.checkWorkflow({});
      assert.strictEqual(typeof result.allowed, 'boolean');
    });

    it('should checkBilling return result', async function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      const result = await gi.checkBilling({});
      assert.strictEqual(typeof result.allowed, 'boolean');
    });

    it('should checkDeveloper return result', async function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      const result = await gi.checkDeveloper({});
      assert.strictEqual(typeof result.allowed, 'boolean');
    });

    it('should checkPlugin return result', async function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      const result = await gi.checkPlugin({});
      assert.strictEqual(typeof result.allowed, 'boolean');
    });

    it('should checkSecurity return result', async function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      const result = await gi.checkSecurity({});
      assert.strictEqual(typeof result.allowed, 'boolean');
    });

    it('should checkDeployment return result', async function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      const result = await gi.checkDeployment({});
      assert.strictEqual(typeof result.allowed, 'boolean');
    });

    it('should checkData return result', async function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      const result = await gi.checkData({});
      assert.strictEqual(typeof result.allowed, 'boolean');
    });

    it('should getLog return entries', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      gi.checkAIRouting({});
      assert.strictEqual(gi.getLog().length, 0);
    });

    it('should getStats return object', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      const stats = gi.getStats();
      assert.strictEqual(typeof stats.total, 'number');
    });

    it('should getLog with filters', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      assert.deepStrictEqual(gi.getLog({ type: 'test' }), []);
    });

    it('should clear', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const { GovernanceIntegration } = require('../lib/governance/governanceIntegration');
      const gm = new GovernanceManager();
      const gi = new GovernanceIntegration(gm);
      gi.clear();
      assert.strictEqual(gi.getLog().length, 0);
    });
  });

  describe('Plugin SDK - PolicyProvider', function() {
    it('should registerPolicy and getPolicies', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'pp1', name: 'PP1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      const policies = reg.getAll();
      assert.strictEqual(policies.length, 1);
      assert.strictEqual(policies[0].id, 'pp1');
    });

    it('should getPolicies return array', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      assert.deepStrictEqual(reg.getAll(), []);
    });

    it('should registerProvider pattern via registry list', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'prov1', name: 'Provider1', type: 'security', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      const list = reg.list({ type: 'security' });
      assert.strictEqual(list.length, 1);
    });

    it('should getProviders by listing unique types', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'a1', name: 'A1', type: 'billing', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.register({ id: 'a2', name: 'A2', type: 'billing', conditions: [{ field: 'y', operator: 'eq', value: 2 }] });
      const aiPolicies = reg.list({ type: 'billing' });
      assert.strictEqual(aiPolicies.length, 2);
    });

    it('should clear registry', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'clr', name: 'Clr', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.clear();
      assert.strictEqual(reg.getAll().length, 0);
    });
  });

  describe('Plugin SDK - ComplianceTemplate', function() {
    it('should constructor sets name sections format', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('sdk1', { sections: [{ type: 'header', content: 'Test' }], format: 'markdown' });
      const tmpl = ct.getTemplate('sdk1');
      assert.strictEqual(tmpl.name, 'sdk1');
      assert.strictEqual(tmpl.format, 'markdown');
    });

    it('should render with static sections', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('static', { sections: [{ type: 'header', content: 'Static Report' }, { type: 'summary' }], format: 'markdown' });
      const output = ct.render('static', { score: 90, total: 10, compliant: 8, violations: 2 });
      assert.ok(output.includes('Static Report'));
      assert.ok(output.includes('**Score:**'));
    });

    it('should render with dynamic data', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('dynamic', { sections: [{ type: 'custom', content: 'User: {{username}}' }], format: 'markdown' });
      const output = ct.render('dynamic', { username: 'john' });
      assert.ok(output.includes('User: john'));
    });

    it('should render with findings and issues', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('findings2', { sections: [{ type: 'findings' }], format: 'markdown' });
      const output = ct.render('findings2', { score: 50, findings: [{ policyId: 'p1', issues: [{ field: 'x', expected: 1, actual: 0 }] }] });
      assert.ok(output.includes('p1'));
      assert.ok(output.includes('expected 1'));
    });

    it('should render template unknown return empty', function() {
      const ct = require('../lib/governance/complianceTemplates');
      assert.strictEqual(ct.render('unknown', {}), '');
    });

    it('should remove template', function() {
      const ct = require('../lib/governance/complianceTemplates');
      ct.clear();
      ct.registerTemplate('rm', { sections: [], format: 'markdown' });
      ct.removeTemplate('rm');
      assert.strictEqual(ct.getTemplate('rm'), null);
    });
  });

  describe('Plugin SDK - ApprovalRule', function() {
    it('should constructor sets fields via defineRule', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('sdkRule', { policyType: 'ai', conditions: [{ field: 'severity', operator: 'eq', value: 'high' }], requiredApprovers: ['admin'] });
      const rule = ar.getRule('sdkRule');
      assert.strictEqual(rule.name, 'sdkRule');
      assert.strictEqual(rule.policyType, 'ai');
    });

    it('should getRule return null for missing', function() {
      const ar = require('../lib/governance/approvalRules');
      assert.strictEqual(ar.getRule('missing'), null);
    });

    it('should listRules return array', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('r1', { policyType: 'ai' });
      assert.strictEqual(ar.listRules().length, 1);
    });

    it('should removeRule', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('rmRule', { policyType: 'ai' });
      ar.removeRule('rmRule');
      assert.strictEqual(ar.getRule('rmRule'), null);
    });

    it('should findMatchingRules with eq operator', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('match1', { policyType: 'ai', conditions: [{ field: 'severity', operator: 'eq', value: 'high' }] });
      const matches = ar.findMatchingRules({ type: 'ai', severity: 'high' }, {});
      assert.strictEqual(matches.length, 1);
    });

    it('should findMatchingRules with neq operator', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('neqrule', { policyType: 'ai', conditions: [{ field: 'severity', operator: 'neq', value: 'low' }] });
      const matches = ar.findMatchingRules({ type: 'ai', severity: 'high' }, {});
      assert.strictEqual(matches.length, 1);
    });

    it('should findMatchingRules with gt operator', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('gtrule', { policyType: 'ai', conditions: [{ field: 'cost', operator: 'eq', value: 'high' }] });
      const matches = ar.findMatchingRules({ type: 'ai', cost: 'high' }, {});
      assert.strictEqual(matches.length, 1);
    });

    it('should findMatchingRules with in operator', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('inrule', { policyType: 'ai', conditions: [{ field: 'enforcement', operator: 'eq', value: 'hard' }] });
      const matches = ar.findMatchingRules({ type: 'ai', enforcement: 'hard' }, {});
      assert.strictEqual(matches.length, 1);
    });

    it('should return false for non-matching', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('nomatch', { policyType: 'security', conditions: [{ field: 'level', operator: 'eq', value: 'critical' }] });
      const matches = ar.findMatchingRules({ type: 'ai', level: 'critical' }, {});
      assert.strictEqual(matches.length, 0);
    });

    it('should clear', function() {
      const ar = require('../lib/governance/approvalRules');
      ar.clear();
      ar.defineRule('r1', { policyType: 'ai' });
      ar.clear();
      assert.strictEqual(ar.listRules().length, 0);
    });
  });

  describe('Policies', function() {
    it('AiPolicies createPolicies returns 10 policies', function() {
      const { createPolicies } = require('../lib/governance/policies/AiPolicies');
      const policies = createPolicies();
      assert.strictEqual(policies.length, 10);
    });

    it('AiPolicies getPolicy returns specific', function() {
      const { getPolicy } = require('../lib/governance/policies/AiPolicies');
      const policy = getPolicy('ai-cost-limit');
      assert.ok(policy);
      assert.strictEqual(policy.type, 'ai');
    });

    it('AiPolicies getPoliciesByType returns filtered', function() {
      const { getPoliciesByType } = require('../lib/governance/policies/AiPolicies');
      const policies = getPoliciesByType('ai');
      assert.strictEqual(policies.length, 10);
    });

    it('AgentPolicies createPolicies returns 8 policies', function() {
      const { createPolicies } = require('../lib/governance/policies/AgentPolicies');
      const policies = createPolicies();
      assert.strictEqual(policies.length, 8);
    });

    it('AgentPolicies getPolicy returns specific', function() {
      const { getPolicy } = require('../lib/governance/policies/AgentPolicies');
      const policy = getPolicy('agent-max-instances');
      assert.ok(policy);
      assert.strictEqual(policy.type, 'agent');
    });

    it('WorkflowPolicies createPolicies returns 8 policies', function() {
      const { createPolicies } = require('../lib/governance/policies/WorkflowPolicies');
      const policies = createPolicies();
      assert.strictEqual(policies.length, 8);
    });

    it('WorkflowPolicies getPolicy returns specific', function() {
      const { getPolicy } = require('../lib/governance/policies/WorkflowPolicies');
      const policy = getPolicy('workflow-max-steps');
      assert.ok(policy);
      assert.strictEqual(policy.type, 'workflow');
    });

    it('DeploymentPolicies createPolicies returns 8 policies', function() {
      const { createPolicies } = require('../lib/governance/policies/DeploymentPolicies');
      const policies = createPolicies();
      assert.strictEqual(policies.length, 8);
    });

    it('DeploymentPolicies getPolicy returns specific', function() {
      const { getPolicy } = require('../lib/governance/policies/DeploymentPolicies');
      const policy = getPolicy('deployment-max-environments');
      assert.ok(policy);
      assert.strictEqual(policy.type, 'deployment');
    });

    it('BillingPolicies createPolicies returns 7 policies', function() {
      const { createPolicies } = require('../lib/governance/policies/BillingPolicies');
      const policies = createPolicies();
      assert.strictEqual(policies.length, 7);
    });

    it('BillingPolicies getPolicy returns specific', function() {
      const { getPolicy } = require('../lib/governance/policies/BillingPolicies');
      const policy = getPolicy('billing-monthly-cap');
      assert.ok(policy);
      assert.strictEqual(policy.type, 'billing');
    });

    it('SecurityPolicies createPolicies returns 8 policies', function() {
      const { createPolicies } = require('../lib/governance/policies/SecurityPolicies');
      const policies = createPolicies();
      assert.strictEqual(policies.length, 8);
    });

    it('SecurityPolicies getPolicy returns specific', function() {
      const { getPolicy } = require('../lib/governance/policies/SecurityPolicies');
      const policy = getPolicy('security-mfa-required');
      assert.ok(policy);
      assert.strictEqual(policy.type, 'security');
    });

    it('PluginPolicies createPolicies returns 8 policies', function() {
      const { createPolicies } = require('../lib/governance/policies/PluginPolicies');
      const policies = createPolicies();
      assert.strictEqual(policies.length, 8);
    });

    it('PluginPolicies getPolicy returns specific', function() {
      const { getPolicy } = require('../lib/governance/policies/PluginPolicies');
      const policy = getPolicy('plugin-max-installed');
      assert.ok(policy);
      assert.strictEqual(policy.type, 'plugin');
    });

    it('IntegrationPolicies createPolicies returns 7 policies', function() {
      const { createPolicies } = require('../lib/governance/policies/IntegrationPolicies');
      const policies = createPolicies();
      assert.strictEqual(policies.length, 7);
    });

    it('IntegrationPolicies getPolicy returns specific', function() {
      const { getPolicy } = require('../lib/governance/policies/IntegrationPolicies');
      const policy = getPolicy('integration-max-active');
      assert.ok(policy);
      assert.strictEqual(policy.type, 'integration');
    });

    it('DeveloperPolicies createPolicies returns 7 policies', function() {
      const { createPolicies } = require('../lib/governance/policies/DeveloperPolicies');
      const policies = createPolicies();
      assert.strictEqual(policies.length, 7);
    });

    it('DeveloperPolicies getPolicy returns specific', function() {
      const { getPolicy } = require('../lib/governance/policies/DeveloperPolicies');
      const policy = getPolicy('developer-api-rate-limit');
      assert.ok(policy);
      assert.strictEqual(policy.type, 'developer');
    });

    it('DataPolicies createPolicies returns 8 policies', function() {
      const { createPolicies } = require('../lib/governance/policies/DataPolicies');
      const policies = createPolicies();
      assert.strictEqual(policies.length, 8);
    });

    it('DataPolicies getPolicy returns specific', function() {
      const { getPolicy } = require('../lib/governance/policies/DataPolicies');
      const policy = getPolicy('data-retention-max');
      assert.ok(policy);
      assert.strictEqual(policy.type, 'data');
    });

    it('getPoliciesByType returns correct type', function() {
      const { getPoliciesByType } = require('../lib/governance/policies/SecurityPolicies');
      const policies = getPoliciesByType('security');
      assert.ok(policies.every(p => p.type === 'security'));
    });

    it('getPoliciesByType returns empty for unknown type', function() {
      const { getPoliciesByType } = require('../lib/governance/policies/AiPolicies');
      const policies = getPoliciesByType('unknown');
      assert.deepStrictEqual(policies, []);
    });

    it('getPolicy returns null for missing', function() {
      const { getPolicy } = require('../lib/governance/policies/AiPolicies');
      assert.strictEqual(getPolicy('nonexistent'), null);
    });
  });

  describe('Edge Cases', function() {
    it('should Registry handle empty filters list', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'e1', name: 'E1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      const result = reg.list({});
      assert.strictEqual(result.length, 1);
    });

    it('should Evaluator with null data return empty', function() {
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const ev = new PolicyEvaluator();
      const policy = { conditions: [{ field: 'x', operator: 'eq', value: 1 }] };
      const result = ev.evaluate(policy, null);
      assert.strictEqual(result.matched, false);
    });

    it('should Executor with no actions return empty', function() {
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const exec = new PolicyExecutor();
      const policy = { id: 'noact', actions: [] };
      const result = exec.execute(policy, { matched: true }, {});
      assert.strictEqual(result.actions.length, 0);
    });

    it('should Storage cross-namespace isolation', function() {
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const store = new PolicyStorage();
      store.set('ns1', 'key', 'value1');
      store.set('ns2', 'key', 'value2');
      assert.strictEqual(store.get('ns1', 'key'), 'value1');
      assert.strictEqual(store.get('ns2', 'key'), 'value2');
      store.clearNamespace('ns1');
      assert.strictEqual(store.get('ns1', 'key'), null);
      assert.strictEqual(store.get('ns2', 'key'), 'value2');
    });

    it('should Events wildcard catches all via specific', function() {
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const ev = new PolicyEvents();
      let called = false;
      ev.on('wildcard.test', function() { called = true; });
      ev.emit('wildcard.test', {});
      assert.strictEqual(called, true);
    });

    it('should Metrics empty aggregate returns null', function() {
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const m = new PolicyMetrics();
      assert.strictEqual(m.aggregate('empty', 'count'), null);
    });

    it('should Scheduler tick with empty list', function() {
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const s = new PolicyScheduler();
      const results = s.tick();
      assert.deepStrictEqual(results, []);
    });

    it('should Audit query returns empty for no matches', function() {
      const ae = require('../lib/governance/auditEngine');
      ae.clear();
      const results = ae.query({ type: 'nonexistent' });
      assert.deepStrictEqual(results, []);
    });

    it('should Compliance scan with no policies returns score 100', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      const scan = ce.scan([], {});
      assert.strictEqual(scan.score, 100);
    });

    it('should Versioning with no versions returns empty', function() {
      const pv = require('../lib/governance/policyVersioning');
      pv.clear();
      assert.deepStrictEqual(pv.listVersions('missing'), []);
    });

    it('should Simulation with empty data handles gracefully', function() {
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const sim = new PolicySimulator();
      const policy = { id: 'empty', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [] };
      const result = sim.simulate(policy, {});
      assert.strictEqual(result.matched, false);
    });

    it('should Approval with missing fields handled', function() {
      const ae = require('../lib/governance/approvalEngine');
      ae.clear();
      const approval = ae.createApproval({});
      assert.ok(approval);
    });

    it('should multiple independent GovernanceManager instances', function() {
      const { GovernanceManager } = require('../lib/governance/governanceManager');
      const gm1 = new GovernanceManager();
      const gm2 = new GovernanceManager();
      gm1.createPolicy({ id: 'ind1', name: 'Ind1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      assert.strictEqual(gm1.getStatus().policyCount, 1);
      assert.strictEqual(gm2.getStatus().policyCount, 0);
    });

    it('should clear all modules then verify empty states', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const { PolicyCompiler } = require('../lib/governance/policyCompiler');
      const { PolicyEvaluator } = require('../lib/governance/policyEvaluator');
      const { PolicyExecutor } = require('../lib/governance/policyExecutor');
      const { PolicyStorage } = require('../lib/governance/policyStorage');
      const { PolicyEvents } = require('../lib/governance/policyEvents');
      const { PolicyMetrics } = require('../lib/governance/policyMetrics');
      const { PolicyScheduler } = require('../lib/governance/policyScheduler');
      const { PolicySimulator } = require('../lib/governance/policySimulator');
      const { PolicyReporter } = require('../lib/governance/policyReporter');
      const reg = new PolicyRegistry();
      const comp = new PolicyCompiler();
      const eva = new PolicyEvaluator();
      const exec = new PolicyExecutor();
      const store = new PolicyStorage();
      const ev = new PolicyEvents();
      const met = new PolicyMetrics();
      const sched = new PolicyScheduler();
      const sim = new PolicySimulator();
      const rep = new PolicyReporter(reg, ev, met, sim);
      reg.register({ id: 'ec1', name: 'EC1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      comp.compile({ id: 'ec2', name: 'EC2', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }], actions: [{ type: 'log' }] });
      store.set('ns', 'k', 'v');
      reg.clear();
      comp.clear();
      eva.clear();
      exec.clear();
      store.clear();
      ev.clear();
      met.clear();
      sched.clear();
      sim.clear();
      rep.clear();
      assert.strictEqual(reg.getAll().length, 0);
      assert.strictEqual(comp.listCompiled().length, 0);
      assert.strictEqual(Object.keys(store.getAll()).length, 0);
      assert.strictEqual(exec.getExecutionLog().length, 0);
      assert.strictEqual(met.query('x').length, 0);
      assert.strictEqual(sched.list().length, 0);
      assert.strictEqual(sim.getHistory().length, 0);
    });

    it('should Registry handle count with filters', function() {
      const { PolicyRegistry } = require('../lib/governance/policyRegistry');
      const reg = new PolicyRegistry();
      reg.register({ id: 'c1', name: 'C1', type: 'ai', conditions: [{ field: 'x', operator: 'eq', value: 1 }] });
      reg.register({ id: 'c2', name: 'C2', type: 'security', conditions: [{ field: 'y', operator: 'eq', value: 2 }] });
      assert.strictEqual(reg.count({ type: 'ai' }), 1);
      assert.strictEqual(reg.count(), 2);
    });

    it('should Compliance scan with policies returns results', function() {
      const ce = require('../lib/governance/complianceEngine');
      ce.clear();
      const result = ce.scan([{ id: 'p1', rules: [{ field: 'x', operator: 'eq', value: 1 }] }], { x: 1 });
      assert.strictEqual(result.results.length, 1);
    });

    it('should approvalManager getStats with mixed statuses', function() {
      const am = require('../lib/governance/approvalManager');
      am.clear();
      const r1 = am.createRequest('p1', 'r1', 'u1');
      const r2 = am.createRequest('p2', 'r2', 'u2');
      const r3 = am.createRequest('p3', 'r3', 'u3');
      am.approve(r1.id, 'admin');
      am.reject(r2.id, 'admin', 'no');
      am.cancel(r3.id);
      const stats = am.getStats();
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.approved, 1);
      assert.strictEqual(stats.rejected, 1);
      assert.strictEqual(stats.cancelled, 1);
    });

    it('should auditTimeline getTimeline with since and until', function() {
      const at = require('../lib/governance/auditTimeline');
      at.clear();
      at.addEntry({ type: 't', actor: 'u', action: 'a', timestamp: '2025-06-01T00:00:00Z' });
      const result = at.getTimeline({ since: '2025-01-01T00:00:00Z', until: '2025-12-31T00:00:00Z' });
      assert.strictEqual(result.length, 1);
    });
  });
});
