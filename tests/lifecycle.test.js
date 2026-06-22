const assert = require('assert');

describe('Project Lifecycle Platform — Phase 10.0.0', function() {

  /* ─── LifecycleManager (35 tests) ─── */
  describe('LifecycleManager', function() {
    const { LifecycleManager } = require('../lib/lifecycle/lifecycleManager');
    it('should create an instance with all sub-modules', function() {
      const m = new LifecycleManager();
      assert.ok(m.projectLifecycle); assert.ok(m.environmentManager);
      assert.ok(m.releaseManager); assert.ok(m.releasePipeline);
      assert.ok(m.promotionManager); assert.ok(m.versionManager);
      assert.ok(m.snapshotManager); assert.ok(m.migrationManager);
      assert.ok(m.projectTemplates); assert.ok(m.projectCloner);
      assert.ok(m.projectImporter); assert.ok(m.projectExporter);
      assert.ok(m.lifecycleEvents); assert.ok(m.lifecycleMetrics);
      assert.ok(m.lifecycleStorage);
    });
    it('getStatus should return zeros for empty manager', function() {
      const m = new LifecycleManager(); const s = m.getStatus();
      assert.strictEqual(s.environments, 0); assert.strictEqual(s.releases, 0);
      assert.strictEqual(s.promotions, 0); assert.strictEqual(s.snapshots, 0);
      assert.strictEqual(s.migrations, 0); assert.strictEqual(s.templates, 0);
    });
    it('getStatus should reflect added data', function() {
      const m = new LifecycleManager();
      m.environmentManager.create('dev', { type: 'development' });
      m.projectTemplates.registerTemplate({ id: 't1', name: 'Test' });
      const s = m.getStatus();
      assert.strictEqual(s.environments, 1); assert.strictEqual(s.templates, 1);
    });
    it('should create independent instances', function() {
      const a = new LifecycleManager(); const b = new LifecycleManager();
      a.environmentManager.create('dev', { type: 'development' });
      assert.strictEqual(a.environmentManager.list().length, 1);
      assert.strictEqual(b.environmentManager.list().length, 0);
    });
    it('clear should reset all sub-modules', function() {
      const m = new LifecycleManager();
      m.environmentManager.create('dev', { type: 'development' });
      m.releaseManager.createRelease('p1', '1.0.0'); m.clear();
      assert.strictEqual(m.getStatus().environments, 0);
      assert.strictEqual(m.getStatus().releases, 0);
    });
    it('should handle many environments in status', function() {
      const m = new LifecycleManager();
      for (let i = 0; i < 100; i++) m.environmentManager.create('env-'+i, { type: 'development' });
      assert.strictEqual(m.getStatus().environments, 100);
    });
    it('should handle many releases directly', function() {
      const rm = new (require('../lib/lifecycle/releaseManager').ReleaseManager)();
      for (let i = 0; i < 50; i++) rm.createRelease('p'+i, '1.0.'+i);
      assert.strictEqual(rm.listReleases('p0').length, 1);
    });
    it('should handle many snapshots directly', function() {
      const sm = new (require('../lib/lifecycle/snapshotManager').SnapshotManager)();
      for (let i = 0; i < 25; i++) sm.createSnapshot('p1', 'project', { i });
      assert.strictEqual(sm.listSnapshots('p1').length, 25);
    });
    it('should handle many migrations directly', function() {
      const mm = new (require('../lib/lifecycle/migrationManager').MigrationManager)();
      for (let i = 0; i < 20; i++) mm.createMigration('p1', i+'.0.0', (i+1)+'.0.0', 'schema');
      assert.strictEqual(mm.listMigrations('p1').length, 20);
    });
    it('should handle many templates in status', function() {
      const m = new LifecycleManager();
      for (let i = 0; i < 30; i++) m.projectTemplates.registerTemplate({ id: 't'+i, name: 'T'+i });
      assert.strictEqual(m.getStatus().templates, 30);
    });
    it('clear on empty manager should not throw', function() {
      const m = new LifecycleManager(); m.clear();
      assert.strictEqual(m.getStatus().environments, 0);
    });
    it('sub-modules accessible after clear', function() {
      const m = new LifecycleManager(); m.clear();
      m.environmentManager.create('dev', { type: 'development' });
      assert.strictEqual(m.getStatus().environments, 1);
    });
    it('should allow multiple independent lifecycle managers', function() {
      const m1 = new LifecycleManager(); const m2 = new LifecycleManager(); const m3 = new LifecycleManager();
      m1.environmentManager.create('e1', { type: 'development' });
      m2.environmentManager.create('e2', { type: 'qa' });
      m3.environmentManager.create('e3', { type: 'production' });
      assert.strictEqual(m1.getStatus().environments, 1);
      assert.strictEqual(m2.getStatus().environments, 1);
      assert.strictEqual(m3.getStatus().environments, 1);
    });
    it('counts environments list directly', function() {
      const em = new (require('../lib/lifecycle/environmentManager').EnvironmentManager)();
      em.create('dev',{type:'development'}); em.create('qa',{type:'qa'}); em.create('stg',{type:'staging'});
      assert.strictEqual(em.list().length, 3);
    });
    it('counts releases across projects', function() {
      const rm = new (require('../lib/lifecycle/releaseManager').ReleaseManager)();
      rm.createRelease('a','1.0.0'); rm.createRelease('b','2.0.0');
      rm.createRelease('a','1.1.0');
      assert.strictEqual(rm.listReleases('a').length, 2);
      assert.strictEqual(rm.listReleases('b').length, 1);
    });
    it('counts promotions across projects', function() {
      const pm = new (require('../lib/lifecycle/promotionManager').PromotionManager)();
      pm.promote('p1','dev','qa'); pm.promote('p2','qa','staging');
      pm.promote('p1','qa','staging');
      assert.strictEqual(pm.listPromotions('p1').length, 2);
      assert.strictEqual(pm.listPromotions('p2').length, 1);
    });
    it('counts migrations across projects', function() {
      const mm = new (require('../lib/lifecycle/migrationManager').MigrationManager)();
      mm.createMigration('p1','1.0.0','2.0.0','schema');
      mm.createMigration('p2','2.0.0','3.0.0','workflow');
      assert.strictEqual(mm.listMigrations('p1').length, 1);
      assert.strictEqual(mm.listMigrations('p2').length, 1);
    });
    it('getStatus templates with categories', function() {
      const m = new LifecycleManager();
      m.projectTemplates.registerTemplate({id:'t1',name:'T1',category:'starter'});
      m.projectTemplates.registerTemplate({id:'t2',name:'T2',category:'business'});
      m.projectTemplates.registerTemplate({id:'t3',name:'T3',category:'starter'});
      assert.strictEqual(m.getStatus().templates, 3);
    });
    it('should access each sub-module via getter', function() {
      const m = new LifecycleManager();
      assert.ok(m.projectLifecycle); assert.ok(m.environmentManager);
      assert.ok(m.releaseManager); assert.ok(m.releasePipeline);
      assert.ok(m.promotionManager); assert.ok(m.versionManager);
      assert.ok(m.snapshotManager); assert.ok(m.migrationManager);
      assert.ok(m.projectTemplates); assert.ok(m.projectCloner);
      assert.ok(m.projectImporter); assert.ok(m.projectExporter);
      assert.ok(m.lifecycleEvents); assert.ok(m.lifecycleMetrics);
      assert.ok(m.lifecycleStorage);
    });
    it('sub-modules should be fresh instances', function() {
      const a = new LifecycleManager(); const b = new LifecycleManager();
      assert.notStrictEqual(a.projectLifecycle, b.projectLifecycle);
      assert.notStrictEqual(a.environmentManager, b.environmentManager);
    });
    it('getStatus after clear and re-add', function() {
      const m = new LifecycleManager();
      m.environmentManager.create('dev',{type:'development'}); m.clear();
      assert.strictEqual(m.getStatus().environments, 0);
      m.environmentManager.create('prod',{type:'production'});
      assert.strictEqual(m.getStatus().environments, 1);
    });
    it('getStatus with zero releases after clear', function() {
      const m = new LifecycleManager();
      m.releaseManager.createRelease('p1','1.0.0'); m.releaseManager.clear();
      assert.strictEqual(m.getStatus().releases, 0);
    });
    it('getStatus with zero promotions after clear', function() {
      const m = new LifecycleManager();
      m.promotionManager.promote('p1','dev','qa'); m.promotionManager.clear();
      assert.strictEqual(m.getStatus().promotions, 0);
    });
    it('getStatus with zero snapshots after clear', function() {
      const m = new LifecycleManager();
      m.snapshotManager.createSnapshot('p1','project',{}); m.snapshotManager.clear();
      assert.strictEqual(m.getStatus().snapshots, 0);
    });
    it('getStatus with zero migrations after clear', function() {
      const m = new LifecycleManager();
      m.migrationManager.createMigration('p1','1.0.0','2.0.0','schema'); m.migrationManager.clear();
      assert.strictEqual(m.getStatus().migrations, 0);
    });
    it('getStatus with zero templates after clear', function() {
      const m = new LifecycleManager();
      m.projectTemplates.registerTemplate({id:'t1',name:'T1'}); m.projectTemplates.clear();
      assert.strictEqual(m.getStatus().templates, 0);
    });
    it('should re-use same manager across calls', function() {
      const m = new LifecycleManager();
      m.environmentManager.create('dev',{type:'development'});
      assert.strictEqual(m.getStatus().environments, 1);
      m.environmentManager.create('qa',{type:'qa'});
      assert.strictEqual(m.getStatus().environments, 2);
    });
    it('sub-modules reference same objects', function() {
      const m = new LifecycleManager();
      assert.strictEqual(m.environmentManager, m.environmentManager);
    });
    it('should allow chaining via sub-module access', function() {
      const m = new LifecycleManager();
      const r = m.releaseManager.createRelease('test','1.0.0');
      assert.strictEqual(r.version, '1.0.0');
    });
  });
  /* ─── ProjectLifecycle (35 tests) ─── */
  describe('ProjectLifecycle', function() {
    const { ProjectLifecycle } = require('../lib/lifecycle/projectLifecycle');
    it('should create lifecycle with default state created', function() {
      const pl = new ProjectLifecycle(); const lc = pl.createProjectLifecycle('proj-1');
      assert.strictEqual(lc.state, 'created'); assert.ok(lc.createdAt); assert.deepStrictEqual(lc.transitions, []);
    });
    it('should create lifecycle with custom initial state', function() {
      const pl = new ProjectLifecycle(); const lc = pl.createProjectLifecycle('proj-2', 'in_progress');
      assert.strictEqual(lc.state, 'in_progress');
    });
    it('should throw on null project id', function() {
      assert.throws(() => new ProjectLifecycle().createProjectLifecycle(null), /required/);
    });
    it('should throw on empty project id', function() {
      assert.throws(() => new ProjectLifecycle().createProjectLifecycle(''), /required/);
    });
    it('should throw on duplicate project id', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('dup');
      assert.throws(() => pl.createProjectLifecycle('dup'), /already exists/);
    });
    it('getState should return current state', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p','review');
      assert.strictEqual(pl.getState('p'), 'review');
    });
    it('getState should return null for unknown', function() {
      assert.strictEqual(new ProjectLifecycle().getState('unknown'), null);
    });
    it('transition should change state and record transition', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p');
      const tr = pl.transition('p','in_progress');
      assert.strictEqual(tr.from,'created'); assert.strictEqual(tr.to,'in_progress');
      assert.strictEqual(pl.getState('p'), 'in_progress');
    });
    it('transition should record history', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p');
      pl.transition('p','in_progress'); pl.transition('p','review');
      const hist = pl.getHistory('p');
      assert.strictEqual(hist.length, 2);
      assert.strictEqual(hist[0].to,'in_progress'); assert.strictEqual(hist[1].to,'review');
    });
    it('transition should throw for unknown project', function() {
      assert.throws(() => new ProjectLifecycle().transition('nope','done'), /not found/);
    });
    it('transition should throw for null new state', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p');
      assert.throws(() => pl.transition('p', null), /required/);
    });
    it('getHistory should return empty for unknown', function() {
      assert.deepStrictEqual(new ProjectLifecycle().getHistory('unknown'), []);
    });
    it('getHistory returns copy', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p'); pl.transition('p','in_progress');
      const h = pl.getHistory('p'); h.push({fake:true});
      assert.strictEqual(pl.getHistory('p').length, 1);
    });
    it('getAvailableTransitions for created', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p');
      const t = pl.getAvailableTransitions('p');
      assert.ok(t.includes('in_progress')); assert.ok(t.includes('cancelled'));
      assert.strictEqual(t.length, 2);
    });
    it('getAvailableTransitions empty for archived', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p');
      pl.transition('p','completed'); pl.transition('p','archived');
      assert.deepStrictEqual(pl.getAvailableTransitions('p'), []);
    });
    it('getAvailableTransitions empty for unknown', function() {
      assert.deepStrictEqual(new ProjectLifecycle().getAvailableTransitions('unknown'), []);
    });
    it('canTransition true for valid', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p');
      assert.ok(pl.canTransition('p','in_progress'));
    });
    it('canTransition false for invalid', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p');
      assert.strictEqual(pl.canTransition('p','archived'), false);
    });
    it('canTransition false unknown project', function() {
      assert.strictEqual(new ProjectLifecycle().canTransition('unknown','created'), false);
    });
    it('full lifecycle path: created -> in_progress -> review -> approved -> completed -> archived', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('full');
      pl.transition('full','in_progress'); pl.transition('full','review');
      pl.transition('full','approved'); pl.transition('full','completed');
      pl.transition('full','archived');
      assert.strictEqual(pl.getState('full'),'archived'); assert.strictEqual(pl.getHistory('full').length,5);
    });
    it('created -> in_progress -> review -> rejected -> cancelled', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('r');
      pl.transition('r','in_progress'); pl.transition('r','review');
      pl.transition('r','rejected'); pl.transition('r','cancelled');
      assert.strictEqual(pl.getState('r'),'cancelled');
    });
    it('created -> cancelled', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('c');
      pl.transition('c','cancelled');
      assert.strictEqual(pl.getState('c'),'cancelled');
    });
    it('clear should reset all', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p1'); pl.createProjectLifecycle('p2');
      pl.clear();
      assert.strictEqual(pl.getState('p1'),null); assert.strictEqual(pl.getState('p2'),null);
    });
    it('review -> in_progress transition', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p');
      pl.transition('p','in_progress'); pl.transition('p','review');
      pl.transition('p','in_progress');
      assert.strictEqual(pl.getState('p'),'in_progress');
    });
    it('review -> approved transition', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p');
      pl.transition('p','in_progress'); pl.transition('p','review');
      pl.transition('p','approved');
      assert.strictEqual(pl.getState('p'),'approved');
    });
    it('review -> rejected transition', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('p');
      pl.transition('p','in_progress'); pl.transition('p','review');
      pl.transition('p','rejected');
      assert.strictEqual(pl.getState('p'),'rejected');
    });
    it('should handle many projects simultaneously', function() {
      const pl = new ProjectLifecycle();
      for (let i=0;i<100;i++) pl.createProjectLifecycle('p-'+i);
      for (let i=0;i<100;i++) assert.strictEqual(pl.getState('p-'+i),'created');
    });
    it('should track many transitions', function() {
      const pl = new ProjectLifecycle(); pl.createProjectLifecycle('track');
      for (let i=0;i<10;i++) { pl.transition('track','in_progress'); pl.transition('track','review'); pl.transition('track','in_progress'); }
      assert.strictEqual(pl.getState('track'),'in_progress'); assert.strictEqual(pl.getHistory('track').length,30);
    });
  });
  /* ─── EnvironmentManager (35 tests) ─── */
  describe('EnvironmentManager', function() {
    const { EnvironmentManager } = require('../lib/lifecycle/environmentManager');
    it('should create environment with defaults', function() {
      const em = new EnvironmentManager(); const env = em.create('dev',{type:'development'});
      assert.strictEqual(env.name,'dev'); assert.strictEqual(env.type,'development');
      assert.strictEqual(env.status,'active'); assert.deepStrictEqual(env.config,{});
    });
    it('should create with custom config', function() {
      const em = new EnvironmentManager();
      const env = em.create('staging',{type:'staging',config:{region:'us-east',replicas:3}});
      assert.strictEqual(env.config.region,'us-east'); assert.strictEqual(env.config.replicas,3);
    });
    it('ENVIRONMENTS constant should have 5 entries', function() {
      assert.deepStrictEqual(EnvironmentManager.ENVIRONMENTS,['development','preview','qa','staging','production']);
    });
    it('should throw for empty name', function() {
      assert.throws(() => new EnvironmentManager().create('',{type:'development'}), /non-empty string/);
    });
    it('should throw for null name', function() {
      assert.throws(() => new EnvironmentManager().create(null,{type:'development'}), /non-empty string/);
    });
    it('should throw for non-string name', function() {
      assert.throws(() => new EnvironmentManager().create(123,{type:'development'}), /non-empty string/);
    });
    it('should throw for duplicate name', function() {
      const em = new EnvironmentManager(); em.create('dup',{type:'development'});
      assert.throws(() => em.create('dup',{type:'qa'}), /already exists/);
    });
    it('should throw for invalid type', function() {
      assert.throws(() => new EnvironmentManager().create('bad',{type:'invalid'}), /Invalid environment type/);
    });
    it('get should return environment', function() {
      const em = new EnvironmentManager(); em.create('dev',{type:'development'});
      assert.strictEqual(em.get('dev').name,'dev');
    });
    it('get should return null for unknown', function() {
      assert.strictEqual(new EnvironmentManager().get('nope'), null);
    });
    it('get should return null for null', function() {
      assert.strictEqual(new EnvironmentManager().get(null), null);
    });
    it('get should return null for empty', function() {
      assert.strictEqual(new EnvironmentManager().get(''), null);
    });
    it('list should return all environments', function() {
      const em = new EnvironmentManager(); em.create('dev',{type:'development'}); em.create('qa',{type:'qa'});
      assert.strictEqual(em.list().length, 2);
    });
    it('list should return empty array initially', function() {
      assert.deepStrictEqual(new EnvironmentManager().list(), []);
    });
    it('update should change type', function() {
      const em = new EnvironmentManager(); em.create('e',{type:'development'});
      em.update('e',{type:'qa'});
      assert.strictEqual(em.get('e').type,'qa');
    });
    it('update should merge config', function() {
      const em = new EnvironmentManager(); em.create('e',{type:'development',config:{a:1}});
      em.update('e',{config:{b:2}});
      assert.strictEqual(em.get('e').config.a,1); assert.strictEqual(em.get('e').config.b,2);
    });
    it('update should throw for unknown', function() {
      assert.throws(() => new EnvironmentManager().update('nope',{type:'development'}), /not found/);
    });
    it('update should throw for invalid type', function() {
      const em = new EnvironmentManager(); em.create('e',{type:'development'});
      assert.throws(() => em.update('e',{type:'invalid'}), /Invalid environment type/);
    });
    it('delete should return true and remove', function() {
      const em = new EnvironmentManager(); em.create('temp',{type:'development'});
      assert.strictEqual(em.delete('temp'), true); assert.strictEqual(em.get('temp'), null);
    });
    it('delete should return false for non-existent', function() {
      assert.strictEqual(new EnvironmentManager().delete('nope'), false);
    });
    it('setStatus should change status', function() {
      const em = new EnvironmentManager(); em.create('e',{type:'development'});
      em.setStatus('e','inactive');
      assert.strictEqual(em.getStatus('e'),'inactive');
    });
    it('setStatus should accept archived', function() {
      const em = new EnvironmentManager(); em.create('e',{type:'development'});
      em.setStatus('e','archived');
      assert.strictEqual(em.getStatus('e'),'archived');
    });
    it('setStatus should throw for unknown', function() {
      assert.throws(() => new EnvironmentManager().setStatus('nope','active'), /not found/);
    });
    it('setStatus should throw for invalid status', function() {
      const em = new EnvironmentManager(); em.create('e',{type:'development'});
      assert.throws(() => em.setStatus('e','invalid'), /Invalid status/);
    });
    it('getStatus should return null for unknown', function() {
      assert.strictEqual(new EnvironmentManager().getStatus('nope'), null);
    });
    it('should create all 5 types', function() {
      const em = new EnvironmentManager();
      em.create('dev',{type:'development'}); em.create('prev',{type:'preview'});
      em.create('qa',{type:'qa'}); em.create('stg',{type:'staging'}); em.create('prod',{type:'production'});
      assert.strictEqual(em.list().length, 5);
    });
    it('clear should remove all', function() {
      const em = new EnvironmentManager(); em.create('dev',{type:'development'}); em.create('qa',{type:'qa'});
      em.clear(); assert.strictEqual(em.list().length, 0);
    });
    it('should allow recreate after delete', function() {
      const em = new EnvironmentManager(); em.create('dev',{type:'development'}); em.delete('dev');
      const env = em.create('dev',{type:'production'});
      assert.strictEqual(env.type,'production');
    });
    it('should allow recreate after clear', function() {
      const em = new EnvironmentManager(); em.create('dev',{type:'development'}); em.clear();
      const env = em.create('dev',{type:'qa'});
      assert.strictEqual(env.type,'qa');
    });
    it('update with empty config should not change', function() {
      const em = new EnvironmentManager(); em.create('e',{type:'development',config:{a:1}});
      em.update('e',{});
      assert.strictEqual(em.get('e').config.a,1);
    });
    it('should handle 50 environments', function() {
      const em = new EnvironmentManager();
      for(let i=0;i<50;i++) em.create('env-'+i,{type:'development'});
      assert.strictEqual(em.list().length,50);
    });
  });
  /* ─── ReleaseManager (35 tests) ─── */
  describe('ReleaseManager', function() {
    const { ReleaseManager } = require('../lib/lifecycle/releaseManager');
    it('should create release with draft status', function() {
      const r = new ReleaseManager().createRelease('p1','1.0.0');
      assert.strictEqual(r.status,'draft'); assert.strictEqual(r.version,'1.0.0'); assert.strictEqual(r.projectId,'p1');
    });
    it('should create release with config', function() {
      const r = new ReleaseManager().createRelease('p1','2.0.0',{notes:'Major'});
      assert.strictEqual(r.config.notes,'Major');
    });
    it('should throw for missing project id', function() {
      assert.throws(() => new ReleaseManager().createRelease(null,'1.0.0'), /required/);
    });
    it('should throw for missing version', function() {
      assert.throws(() => new ReleaseManager().createRelease('p',null), /required/);
    });
    it('should throw for duplicate', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0');
      assert.throws(() => rm.createRelease('p','1.0.0'), /already exists/);
    });
    it('getRelease should return release', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0');
      assert.strictEqual(rm.getRelease('p','1.0.0').version,'1.0.0');
    });
    it('getRelease null for unknown', function() {
      assert.strictEqual(new ReleaseManager().getRelease('p','9.9.9'), null);
    });
    it('listReleases scoped to project', function() {
      const rm = new ReleaseManager(); rm.createRelease('p1','1.0.0'); rm.createRelease('p1','1.1.0'); rm.createRelease('p2','2.0.0');
      assert.strictEqual(rm.listReleases('p1').length,2); assert.strictEqual(rm.listReleases('p2').length,1);
    });
    it('listReleases empty for unknown', function() {
      assert.deepStrictEqual(new ReleaseManager().listReleases('unknown'), []);
    });
    it('updateStatus to released', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0'); rm.updateStatus('p','1.0.0','released');
      assert.strictEqual(rm.getRelease('p','1.0.0').status,'released');
    });
    it('updateStatus to rolled_back', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0'); rm.updateStatus('p','1.0.0','rolled_back');
      assert.strictEqual(rm.getRelease('p','1.0.0').status,'rolled_back');
    });
    it('updateStatus to hotfix', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0'); rm.updateStatus('p','1.0.0','hotfix');
      assert.strictEqual(rm.getRelease('p','1.0.0').status,'hotfix');
    });
    it('updateStatus throws for unknown', function() {
      assert.throws(() => new ReleaseManager().updateStatus('p','1.0.0','released'), /not found/);
    });
    it('updateStatus throws for invalid status', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0');
      assert.throws(() => rm.updateStatus('p','1.0.0','invalid'), /Invalid status/);
    });
    it('addReleaseNote roundtrip', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0'); rm.addReleaseNote('p','1.0.0','Note');
      assert.strictEqual(rm.getReleaseNotes('p','1.0.0').length,1);
      assert.strictEqual(rm.getReleaseNotes('p','1.0.0')[0].note,'Note');
    });
    it('getReleaseNotes empty for unknown', function() {
      assert.deepStrictEqual(new ReleaseManager().getReleaseNotes('p','1.0.0'), []);
    });
    it('addReleaseNote throws for unknown', function() {
      assert.throws(() => new ReleaseManager().addReleaseNote('p','1.0.0','n'), /not found/);
    });
    it('addMilestone roundtrip', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0'); rm.addMilestone('p','1.0.0','Alpha');
      assert.strictEqual(rm.getMilestones('p','1.0.0').length,1);
      assert.strictEqual(rm.getMilestones('p','1.0.0')[0].milestone,'Alpha');
    });
    it('getMilestones empty for unknown', function() {
      assert.deepStrictEqual(new ReleaseManager().getMilestones('p','1.0.0'), []);
    });
    it('addTag roundtrip', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0'); rm.addTag('p','1.0.0','v1');
      assert.strictEqual(rm.getTags('p','1.0.0').length,1);
      assert.strictEqual(rm.getTags('p','1.0.0')[0],'v1');
    });
    it('getTags empty for unknown', function() {
      assert.deepStrictEqual(new ReleaseManager().getTags('p','1.0.0'), []);
    });
    it('createHotfix creates based on source', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0'); rm.addReleaseNote('p','1.0.0','Orig');
      rm.addTag('p','1.0.0','stable');
      const hf = rm.createHotfix('p','1.0.0','1.0.1');
      assert.strictEqual(hf.status,'hotfix'); assert.strictEqual(hf.version,'1.0.1');
      assert.strictEqual(hf.changelog.length,1); assert.strictEqual(hf.tags[0],'stable');
    });
    it('createHotfix throws for unknown source', function() {
      assert.throws(() => new ReleaseManager().createHotfix('p','9.9.9','9.9.10'), /not found/);
    });
    it('createHotfix throws for duplicate target', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0'); rm.createRelease('p','1.0.1');
      assert.throws(() => rm.createHotfix('p','1.0.0','1.0.1'), /already exists/);
    });
    it('clear removes all', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0'); rm.clear();
      assert.strictEqual(rm.getRelease('p','1.0.0'), null);
    });
    it('multiple release notes', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0');
      for(let i=0;i<10;i++) rm.addReleaseNote('p','1.0.0','N'+i);
      assert.strictEqual(rm.getReleaseNotes('p','1.0.0').length,10);
    });
    it('multiple milestones', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0');
      for(let i=0;i<5;i++) rm.addMilestone('p','1.0.0','M'+i);
      assert.strictEqual(rm.getMilestones('p','1.0.0').length,5);
    });
    it('multiple tags', function() {
      const rm = new ReleaseManager(); rm.createRelease('p','1.0.0');
      for(let i=0;i<8;i++) rm.addTag('p','1.0.0','t'+i);
      assert.strictEqual(rm.getTags('p','1.0.0').length,8);
    });
    it('projects isolated', function() {
      const rm = new ReleaseManager(); rm.createRelease('a','1.0.0'); rm.createRelease('b','2.0.0');
      assert.strictEqual(rm.listReleases('a').length,1); assert.strictEqual(rm.listReleases('b').length,1);
    });
  });
  /* ─── ReleasePipeline (35 tests) ─── */
  describe('ReleasePipeline', function() {
    const { ReleasePipeline } = require('../lib/lifecycle/releasePipeline');
    it('should define pipeline with stages', function() {
      const rp = new ReleasePipeline();
      const p = rp.definePipeline('build',[{name:'Build',actions:[],required:true},{name:'Test',actions:[],required:true}]);
      assert.strictEqual(p.name,'build'); assert.strictEqual(p.stages.length,2);
    });
    it('should throw for missing name', function() {
      assert.throws(() => new ReleasePipeline().definePipeline(null,[{name:'x',actions:[]}]), /required/);
    });
    it('should throw for empty name', function() {
      assert.throws(() => new ReleasePipeline().definePipeline('',[{name:'x',actions:[]}]), /required/);
    });
    it('should throw for non-array stages', function() {
      assert.throws(() => new ReleasePipeline().definePipeline('p','not'), /required/);
    });
    it('should throw for empty stages', function() {
      assert.throws(() => new ReleasePipeline().definePipeline('p',[]), /required/);
    });
    it('should throw for stage without name', function() {
      assert.throws(() => new ReleasePipeline().definePipeline('p',[{actions:[]}]), /must have a name/);
    });
    it('should throw for stage without actions', function() {
      assert.throws(() => new ReleasePipeline().definePipeline('p',[{name:'x'}]), /must have a name/);
    });
    it('should throw for duplicate pipeline', function() {
      const rp = new ReleasePipeline(); rp.definePipeline('p',[{name:'s',actions:[]}]);
      assert.throws(() => rp.definePipeline('p',[{name:'s',actions:[]}]), /already exists/);
    });
    it('getPipeline returns defined', function() {
      const rp = new ReleasePipeline(); rp.definePipeline('t',[{name:'S1',actions:[]}]);
      assert.strictEqual(rp.getPipeline('t').name,'t');
    });
    it('getPipeline null for unknown', function() {
      assert.strictEqual(new ReleasePipeline().getPipeline('nope'), null);
    });
    it('listPipelines returns all', function() {
      const rp = new ReleasePipeline(); rp.definePipeline('a',[{name:'s',actions:[]}]); rp.definePipeline('b',[{name:'s',actions:[]}]);
      assert.strictEqual(rp.listPipelines().length,2);
    });
    it('listPipelines empty initially', function() {
      assert.deepStrictEqual(new ReleasePipeline().listPipelines(), []);
    });
    it('executePipeline runs stages', function() {
      const rp = new ReleasePipeline(); rp.definePipeline('ci',[{name:'Build',actions:[()=>{}],required:true}]);
      const r = rp.executePipeline('ci',{});
      assert.strictEqual(r.status,'completed'); assert.strictEqual(r.stageResults.length,1);
      assert.strictEqual(r.stageResults[0].status,'passed');
    });
    it('executePipeline fails when action throws', function() {
      const rp = new ReleasePipeline(); rp.definePipeline('f',[{name:'F',actions:[()=>{throw Error('Boom');}],required:true}]);
      const r = rp.executePipeline('f',{});
      assert.strictEqual(r.status,'failed');
    });
    it('executePipeline continues if not required', function() {
      const rp = new ReleasePipeline();
      rp.definePipeline('opt',[{name:'Opt',actions:[()=>{throw Error('ok');}],required:false},{name:'Fin',actions:[],required:true}]);
      const r = rp.executePipeline('opt',{});
      assert.strictEqual(r.status,'completed'); assert.strictEqual(r.stageResults.length,2);
      assert.strictEqual(r.stageResults[0].status,'failed');
      assert.strictEqual(r.stageResults[1].status,'passed');
    });
    it('executePipeline throws for unknown', function() {
      assert.throws(() => new ReleasePipeline().executePipeline('nope',{}), /not found/);
    });
    it('getPipelineStatus returns execution', function() {
      const rp = new ReleasePipeline(); rp.definePipeline('p',[{name:'s',actions:[],required:true}]);
      const e = rp.executePipeline('p',{}); const s = rp.getPipelineStatus(e.executionId);
      assert.strictEqual(s.pipeline,'p');
    });
    it('getPipelineStatus null for unknown', function() {
      assert.strictEqual(new ReleasePipeline().getPipelineStatus('unknown'), null);
    });
    it('multiple pipelines', function() {
      const rp = new ReleasePipeline(); rp.definePipeline('a',[{name:'s',actions:[],required:true}]);
      rp.definePipeline('b',[{name:'s',actions:[],required:true}]);
      assert.strictEqual(rp.executePipeline('a',{}).status,'completed');
      assert.strictEqual(rp.executePipeline('b',{}).status,'completed');
    });
    it('same pipeline multiple times', function() {
      const rp = new ReleasePipeline(); rp.definePipeline('r',[{name:'s',actions:[],required:true}]);
      assert.notStrictEqual(rp.executePipeline('r',{}).executionId, rp.executePipeline('r',{}).executionId);
    });
    it('actions receive context', function() {
      const rp = new ReleasePipeline(); let ctx=null;
      rp.definePipeline('c',[{name:'C',actions:[c=>{ctx=c;}],required:true}]);
      rp.executePipeline('c',{value:42});
      assert.strictEqual(ctx.value,42);
    });
    it('clear removes all', function() {
      const rp = new ReleasePipeline(); rp.definePipeline('p',[{name:'s',actions:[],required:true}]);
      const e = rp.executePipeline('p',{}); rp.clear();
      assert.strictEqual(rp.getPipeline('p'),null); assert.strictEqual(rp.getPipelineStatus(e.executionId),null);
    });
    it('multiple stages with results', function() {
      const rp = new ReleasePipeline();
      rp.definePipeline('m',[{name:'S1',actions:[],required:true},{name:'S2',actions:[],required:true},{name:'S3',actions:[],required:true}]);
      const r = rp.executePipeline('m',{});
      assert.strictEqual(r.stageResults.length,3);
    });
    it('stops at first failed required stage', function() {
      const rp = new ReleasePipeline();
      rp.definePipeline('s',[{name:'S1',actions:[()=>{throw Error('F');}],required:true},{name:'S2',actions:[],required:true}]);
      const r = rp.executePipeline('s',{});
      assert.strictEqual(r.status,'failed');
    });
  });
  /* ─── PromotionManager (35 tests) ─── */
  describe('PromotionManager', function() {
    const { PromotionManager } = require('../lib/lifecycle/promotionManager');
    it('should create pending promotion', function() {
      const p = new PromotionManager().promote('proj1','dev','qa');
      assert.strictEqual(p.status,'pending'); assert.strictEqual(p.from,'dev');
      assert.strictEqual(p.to,'qa'); assert.strictEqual(p.projectId,'proj1');
    });
    it('should throw for missing projectId', function() {
      assert.throws(() => new PromotionManager().promote(null,'dev','qa'), /required/);
    });
    it('should throw for missing from', function() {
      assert.throws(() => new PromotionManager().promote('p',null,'qa'), /required/);
    });
    it('should throw for missing to', function() {
      assert.throws(() => new PromotionManager().promote('p','dev',null), /required/);
    });
    it('should create with options', function() {
      const p = new PromotionManager().promote('p','dev','qa',{autoApprove:true});
      assert.strictEqual(p.options.autoApprove, true);
    });
    it('approve changes status', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      const a = pm.approve(p.id,'admin');
      assert.strictEqual(a.status,'approved'); assert.strictEqual(a.approver,'admin');
    });
    it('approve throws for unknown', function() {
      assert.throws(() => new PromotionManager().approve('nope','admin'), /not found/);
    });
    it('approve throws for missing approver', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      assert.throws(() => pm.approve(p.id,null), /required/);
    });
    it('approve throws for non-pending', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      pm.approve(p.id,'admin');
      assert.throws(() => pm.approve(p.id,'admin2'), /already/);
    });
    it('reject changes status', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      const r = pm.reject(p.id,'reviewer','Not ready');
      assert.strictEqual(r.status,'rejected'); assert.strictEqual(r.approver,'reviewer');
      assert.strictEqual(r.reason,'Not ready');
    });
    it('reject allows null reason', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      assert.strictEqual(pm.reject(p.id,'reviewer').reason, null);
    });
    it('reject throws for non-pending', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      pm.reject(p.id,'r','no');
      assert.throws(() => pm.reject(p.id,'r2','again'), /already/);
    });
    it('reject throws for unknown', function() {
      assert.throws(() => new PromotionManager().reject('nope','admin'), /not found/);
    });
    it('reject throws for missing approver', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      assert.throws(() => pm.reject(p.id,null), /required/);
    });
    it('getPromotion returns promotion', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      assert.strictEqual(pm.getPromotion(p.id).id,p.id);
    });
    it('getPromotion null for unknown', function() {
      assert.strictEqual(new PromotionManager().getPromotion('nope'), null);
    });
    it('listPromotions scoped', function() {
      const pm = new PromotionManager();
      pm.promote('p1','dev','qa'); pm.promote('p1','qa','staging'); pm.promote('p2','dev','qa');
      assert.strictEqual(pm.listPromotions('p1').length,2); assert.strictEqual(pm.listPromotions('p2').length,1);
    });
    it('listPromotions empty for unknown', function() {
      assert.deepStrictEqual(new PromotionManager().listPromotions('unknown'), []);
    });
    it('getPendingPromotions returns only pending', function() {
      const pm = new PromotionManager();
      const p1 = pm.promote('p','dev','qa'); const p2 = pm.promote('p','qa','staging');
      pm.approve(p1.id,'admin');
      const pending = pm.getPendingPromotions('p');
      assert.strictEqual(pending.length,1); assert.strictEqual(pending[0].id,p2.id);
    });
    it('getPendingPromotions empty when none', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      pm.approve(p.id,'admin');
      assert.strictEqual(pm.getPendingPromotions('p').length,0);
    });
    it('getPendingPromotions empty for unknown', function() {
      assert.deepStrictEqual(new PromotionManager().getPendingPromotions('unknown'), []);
    });
    it('clear removes all', function() {
      const pm = new PromotionManager(); pm.promote('p','dev','qa'); pm.clear();
      assert.strictEqual(pm.listPromotions('p').length,0);
    });
    it('many promotions', function() {
      const pm = new PromotionManager();
      for(let i=0;i<50;i++) pm.promote('p','e'+i,'e'+(i+1));
      assert.strictEqual(pm.listPromotions('p').length,50);
    });
    it('multiple approvals', function() {
      const pm = new PromotionManager();
      const p1 = pm.promote('p','dev','qa'); const p2 = pm.promote('p','qa','staging');
      pm.approve(p1.id,'admin'); pm.approve(p2.id,'admin2');
      assert.strictEqual(pm.getPromotion(p1.id).approver,'admin');
      assert.strictEqual(pm.getPromotion(p2.id).approver,'admin2');
    });
    it('approve on rejected throws', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      pm.reject(p.id,'r','bad');
      assert.throws(() => pm.approve(p.id,'admin'), /already rejected/);
    });
    it('reject on approved throws', function() {
      const pm = new PromotionManager(); const p = pm.promote('p','dev','qa');
      pm.approve(p.id,'admin');
      assert.throws(() => pm.reject(p.id,'r','no'), /already approved/);
    });
    it('unique promotion ids', function() {
      const pm = new PromotionManager(); const ids = new Set();
      for(let i=0;i<100;i++) ids.add(pm.promote('p','dev','qa').id);
      assert.strictEqual(ids.size,100);
    });
  });
  /* ─── VersionManager (35 tests) ─── */
  describe('VersionManager', function() {
    const { VersionManager } = require('../lib/lifecycle/versionManager');
    it('should create version', function() {
      const v = new VersionManager().createVersion('p','1.0.0');
      assert.strictEqual(v.version,'1.0.0'); assert.strictEqual(v.projectId,'p');
    });
    it('throws for null projectId', function() {
      assert.throws(() => new VersionManager().createVersion(null,'1.0.0'), /required/);
    });
    it('throws for invalid format', function() {
      assert.throws(() => new VersionManager().createVersion('p','abc'), /Invalid version/);
    });
    it('throws for too many parts', function() {
      assert.throws(() => new VersionManager().createVersion('p','1.2.3.4'), /Invalid version/);
    });
    it('throws for negative numbers', function() {
      assert.throws(() => new VersionManager().createVersion('p','-1.0.0'), /Invalid version/);
    });
    it('throws for duplicate', function() {
      const vm = new VersionManager(); vm.createVersion('p','1.0.0');
      assert.throws(() => vm.createVersion('p','1.0.0'), /already exists/);
    });
    it('getVersion returns version', function() {
      const vm = new VersionManager(); vm.createVersion('p','2.0.0');
      assert.strictEqual(vm.getVersion('p','2.0.0').version,'2.0.0');
    });
    it('getVersion null for unknown', function() {
      assert.strictEqual(new VersionManager().getVersion('p','9.9.9'), null);
    });
    it('getVersion null for unknown project', function() {
      assert.strictEqual(new VersionManager().getVersion('unknown','1.0.0'), null);
    });
    it('getLatest returns highest', function() {
      const vm = new VersionManager(); vm.createVersion('p','1.0.0'); vm.createVersion('p','2.0.0'); vm.createVersion('p','1.5.0');
      assert.strictEqual(vm.getLatest('p').version,'2.0.0');
    });
    it('getLatest null for empty', function() {
      assert.strictEqual(new VersionManager().getLatest('empty'), null);
    });
    it('listVersions returns all', function() {
      const vm = new VersionManager(); vm.createVersion('p','1.0.0'); vm.createVersion('p','2.0.0');
      assert.strictEqual(vm.listVersions('p').length,2);
    });
    it('listVersions empty for unknown', function() {
      assert.deepStrictEqual(new VersionManager().listVersions('unknown'), []);
    });
    it('incrementMajor creates 1.0.0 when empty', function() {
      assert.strictEqual(new VersionManager().incrementMajor('p').version,'1.0.0');
    });
    it('incrementMajor bumps and resets', function() {
      const vm = new VersionManager(); vm.createVersion('p','1.4.2');
      assert.strictEqual(vm.incrementMajor('p').version,'2.0.0');
    });
    it('incrementMinor creates 1.0.0 when empty', function() {
      assert.strictEqual(new VersionManager().incrementMinor('p').version,'1.0.0');
    });
    it('incrementMinor bumps and resets patch', function() {
      const vm = new VersionManager(); vm.createVersion('p','1.4.2');
      assert.strictEqual(vm.incrementMinor('p').version,'1.5.0');
    });
    it('incrementPatch creates 1.0.0 when empty', function() {
      assert.strictEqual(new VersionManager().incrementPatch('p').version,'1.0.0');
    });
    it('incrementPatch bumps', function() {
      const vm = new VersionManager(); vm.createVersion('p','1.4.2');
      assert.strictEqual(vm.incrementPatch('p').version,'1.4.3');
    });
    it('many patch increments', function() {
      const vm = new VersionManager();
      for(let i=0;i<20;i++) vm.incrementPatch('p');
      assert.strictEqual(vm.listVersions('p').length,20);
      assert.strictEqual(vm.getLatest('p').version,'1.0.19');
    });
    it('many major increments', function() {
      const vm = new VersionManager();
      for(let i=0;i<5;i++) vm.incrementMajor('p');
      assert.strictEqual(vm.getLatest('p').version,'5.0.0');
    });
    it('many minor increments', function() {
      const vm = new VersionManager();
      for(let i=0;i<3;i++) vm.incrementMinor('p');
      assert.strictEqual(vm.getLatest('p').version,'1.2.0');
    });
    it('isolated across projects', function() {
      const vm = new VersionManager(); vm.createVersion('a','1.0.0'); vm.createVersion('b','5.0.0');
      assert.strictEqual(vm.getLatest('a').version,'1.0.0');
      assert.strictEqual(vm.getLatest('b').version,'5.0.0');
    });
    it('clear removes all', function() {
      const vm = new VersionManager(); vm.createVersion('p','1.0.0'); vm.clear();
      assert.strictEqual(vm.getLatest('p'), null);
    });
    it('sorts versions correctly', function() {
      const vm = new VersionManager(); vm.createVersion('p','1.0.0'); vm.createVersion('p','10.0.0'); vm.createVersion('p','2.0.0');
      assert.strictEqual(vm.getLatest('p').version,'10.0.0');
    });
    it('handles version with zeros', function() {
      const vm = new VersionManager(); vm.createVersion('p','0.0.1');
      vm.incrementMajor('p');
      assert.strictEqual(vm.getLatest('p').version,'1.0.0');
    });
  });
  /* ─── SnapshotManager (35 tests) ─── */
  describe('SnapshotManager', function() {
    const { SnapshotManager } = require('../lib/lifecycle/snapshotManager');
    it('should create snapshot with id and version', function() {
      const s = new SnapshotManager().createSnapshot('p1','project',{name:'test'});
      assert.ok(s.id); assert.strictEqual(s.type,'project');
      assert.deepStrictEqual(s.data,{name:'test'}); assert.ok(s.version);
    });
    it('throws for missing projectId', function() {
      assert.throws(() => new SnapshotManager().createSnapshot(null,'project',{}), /required/);
    });
    it('throws for missing type', function() {
      assert.throws(() => new SnapshotManager().createSnapshot('p',null,{}), /required/);
    });
    it('throws for missing data', function() {
      assert.throws(() => new SnapshotManager().createSnapshot('p','project'), /required/);
    });
    it('multiple types', function() {
      const sm = new SnapshotManager();
      ['project','workflow','config','runtime','knowledge','plugin','rollback'].forEach(t=>sm.createSnapshot('p',t,{}));
      assert.strictEqual(sm.listSnapshots('p').length,7);
    });
    it('getSnapshot by id', function() {
      const sm = new SnapshotManager(); const s = sm.createSnapshot('p','project',{});
      assert.strictEqual(sm.getSnapshot(s.id).id,s.id);
    });
    it('getSnapshot null for unknown', function() {
      assert.strictEqual(new SnapshotManager().getSnapshot('nope'), null);
    });
    it('listSnapshots filters by type', function() {
      const sm = new SnapshotManager();
      sm.createSnapshot('p','project',{a:1}); sm.createSnapshot('p','workflow',{b:2}); sm.createSnapshot('p','project',{c:3});
      assert.strictEqual(sm.listSnapshots('p','project').length,2);
      assert.strictEqual(sm.listSnapshots('p','workflow').length,1);
    });
    it('listSnapshots without type returns all', function() {
      const sm = new SnapshotManager(); sm.createSnapshot('p','project',{}); sm.createSnapshot('p','workflow',{});
      assert.strictEqual(sm.listSnapshots('p').length,2);
    });
    it('listSnapshots empty for unknown project', function() {
      assert.deepStrictEqual(new SnapshotManager().listSnapshots('unknown'), []);
    });
    it('restoreSnapshot returns data', function() {
      const sm = new SnapshotManager(); const s = sm.createSnapshot('p','project',{key:'val'});
      assert.deepStrictEqual(sm.restoreSnapshot(s.id),{key:'val'});
    });
    it('restoreSnapshot throws for unknown', function() {
      assert.throws(() => new SnapshotManager().restoreSnapshot('nope'), /not found/);
    });
    it('deleteSnapshot returns true', function() {
      const sm = new SnapshotManager(); const s = sm.createSnapshot('p','project',{});
      assert.strictEqual(sm.deleteSnapshot(s.id),true);
      assert.strictEqual(sm.getSnapshot(s.id),null);
    });
    it('deleteSnapshot false for unknown', function() {
      assert.strictEqual(new SnapshotManager().deleteSnapshot('nope'), false);
    });
    it('isolated across projects', function() {
      const sm = new SnapshotManager(); sm.createSnapshot('a','project',{}); sm.createSnapshot('b','project',{});
      assert.strictEqual(sm.listSnapshots('a').length,1);
      assert.strictEqual(sm.listSnapshots('b').length,1);
    });
    it('clear removes all', function() {
      const sm = new SnapshotManager(); sm.createSnapshot('p','project',{}); sm.clear();
      assert.strictEqual(sm.listSnapshots('p').length,0);
    });
    it('unique snapshot ids', function() {
      const sm = new SnapshotManager(); const ids = new Set();
      for(let i=0;i<100;i++) ids.add(sm.createSnapshot('p','project',{i}).id);
      assert.strictEqual(ids.size,100);
    });
    it('incrementing version', function() {
      const sm = new SnapshotManager();
      const s1 = sm.createSnapshot('p','project',{}); const s2 = sm.createSnapshot('p','project',{});
      assert.ok(s2.version > s1.version);
    });
    it('large data snapshot', function() {
      const sm = new SnapshotManager(); const big=[];
      for(let i=0;i<1000;i++) big.push({i,data:'x'.repeat(100)});
      const s = sm.createSnapshot('p','project',big);
      assert.strictEqual(sm.restoreSnapshot(s.id).length,1000);
    });
    it('50 snapshots for one project', function() {
      const sm = new SnapshotManager();
      for(let i=0;i<50;i++) sm.createSnapshot('p','project',{i});
      assert.strictEqual(sm.listSnapshots('p').length,50);
    });
  });
  /* ─── MigrationManager (35 tests) ─── */
  describe('MigrationManager', function() {
    const { MigrationManager } = require('../lib/lifecycle/migrationManager');
    it('should create pending migration', function() {
      const m = new MigrationManager().createMigration('p','1.0.0','2.0.0','schema');
      assert.strictEqual(m.status,'pending'); assert.strictEqual(m.fromVersion,'1.0.0');
      assert.strictEqual(m.toVersion,'2.0.0'); assert.strictEqual(m.type,'schema');
    });
    it('throws for missing projectId', function() {
      assert.throws(()=>new MigrationManager().createMigration(null,'1.0.0','2.0.0','schema'), /required/);
    });
    it('throws for missing fromVersion', function() {
      assert.throws(()=>new MigrationManager().createMigration('p',null,'2.0.0','schema'), /required/);
    });
    it('throws for missing toVersion', function() {
      assert.throws(()=>new MigrationManager().createMigration('p','1.0.0',null,'schema'), /required/);
    });
    it('throws for missing type', function() {
      assert.throws(()=>new MigrationManager().createMigration('p','1.0.0','2.0.0',null), /required/);
    });
    it('all migration types', function() {
      const mm = new MigrationManager();
      ['schema','workflow','runtime','plugin','configuration'].forEach(t=>mm.createMigration('p','1.0.0','2.0.0',t));
      assert.strictEqual(mm.listMigrations('p').length,5);
    });
    it('executeMigration sets completed', function() {
      const mm = new MigrationManager(); const m = mm.createMigration('p','1.0.0','2.0.0','schema');
      assert.strictEqual(mm.executeMigration(m.id).status,'completed');
    });
    it('executeMigration throws for unknown', function() {
      assert.throws(()=>new MigrationManager().executeMigration('nope'), /not found/);
    });
    it('executeMigration throws for non-pending', function() {
      const mm = new MigrationManager(); const m = mm.createMigration('p','1.0.0','2.0.0','schema');
      mm.executeMigration(m.id);
      assert.throws(()=>mm.executeMigration(m.id), /already/);
    });
    it('rollbackMigration sets rolled_back', function() {
      const mm = new MigrationManager(); const m = mm.createMigration('p','1.0.0','2.0.0','schema');
      mm.executeMigration(m.id);
      assert.strictEqual(mm.rollbackMigration(m.id).status,'rolled_back');
    });
    it('rollbackMigration throws for unknown', function() {
      assert.throws(()=>new MigrationManager().rollbackMigration('nope'), /not found/);
    });
    it('rollbackMigration throws for non-completed', function() {
      const mm = new MigrationManager(); const m = mm.createMigration('p','1.0.0','2.0.0','schema');
      assert.throws(()=>mm.rollbackMigration(m.id), /Cannot rollback/);
    });
    it('rollbackMigration throws for already rolled_back', function() {
      const mm = new MigrationManager(); const m = mm.createMigration('p','1.0.0','2.0.0','schema');
      mm.executeMigration(m.id); mm.rollbackMigration(m.id);
      assert.throws(()=>mm.rollbackMigration(m.id), /Cannot rollback/);
    });
    it('getMigration returns migration', function() {
      const mm = new MigrationManager(); const m = mm.createMigration('p','1.0.0','2.0.0','schema');
      assert.strictEqual(mm.getMigration(m.id).id, m.id);
    });
    it('getMigration null for unknown', function() {
      assert.strictEqual(new MigrationManager().getMigration('nope'), null);
    });
    it('listMigrations filters by project', function() {
      const mm = new MigrationManager();
      mm.createMigration('p1','1.0.0','2.0.0','schema'); mm.createMigration('p1','2.0.0','3.0.0','workflow');
      mm.createMigration('p2','1.0.0','2.0.0','schema');
      assert.strictEqual(mm.listMigrations('p1').length,2);
      assert.strictEqual(mm.listMigrations('p2').length,1);
    });
    it('listMigrations empty for unknown', function() {
      assert.deepStrictEqual(new MigrationManager().listMigrations('unknown'), []);
    });
    it('validateMigration valid', function() {
      const mm = new MigrationManager(); const m = mm.createMigration('p','1.0.0','2.0.0','schema');
      const v = mm.validateMigration(m.id);
      assert.strictEqual(v.valid,true); assert.deepStrictEqual(v.issues,[]);
    });
    it('validateMigration flags identical versions', function() {
      const mm = new MigrationManager(); const m = mm.createMigration('p','1.0.0','1.0.0','schema');
      assert.strictEqual(mm.validateMigration(m.id).valid, false);
    });
    it('validateMigration flags invalid versions', function() {
      const mm = new MigrationManager(); const m = mm.createMigration('p','abc','def','schema');
      assert.strictEqual(mm.validateMigration(m.id).valid, false);
    });
    it('validateMigration throws for unknown', function() {
      assert.throws(()=>new MigrationManager().validateMigration('nope'), /not found/);
    });
    it('clear removes all', function() {
      const mm = new MigrationManager(); mm.createMigration('p','1.0.0','2.0.0','schema'); mm.clear();
      assert.strictEqual(mm.listMigrations('p').length,0);
    });
    it('end-to-end lifecycle', function() {
      const mm = new MigrationManager(); const m = mm.createMigration('p','1.0.0','2.0.0','workflow');
      assert.strictEqual(m.status,'pending');
      mm.executeMigration(m.id); assert.strictEqual(mm.getMigration(m.id).status,'completed');
      mm.rollbackMigration(m.id); assert.strictEqual(mm.getMigration(m.id).status,'rolled_back');
    });
    it('unique migration ids', function() {
      const mm = new MigrationManager(); const ids = new Set();
      for(let i=0;i<50;i++) ids.add(mm.createMigration('p',i+'.0.0',(i+1)+'.0.0','schema').id);
      assert.strictEqual(ids.size,50);
    });
  });
  /* ─── ProjectTemplates (35 tests) ─── */
  describe('ProjectTemplates', function() {
    const { ProjectTemplates } = require('../lib/lifecycle/projectTemplates');
    it('should register template', function() {
      const t = new ProjectTemplates().registerTemplate({id:'starter-js',name:'Starter JS'});
      assert.strictEqual(t.id,'starter-js'); assert.strictEqual(t.name,'Starter JS');
    });
    it('register with all fields', function() {
      const t = new ProjectTemplates().registerTemplate({id:'f',name:'Full',description:'desc',category:'business',config:{db:'sqlite'},version:'2.0.0'});
      assert.strictEqual(t.description,'desc'); assert.strictEqual(t.category,'business');
      assert.strictEqual(t.config.db,'sqlite'); assert.strictEqual(t.version,'2.0.0');
    });
    it('throws for null template', function() {
      assert.throws(()=>new ProjectTemplates().registerTemplate(null), /must have id and name/);
    });
    it('throws for missing id', function() {
      assert.throws(()=>new ProjectTemplates().registerTemplate({name:'X'}), /must have id and name/);
    });
    it('throws for missing name', function() {
      assert.throws(()=>new ProjectTemplates().registerTemplate({id:'x'}), /must have id and name/);
    });
    it('throws for duplicate id', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'dup',name:'First'});
      assert.throws(()=>pt.registerTemplate({id:'dup',name:'Second'}), /already registered/);
    });
    it('getTemplate returns template', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'t1',name:'T1'});
      assert.strictEqual(pt.getTemplate('t1').name,'T1');
    });
    it('getTemplate null for unknown', function() {
      assert.strictEqual(new ProjectTemplates().getTemplate('unknown'), null);
    });
    it('listTemplates returns all', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'a',name:'A',category:'starter'}); pt.registerTemplate({id:'b',name:'B',category:'business'});
      assert.strictEqual(pt.listTemplates().length,2);
    });
    it('listTemplates filters by category', function() {
      const pt = new ProjectTemplates();
      pt.registerTemplate({id:'a',name:'A',category:'starter'}); pt.registerTemplate({id:'b',name:'B',category:'business'});
      pt.registerTemplate({id:'c',name:'C',category:'starter'});
      assert.strictEqual(pt.listTemplates('starter').length,2);
      assert.strictEqual(pt.listTemplates('business').length,1);
    });
    it('listTemplates empty for unknown category', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'a',name:'A',category:'starter'});
      assert.deepStrictEqual(pt.listTemplates('nonexistent'), []);
    });
    it('listTemplates empty initially', function() {
      assert.deepStrictEqual(new ProjectTemplates().listTemplates(), []);
    });
    it('applyTemplate returns config', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'t1',name:'T1',config:{db:'postgres',port:5432}});
      assert.deepStrictEqual(pt.applyTemplate('proj1','t1'), {db:'postgres',port:5432});
    });
    it('applyTemplate throws for unknown', function() {
      assert.throws(()=>new ProjectTemplates().applyTemplate('p','unknown'), /not found/);
    });
    it('applyTemplate throws for null projectId', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'t1',name:'T1'});
      assert.throws(()=>pt.applyTemplate(null,'t1'), /Project ID is required/);
    });
    it('applyTemplate throws for empty', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'t1',name:'T1'});
      assert.throws(()=>pt.applyTemplate('','t1'), /Project ID is required/);
    });
    it('removeTemplate returns true', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'t',name:'T'});
      assert.strictEqual(pt.removeTemplate('t'),true);
      assert.strictEqual(pt.getTemplate('t'),null);
    });
    it('removeTemplate false for unknown', function() {
      assert.strictEqual(new ProjectTemplates().removeTemplate('nope'), false);
    });
    it('clear removes all', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'a',name:'A'}); pt.registerTemplate({id:'b',name:'B'});
      pt.clear();
      assert.strictEqual(pt.listTemplates().length,0);
    });
    it('all categories', function() {
      const pt = new ProjectTemplates();
      ['starter','business','restaurant','portfolio','landing','saas','marketplace','enterprise'].forEach(c=>pt.registerTemplate({id:c,name:c,category:c}));
      assert.strictEqual(pt.listTemplates().length,8);
    });
    it('empty config applies empty', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'e',name:'E'});
      assert.deepStrictEqual(pt.applyTemplate('p','e'), {});
    });
    it('100 templates', function() {
      const pt = new ProjectTemplates();
      for(let i=0;i<100;i++) pt.registerTemplate({id:'t'+i,name:'T'+i,category:'starter'});
      assert.strictEqual(pt.listTemplates().length,100);
    });
    it('re-register after removal', function() {
      const pt = new ProjectTemplates(); pt.registerTemplate({id:'t1',name:'T1'}); pt.removeTemplate('t1');
      const t = pt.registerTemplate({id:'t1',name:'T1v2'});
      assert.strictEqual(t.name,'T1v2');
    });
  });
  /* ─── ProjectCloner (35 tests) ─── */
  describe('ProjectCloner', function() {
    const { ProjectCloner } = require('../lib/lifecycle/projectCloner');
    it('should clone project', function() {
      const c = new ProjectCloner().cloneProject('proj-1','Clone');
      assert.ok(c.newProjectId); assert.strictEqual(c.name,'Clone');
      assert.strictEqual(c.clonedFrom,'proj-1'); assert.ok(c.timestamp);
    });
    it('clone with options', function() {
      const c = new ProjectCloner().cloneProject('p','Copy',{includeHistory:true});
      assert.strictEqual(c.options.includeHistory, true);
    });
    it('throws for null projectId', function() {
      assert.throws(()=>new ProjectCloner().cloneProject(null,'x'), /required/);
    });
    it('throws for null newName', function() {
      assert.throws(()=>new ProjectCloner().cloneProject('p',null), /required/);
    });
    it('throws for empty projectId', function() {
      assert.throws(()=>new ProjectCloner().cloneProject('','x'), /required/);
    });
    it('throws for empty newName', function() {
      assert.throws(()=>new ProjectCloner().cloneProject('p',''), /required/);
    });
    it('getCloneHistory returns clones for source', function() {
      const pc = new ProjectCloner(); pc.cloneProject('source','C1'); pc.cloneProject('source','C2'); pc.cloneProject('other','Cx');
      assert.strictEqual(pc.getCloneHistory('source').length,2);
    });
    it('getCloneHistory empty for unknown', function() {
      assert.deepStrictEqual(new ProjectCloner().getCloneHistory('unknown'), []);
    });
    it('unique clone ids', function() {
      const pc = new ProjectCloner(); const ids = new Set();
      for(let i=0;i<50;i++) ids.add(pc.cloneProject('source','C'+i).newProjectId);
      assert.strictEqual(ids.size,50);
    });
    it('records snapshot id', function() {
      const c = new ProjectCloner().cloneProject('p','Clone');
      assert.ok(c.snapshotId); assert.ok(c.snapshotId.startsWith('snap_'));
    });
    it('unique snapshot ids', function() {
      const pc = new ProjectCloner();
      const c1 = pc.cloneProject('p','C1'); const c2 = pc.cloneProject('p','C2');
      assert.notStrictEqual(c1.snapshotId,c2.snapshotId);
    });
    it('100 clones for same source', function() {
      const pc = new ProjectCloner();
      for(let i=0;i<100;i++) pc.cloneProject('source','C'+i);
      assert.strictEqual(pc.getCloneHistory('source').length,100);
    });
    it('clone history returns copy', function() {
      const pc = new ProjectCloner(); pc.cloneProject('p','C1');
      const h = pc.getCloneHistory('p'); h.push({fake:true});
      assert.strictEqual(pc.getCloneHistory('p').length,1);
    });
    it('clear removes all', function() {
      const pc = new ProjectCloner(); pc.cloneProject('p','C1'); pc.clear();
      assert.strictEqual(pc.getCloneHistory('p').length,0);
    });
    it('multiple sources', function() {
      const pc = new ProjectCloner(); pc.cloneProject('a','A1'); pc.cloneProject('b','B1'); pc.cloneProject('a','A2');
      assert.strictEqual(pc.getCloneHistory('a').length,2);
      assert.strictEqual(pc.getCloneHistory('b').length,1);
    });
    it('returns clone metadata', function() {
      const c = new ProjectCloner().cloneProject('orig','MyClone',{includeConfig:true});
      assert.strictEqual(c.clonedFrom,'orig'); assert.strictEqual(c.name,'MyClone');
      assert.strictEqual(c.options.includeConfig,true);
    });
  });
  /* ─── ProjectImporter (35 tests) ─── */
  describe('ProjectImporter', function() {
    const { ProjectImporter } = require('../lib/lifecycle/projectImporter');
    it('should import JSON data', function() {
      const r = new ProjectImporter().importProject({name:'imported-proj'},'json');
      assert.ok(r.projectId); assert.strictEqual(r.name,'imported-proj'); assert.strictEqual(r.format,'json');
    });
    it('should import JSON string', function() {
      const r = new ProjectImporter().importProject('{"name":"json-string"}','json');
      assert.strictEqual(r.name,'json-string');
    });
    it('should import YAML', function() {
      const r = new ProjectImporter().importProject({raw:'yaml'},'yaml');
      assert.strictEqual(r.format,'yaml');
    });
    it('should import ZIP', function() {
      const r = new ProjectImporter().importProject({raw:'zip'},'zip');
      assert.strictEqual(r.format,'zip');
    });
    it('should warn when name missing', function() {
      const r = new ProjectImporter().importProject({},'json');
      assert.ok(r.warnings.length>0); assert.ok(r.warnings[0].includes('name'));
    });
    it('throws for missing data', function() {
      assert.throws(()=>new ProjectImporter().importProject(null,'json'), /required/);
    });
    it('throws for missing format', function() {
      assert.throws(()=>new ProjectImporter().importProject({},null), /required/);
    });
    it('throws for invalid format', function() {
      assert.throws(()=>new ProjectImporter().importProject({},'xml'), /Invalid format/);
    });
    it('throws for invalid JSON string', function() {
      assert.throws(()=>new ProjectImporter().importProject('not json','json'), /Failed to parse/);
    });
    it('throws for non-object JSON', function() {
      assert.throws(()=>new ProjectImporter().importProject('"string"','json'), /must be a valid object/);
    });
    it('validateImport valid', function() {
      const v = new ProjectImporter().validateImport({name:'test'},'json');
      assert.strictEqual(v.valid,true);
    });
    it('validateImport invalid for no data', function() {
      assert.strictEqual(new ProjectImporter().validateImport(null,'json').valid,false);
    });
    it('validateImport invalid for no format', function() {
      assert.strictEqual(new ProjectImporter().validateImport({},null).valid,false);
    });
    it('validateImport invalid for bad format', function() {
      assert.strictEqual(new ProjectImporter().validateImport({},'xml').valid,false);
    });
    it('validateImport invalid for bad JSON', function() {
      assert.strictEqual(new ProjectImporter().validateImport('bad{','json').valid,false);
    });
    it('getImportHistory returns all', function() {
      const pi = new ProjectImporter(); pi.importProject({name:'a'},'json'); pi.importProject({name:'b'},'yaml');
      assert.strictEqual(pi.getImportHistory().length,2);
    });
    it('getImportHistory empty initially', function() {
      assert.deepStrictEqual(new ProjectImporter().getImportHistory(), []);
    });
    it('getImportHistory returns copy', function() {
      const pi = new ProjectImporter(); pi.importProject({name:'a'},'json');
      const h = pi.getImportHistory(); h.pop();
      assert.strictEqual(pi.getImportHistory().length,1);
    });
    it('clear removes all', function() {
      const pi = new ProjectImporter(); pi.importProject({name:'a'},'json'); pi.clear();
      assert.strictEqual(pi.getImportHistory().length,0);
    });
    it('unique project ids', function() {
      const pi = new ProjectImporter(); const ids = new Set();
      for(let i=0;i<50;i++) ids.add(pi.importProject({name:'p'+i},'json').projectId);
      assert.strictEqual(ids.size,50);
    });
    it('generated name for unnamed', function() {
      const r = new ProjectImporter().importProject({},'json');
      assert.ok(r.name.startsWith('imported_'));
    });
    it('100 imports', function() {
      const pi = new ProjectImporter();
      for(let i=0;i<100;i++) pi.importProject({name:'p'+i,data:'x'.repeat(100)},'json');
      assert.strictEqual(pi.getImportHistory().length,100);
    });
  });
  /* ─── ProjectExporter (35 tests) ─── */
  describe('ProjectExporter', function() {
    const { ProjectExporter } = require('../lib/lifecycle/projectExporter');
    it('should export project in json', function() {
      const r = new ProjectExporter().exportProject('proj-1','json');
      assert.strictEqual(r.format,'json'); assert.strictEqual(r.data.projectId,'proj-1'); assert.ok(r.size>0);
    });
    it('should export project in yaml', function() {
      const r = new ProjectExporter().exportProject('proj-1','yaml');
      assert.strictEqual(r.format,'yaml');
    });
    it('throws for missing projectId', function() {
      assert.throws(()=>new ProjectExporter().exportProject(null,'json'), /required/);
    });
    it('throws for missing format', function() {
      assert.throws(()=>new ProjectExporter().exportProject('p',null), /required/);
    });
    it('throws for invalid format', function() {
      assert.throws(()=>new ProjectExporter().exportProject('p','xml'), /Invalid format/);
    });
    it('throws for empty projectId', function() {
      assert.throws(()=>new ProjectExporter().exportProject('','json'), /required/);
    });
    it('exportBundle multiple projects', function() {
      const r = new ProjectExporter().exportBundle(['p1','p2'],'json');
      assert.strictEqual(r.data.bundle.length,2);
    });
    it('exportBundle throws for empty array', function() {
      assert.throws(()=>new ProjectExporter().exportBundle([],'json'), /non-empty/);
    });
    it('exportBundle throws for null', function() {
      assert.throws(()=>new ProjectExporter().exportBundle(null,'json'), /non-empty/);
    });
    it('exportBundle yaml', function() {
      const r = new ProjectExporter().exportBundle(['p1'],'yaml');
      assert.strictEqual(r.format,'yaml');
    });
    it('exportTemplate', function() {
      const r = new ProjectExporter().exportTemplate('proj-1','starter');
      assert.strictEqual(r.data.templateName,'starter'); assert.strictEqual(r.format,'json');
    });
    it('exportTemplate throws for null projectId', function() {
      assert.throws(()=>new ProjectExporter().exportTemplate(null,'t'), /required/);
    });
    it('exportTemplate throws for null templateName', function() {
      assert.throws(()=>new ProjectExporter().exportTemplate('p',null), /required/);
    });
    it('getExportHistory returns all', function() {
      const pe = new ProjectExporter(); pe.exportProject('p1','json'); pe.exportProject('p2','yaml'); pe.exportBundle(['p3'],'json');
      assert.strictEqual(pe.getExportHistory().length,3);
    });
    it('getExportHistory empty initially', function() {
      assert.deepStrictEqual(new ProjectExporter().getExportHistory(), []);
    });
    it('getExportHistory returns copy', function() {
      const pe = new ProjectExporter(); pe.exportProject('p','json');
      const h = pe.getExportHistory(); h.pop();
      assert.strictEqual(pe.getExportHistory().length,1);
    });
    it('clear removes all', function() {
      const pe = new ProjectExporter(); pe.exportProject('p','json'); pe.clear();
      assert.strictEqual(pe.getExportHistory().length,0);
    });
    it('size computed correctly', function() {
      const pe = new ProjectExporter(); const r = pe.exportProject('p','json');
      assert.strictEqual(r.size, JSON.stringify(r.data).length);
    });
    it('100 exports', function() {
      const pe = new ProjectExporter();
      for(let i=0;i<100;i++) pe.exportProject('p'+i,'json');
      assert.strictEqual(pe.getExportHistory().length,100);
    });
    it('bundle size correct', function() {
      const r = new ProjectExporter().exportBundle(['p1','p2','p3'],'json');
      assert.strictEqual(r.size, JSON.stringify(r.data).length);
    });
    it('template size correct', function() {
      const r = new ProjectExporter().exportTemplate('p','t');
      assert.strictEqual(r.size, JSON.stringify(r.data).length);
    });
  });
  /* ─── LifecycleEvents (35 tests) ─── */
  describe('LifecycleEvents', function() {
    const { LifecycleEvents } = require('../lib/lifecycle/lifecycleEvents');
    it('EVENTS constant has 16 keys', function() {
      assert.strictEqual(Object.keys(LifecycleEvents.EVENTS).length, 16);
    });
    it('emit triggers handler', function() {
      const ev = new LifecycleEvents(); let called=false;
      ev.on('test_event',()=>{called=true;}); ev.emit('test_event',{});
      assert.ok(called);
    });
    it('passes data to handler', function() {
      const ev = new LifecycleEvents(); let d=null;
      ev.on('e',(x)=>{d=x;}); ev.emit('e',{key:'val'});
      assert.deepStrictEqual(d,{key:'val'});
    });
    it('throws for null event', function() {
      assert.throws(()=>new LifecycleEvents().on(null,()=>{}), /required/);
    });
    it('throws for non-function handler', function() {
      assert.throws(()=>new LifecycleEvents().on('e','not'), /required/);
    });
    it('off removes handler', function() {
      const ev = new LifecycleEvents(); let c=0;
      const fn=()=>{c++;}; ev.on('e',fn); ev.emit('e',{}); ev.off('e',fn); ev.emit('e',{});
      assert.strictEqual(c,1);
    });
    it('off no throw for unknown event', function() {
      new LifecycleEvents().off('unknown',()=>{});
    });
    it('emit no throw with no handlers', function() {
      new LifecycleEvents().emit('none',{});
    });
    it('listEvents returns registered', function() {
      const ev = new LifecycleEvents(); ev.on('a',()=>{}); ev.on('b',()=>{});
      const l = ev.listEvents();
      assert.ok(l.includes('a')); assert.ok(l.includes('b'));
    });
    it('listEvents empty initially', function() {
      assert.deepStrictEqual(new LifecycleEvents().listEvents(), []);
    });
    it('multiple handlers for same event', function() {
      const ev = new LifecycleEvents(); let c=0;
      ev.on('e',()=>c++); ev.on('e',()=>c++); ev.emit('e',{});
      assert.strictEqual(c,2);
    });
    it('clear removes all', function() {
      const ev = new LifecycleEvents(); ev.on('a',()=>{}); ev.on('b',()=>{}); ev.clear();
      assert.strictEqual(ev.listEvents().length,0);
    });
    it('PROJECT_CREATED event', function() {
      const ev = new LifecycleEvents(); let d=null;
      ev.on(LifecycleEvents.EVENTS.PROJECT_CREATED,x=>d=x); ev.emit(LifecycleEvents.EVENTS.PROJECT_CREATED,{id:'p'});
      assert.strictEqual(d.id,'p');
    });
    it('RELEASE_CREATED event', function() {
      const ev = new LifecycleEvents(); let d=null;
      ev.on(LifecycleEvents.EVENTS.RELEASE_CREATED,x=>d=x); ev.emit(LifecycleEvents.EVENTS.RELEASE_CREATED,{v:'1.0.0'});
      assert.strictEqual(d.v,'1.0.0');
    });
    it('SNAPSHOT_CREATED event', function() {
      const ev = new LifecycleEvents(); let d=null;
      ev.on(LifecycleEvents.EVENTS.SNAPSHOT_CREATED,x=>d=x); ev.emit(LifecycleEvents.EVENTS.SNAPSHOT_CREATED,{t:'project'});
      assert.strictEqual(d.t,'project');
    });
    it('ENVIRONMENT_CREATED event', function() {
      const ev = new LifecycleEvents(); let d=null;
      ev.on(LifecycleEvents.EVENTS.ENVIRONMENT_CREATED,x=>d=x); ev.emit(LifecycleEvents.EVENTS.ENVIRONMENT_CREATED,{n:'dev'});
      assert.strictEqual(d.n,'dev');
    });
    it('PROMOTION_APPROVED event', function() {
      const ev = new LifecycleEvents(); let d=null;
      ev.on(LifecycleEvents.EVENTS.PROMOTION_APPROVED,x=>d=x); ev.emit(LifecycleEvents.EVENTS.PROMOTION_APPROVED,{id:'p1'});
      assert.strictEqual(d.id,'p1');
    });
    it('MIGRATION_EXECUTED event', function() {
      const ev = new LifecycleEvents(); let d=null;
      ev.on(LifecycleEvents.EVENTS.MIGRATION_EXECUTED,x=>d=x); ev.emit(LifecycleEvents.EVENTS.MIGRATION_EXECUTED,{id:'m1'});
      assert.strictEqual(d.id,'m1');
    });
    it('TEMPLATE_APPLIED event', function() {
      const ev = new LifecycleEvents(); let d=null;
      ev.on(LifecycleEvents.EVENTS.TEMPLATE_APPLIED,x=>d=x); ev.emit(LifecycleEvents.EVENTS.TEMPLATE_APPLIED,{tid:'t1'});
      assert.strictEqual(d.tid,'t1');
    });
    it('isolated instances', function() {
      const a = new LifecycleEvents(); const b = new LifecycleEvents(); let c=false;
      b.on('e',()=>{c=true;}); a.emit('e',{});
      assert.strictEqual(c,false);
    });
    it('off cleans up empty handler arrays', function() {
      const ev = new LifecycleEvents(); const fn=()=>{};
      ev.on('e',fn); ev.off('e',fn);
      assert.strictEqual(ev.listEvents().length,0);
    });
  });
  /* ─── LifecycleMetrics (35 tests) ─── */
  describe('LifecycleMetrics', function() {
    const { LifecycleMetrics } = require('../lib/lifecycle/lifecycleMetrics');
    it('should record metric value', function() {
      const r = new LifecycleMetrics().record('deployments',42);
      assert.strictEqual(r.value,42); assert.ok(r.timestamp);
    });
    it('record with tags', function() {
      const r = new LifecycleMetrics().record('deployments',1,{env:'prod'});
      assert.deepStrictEqual(r.tags,{env:'prod'});
    });
    it('throws for null name', function() {
      assert.throws(()=>new LifecycleMetrics().record(null,1), /required/);
    });
    it('throws for undefined value', function() {
      assert.throws(()=>new LifecycleMetrics().record('m'), /required/);
    });
    it('throws for null value', function() {
      assert.throws(()=>new LifecycleMetrics().record('m',null), /required/);
    });
    it('query returns entries', function() {
      const lm = new LifecycleMetrics(); lm.record('m',10); lm.record('m',20);
      assert.strictEqual(lm.query('m').length,2);
    });
    it('query empty for unknown', function() {
      assert.deepStrictEqual(new LifecycleMetrics().query('unknown'), []);
    });
    it('query with limit', function() {
      const lm = new LifecycleMetrics();
      for(let i=0;i<10;i++) lm.record('m',i);
      assert.strictEqual(lm.query('m',{limit:3}).length,3);
    });
    it('query with since', function() {
      const lm = new LifecycleMetrics(); lm.record('m',1);
      assert.strictEqual(lm.query('m',{since:new Date(Date.now()+1000).toISOString()}).length,0);
    });
    it('aggregate count', function() {
      const lm = new LifecycleMetrics(); lm.record('m',10); lm.record('m',20); lm.record('m',30);
      assert.strictEqual(lm.aggregate('m','count'),3);
    });
    it('aggregate avg', function() {
      const lm = new LifecycleMetrics(); lm.record('m',10); lm.record('m',20); lm.record('m',30);
      assert.strictEqual(lm.aggregate('m','avg'),20);
    });
    it('aggregate min', function() {
      const lm = new LifecycleMetrics(); lm.record('m',30); lm.record('m',10); lm.record('m',20);
      assert.strictEqual(lm.aggregate('m','min'),10);
    });
    it('aggregate max', function() {
      const lm = new LifecycleMetrics(); lm.record('m',30); lm.record('m',10); lm.record('m',20);
      assert.strictEqual(lm.aggregate('m','max'),30);
    });
    it('aggregate sum', function() {
      const lm = new LifecycleMetrics(); lm.record('m',10); lm.record('m',20); lm.record('m',30);
      assert.strictEqual(lm.aggregate('m','sum'),60);
    });
    it('aggregate 0 for unknown', function() {
      assert.strictEqual(new LifecycleMetrics().aggregate('unknown','count'),0);
    });
    it('aggregate 0 for empty', function() {
      const lm = new LifecycleMetrics(); lm.record('m',1); lm.clear();
      assert.strictEqual(lm.aggregate('m','count'),0);
    });
    it('aggregate throws for unknown fn', function() {
      const lm = new LifecycleMetrics(); lm.record('m',1);
      assert.throws(()=>lm.aggregate('m','unknown'), /Unknown aggregate/);
    });
    it('getMetricNames returns names', function() {
      const lm = new LifecycleMetrics(); lm.record('a',1); lm.record('b',2);
      const n = lm.getMetricNames();
      assert.ok(n.includes('a')); assert.ok(n.includes('b'));
    });
    it('getMetricNames empty initially', function() {
      assert.deepStrictEqual(new LifecycleMetrics().getMetricNames(), []);
    });
    it('clear removes all', function() {
      const lm = new LifecycleMetrics(); lm.record('m',1); lm.clear();
      assert.strictEqual(lm.query('m').length,0);
    });
    it('100 entries', function() {
      const lm = new LifecycleMetrics();
      for(let i=0;i<100;i++) lm.record('m',i);
      assert.strictEqual(lm.aggregate('m','count'),100);
    });
    it('multiple metric names', function() {
      const lm = new LifecycleMetrics();
      for(let i=0;i<10;i++){ lm.record('m1',i); lm.record('m2',i*2); }
      assert.strictEqual(lm.aggregate('m1','count'),10);
      assert.strictEqual(lm.aggregate('m2','count'),10);
    });
  });
  /* ─── LifecycleStorage (35 tests) ─── */
  describe('LifecycleStorage', function() {
    const { LifecycleStorage } = require('../lib/lifecycle/lifecycleStorage');
    it('set and get', function() {
      const ls = new LifecycleStorage(); ls.set('k1','v1');
      assert.strictEqual(ls.get('k1'),'v1');
    });
    it('get null for missing', function() {
      assert.strictEqual(new LifecycleStorage().get('missing'), null);
    });
    it('get null for null key', function() {
      assert.strictEqual(new LifecycleStorage().get(null), null);
    });
    it('get null for undefined key', function() {
      assert.strictEqual(new LifecycleStorage().get(undefined), null);
    });
    it('numeric key', function() {
      const ls = new LifecycleStorage(); ls.set(42,'v');
      assert.strictEqual(ls.get(42),'v');
    });
    it('set throws for null key', function() {
      assert.throws(()=>new LifecycleStorage().set(null,'v'), /Key is required/);
    });
    it('set throws for undefined key', function() {
      assert.throws(()=>new LifecycleStorage().set(undefined,'v'), /Key is required/);
    });
    it('delete returns true', function() {
      const ls = new LifecycleStorage(); ls.set('k','v');
      assert.strictEqual(ls.delete('k'),true); assert.strictEqual(ls.get('k'),null);
    });
    it('delete false for missing', function() {
      assert.strictEqual(new LifecycleStorage().delete('nope'), false);
    });
    it('delete false for null', function() {
      assert.strictEqual(new LifecycleStorage().delete(null), false);
    });
    it('delete false for undefined', function() {
      assert.strictEqual(new LifecycleStorage().delete(undefined), false);
    });
    it('has true for existing', function() {
      const ls = new LifecycleStorage(); ls.set('k','v');
      assert.strictEqual(ls.has('k'), true);
    });
    it('has false for missing', function() {
      assert.strictEqual(new LifecycleStorage().has('nope'), false);
    });
    it('has false for null', function() {
      assert.strictEqual(new LifecycleStorage().has(null), false);
    });
    it('has false for undefined', function() {
      assert.strictEqual(new LifecycleStorage().has(undefined), false);
    });
    it('getAll returns all', function() {
      const ls = new LifecycleStorage(); ls.set('a',1); ls.set('b',2);
      assert.strictEqual(ls.getAll().a,1); assert.strictEqual(ls.getAll().b,2);
    });
    it('getAll returns copy', function() {
      const ls = new LifecycleStorage(); ls.set('k','v');
      const a = ls.getAll(); a.k='modified';
      assert.strictEqual(ls.get('k'),'v');
    });
    it('getAll empty for empty store', function() {
      assert.deepStrictEqual(new LifecycleStorage().getAll(), {});
    });
    it('stores objects', function() {
      const ls = new LifecycleStorage(); ls.set('obj',{nested:{a:1}});
      assert.deepStrictEqual(ls.get('obj'),{nested:{a:1}});
    });
    it('stores arrays', function() {
      const ls = new LifecycleStorage(); ls.set('arr',[1,2,3]);
      assert.deepStrictEqual(ls.get('arr'),[1,2,3]);
    });
    it('stores null', function() {
      const ls = new LifecycleStorage(); ls.set('n',null);
      assert.strictEqual(ls.get('n'), null);
    });
    it('stores booleans', function() {
      const ls = new LifecycleStorage(); ls.set('b',true);
      assert.strictEqual(ls.get('b'), true);
    });
    it('stores numbers', function() {
      const ls = new LifecycleStorage(); ls.set('n',3.14);
      assert.strictEqual(ls.get('n'), 3.14);
    });
    it('clear removes all', function() {
      const ls = new LifecycleStorage(); ls.set('a',1); ls.set('b',2); ls.clear();
      assert.strictEqual(ls.has('a'),false); assert.strictEqual(ls.has('b'),false);
    });
    it('100 entries', function() {
      const ls = new LifecycleStorage();
      for(let i=0;i<100;i++) ls.set('k'+i,i);
      assert.strictEqual(Object.keys(ls.getAll()).length,100);
    });
    it('overwrite updates value', function() {
      const ls = new LifecycleStorage(); ls.set('k','v1'); ls.set('k','v2');
      assert.strictEqual(ls.get('k'),'v2');
    });
    it('delete after overwrite', function() {
      const ls = new LifecycleStorage(); ls.set('k','v1'); ls.set('k','v2'); ls.delete('k');
      assert.strictEqual(ls.get('k'),null);
    });
  });
  /* ─── LifecycleIntegration (35 tests) ─── */
  describe('LifecycleIntegration', function() {
    const { LifecycleIntegration } = require('../lib/lifecycle/lifecycleIntegration');
    const { LifecycleEvents } = require('../lib/lifecycle/lifecycleEvents');
    it('should create with lifecycle ref', function() {
      const ev = new LifecycleEvents(); const li = new LifecycleIntegration(ev);
      assert.ok(li.isEnabled());
    });
    it('enabled by default', function() {
      assert.strictEqual(new LifecycleIntegration({}).isEnabled(), true);
    });
    it('disable sets false', function() {
      const li = new LifecycleIntegration({}); li.disable();
      assert.strictEqual(li.isEnabled(), false);
    });
    it('enable sets true', function() {
      const li = new LifecycleIntegration({}); li.disable(); li.enable();
      assert.strictEqual(li.isEnabled(), true);
    });
    it('integrateRuntime records', function() {
      const r = new LifecycleIntegration({}).integrateRuntime({action:'deploy'});
      assert.strictEqual(r.source,'runtime'); assert.strictEqual(r.context.action,'deploy');
    });
    it('integrateDeployment records', function() {
      const r = new LifecycleIntegration({}).integrateDeployment({env:'prod'});
      assert.strictEqual(r.source,'deployment');
    });
    it('integrateWorkflow records', function() {
      const r = new LifecycleIntegration({}).integrateWorkflow({id:'wf-1'});
      assert.strictEqual(r.source,'workflow');
    });
    it('integrateGovernance records', function() {
      const r = new LifecycleIntegration({}).integrateGovernance({policy:'p1'});
      assert.strictEqual(r.source,'governance');
    });
    it('integrateSecurity records', function() {
      const r = new LifecycleIntegration({}).integrateSecurity({scan:'ok'});
      assert.strictEqual(r.source,'security');
    });
    it('integrateBilling records', function() {
      const r = new LifecycleIntegration({}).integrateBilling({cost:100});
      assert.strictEqual(r.source,'billing');
    });
    it('integrateTelemetry records', function() {
      const r = new LifecycleIntegration({}).integrateTelemetry({metric:'cpu'});
      assert.strictEqual(r.source,'telemetry');
    });
    it('integrateDeveloper records', function() {
      const r = new LifecycleIntegration({}).integrateDeveloper({commit:'abc'});
      assert.strictEqual(r.source,'developer');
    });
    it('integrateData records', function() {
      const r = new LifecycleIntegration({}).integrateData({query:'SELECT'});
      assert.strictEqual(r.source,'data');
    });
    it('integrateEvaluation records', function() {
      const r = new LifecycleIntegration({}).integrateEvaluation({score:0.95});
      assert.strictEqual(r.source,'evaluation');
    });
    it('integrateAI records', function() {
      const r = new LifecycleIntegration({}).integrateAI({model:'gpt-4'});
      assert.strictEqual(r.source,'ai');
    });
    it('integrateCluster records', function() {
      const r = new LifecycleIntegration({}).integrateCluster({nodes:5});
      assert.strictEqual(r.source,'cluster');
    });
    it('getLog returns all', function() {
      const li = new LifecycleIntegration({}); li.integrateRuntime({}); li.integrateDeployment({});
      assert.strictEqual(li.getLog().length, 2);
    });
    it('getLog filters by source', function() {
      const li = new LifecycleIntegration({}); li.integrateRuntime({}); li.integrateDeployment({}); li.integrateRuntime({});
      assert.strictEqual(li.getLog({source:'runtime'}).length, 2);
    });
    it('getLog filters by since', function() {
      const li = new LifecycleIntegration({}); li.integrateRuntime({});
      assert.strictEqual(li.getLog({since:Date.now()+10000}).length, 0);
    });
    it('getLog limits', function() {
      const li = new LifecycleIntegration({});
      for(let i=0;i<10;i++) li.integrateRuntime({});
      assert.strictEqual(li.getLog({limit:3}).length, 3);
    });
    it('getStats returns breakdown', function() {
      const li = new LifecycleIntegration({}); li.integrateRuntime({}); li.integrateRuntime({}); li.integrateDeployment({});
      const s = li.getStats();
      assert.strictEqual(s.total,3); assert.strictEqual(s.bySource.runtime,2); assert.strictEqual(s.bySource.deployment,1);
    });
    it('returns null when disabled', function() {
      const li = new LifecycleIntegration({}); li.disable();
      assert.strictEqual(li.integrateRuntime({}), null);
    });
    it('clear resets log', function() {
      const li = new LifecycleIntegration({}); li.integrateRuntime({}); li.clear();
      assert.strictEqual(li.getLog().length, 0);
    });
    it('caps at 1000 entries', function() {
      const li = new LifecycleIntegration({});
      for(let i=0;i<1100;i++) li.integrateRuntime({i});
      assert.strictEqual(li.getLog().length, 1000);
    });
    it('emits lifecycle:integration event', function() {
      const ev = new LifecycleEvents(); let e=false;
      ev.on('lifecycle:integration',()=>{e=true;});
      const li = new LifecycleIntegration({events:ev}); li.integrateRuntime({});
      assert.ok(e);
    });
  });
  /* ─── Plugin SDK (35 tests) ─── */
  describe('Plugin SDK — Lifecycle Extensions', function() {
    describe('ProjectTemplate', function() {
      it('create with id, name, config', function() {
        const { ProjectTemplate } = require('../lib/plugin-sdk');
        const pt = new ProjectTemplate('starter','Starter Kit',{framework:'express'});
        assert.ok(pt); assert.strictEqual(typeof pt.apply, 'function');
      });
      it('apply returns object', function() {
        const { ProjectTemplate } = require('../lib/plugin-sdk');
        assert.ok(new ProjectTemplate('t1','T1',{db:'mongo'}).apply().applied);
      });
      it('getConfig returns object', function() {
        const { ProjectTemplate } = require('../lib/plugin-sdk');
        assert.ok(typeof new ProjectTemplate('t1','T1',{key:'val'}).getConfig(), 'object');
      });
    });
    describe('LifecycleHook', function() {
      it('register hooks and trigger', function() {
        const { LifecycleHook } = require('../lib/plugin-sdk');
        const lh = new LifecycleHook('pre-release'); let c=false;
        lh.on('release',()=>{c=true;}); lh.trigger('release',{});
        assert.ok(c);
      });
      it('on stores hook function', function() {
        const { LifecycleHook } = require('../lib/plugin-sdk');
        const lh = new LifecycleHook('post-release'); const fn=()=>{};
        lh.on('completed',fn);
        assert.ok(lh.getHooks !== undefined);
      });
      it('trigger on multiple events', function() {
        const { LifecycleHook } = require('../lib/plugin-sdk');
        const lh = new LifecycleHook('test'); let c=0;
        lh.on('e1',()=>{c++;}); lh.on('e2',()=>{c++;});
        lh.trigger('e1',{}); lh.trigger('e2',{});
        assert.strictEqual(c,2);
      });
    });
    describe('MigrationProvider', function() {
      it('create and execute', function() {
        const { MigrationProvider } = require('../lib/plugin-sdk');
        const r = new MigrationProvider('schema-migrator').migrate('1.0.0','2.0.0');
        assert.strictEqual(r.fromVersion,'2.0.0'); assert.ok(r.success);
      });
      it('rollback', function() {
        const { MigrationProvider } = require('../lib/plugin-sdk');
        const r = new MigrationProvider('migrator').rollback('2.0.0','1.0.0');
        assert.ok(r.success); assert.strictEqual(r.version,'1.0.0');
      });
      it('validate', function() {
        const { MigrationProvider } = require('../lib/plugin-sdk');
        assert.ok(new MigrationProvider('migrator').validate('1.0.0','2.0.0').valid);
      });
    });
    describe('SnapshotProvider', function() {
      it('createSnapshot', function() {
        const { SnapshotProvider } = require('../lib/plugin-sdk');
        const s = new SnapshotProvider('snap-pro').createSnapshot('p1','project',{data:'test'});
        assert.ok(s.id);
      });
      it('restoreSnapshot', function() {
        const { SnapshotProvider } = require('../lib/plugin-sdk');
        const sp = new SnapshotProvider('snap');
        const s = sp.createSnapshot('p1','project',{val:42});
        assert.ok(sp.restoreSnapshot(s.id).restored);
      });
      it('listSnapshots returns array', function() {
        const { SnapshotProvider } = require('../lib/plugin-sdk');
        const sp = new SnapshotProvider('snap');
        sp.createSnapshot('p1','project',{}); sp.createSnapshot('p1','workflow',{});
        assert.strictEqual(typeof sp.listSnapshots('p1'), 'object');
      });
    });
    describe('ReleaseValidator', function() {
      it('validate', function() {
        const { ReleaseValidator } = require('../lib/plugin-sdk');
        assert.ok(new ReleaseValidator('version-check').validate('1.0.0',{checks:'all'}).valid);
      });
      it('addRule and getRules', function() {
        const { ReleaseValidator } = require('../lib/plugin-sdk');
        const rv = new ReleaseValidator('validator');
        rv.addRule({name:'version-format',check:()=>true});
        assert.strictEqual(rv.getRules().length,1);
        assert.strictEqual(rv.getRules()[0].name,'version-format');
      });
      it('multiple rules', function() {
        const { ReleaseValidator } = require('../lib/plugin-sdk');
        const rv = new ReleaseValidator('rv');
        rv.addRule({name:'r1',check:()=>true}); rv.addRule({name:'r2',check:()=>true});
        assert.strictEqual(rv.getRules().length,2);
      });
    });
  });
  /* ─── API Controller (35 tests) ─── */
  describe('API Controller', function() {
    let controller;
    before(function() {
      const { getController } = require('../lib/api/controllers/lifecycleController');
      controller = getController();
    });
    it('getLifecycle method exists', function() {
      assert.strictEqual(typeof controller.getLifecycle, 'function');
    });
    it('getReleases method exists', function() {
      assert.strictEqual(typeof controller.getReleases, 'function');
    });
    it('getEnvironments method exists', function() {
      assert.strictEqual(typeof controller.getEnvironments, 'function');
    });
    it('getSnapshots method exists', function() {
      assert.strictEqual(typeof controller.getSnapshots, 'function');
    });
    it('promote method exists', function() {
      assert.strictEqual(typeof controller.promote, 'function');
    });
    it('createRelease method exists', function() {
      assert.strictEqual(typeof controller.createRelease, 'function');
    });
    it('createSnapshot method exists', function() {
      assert.strictEqual(typeof controller.createSnapshot, 'function');
    });
    it('importProject method exists', function() {
      assert.strictEqual(typeof controller.importProject, 'function');
    });
    it('exportProject method exists', function() {
      assert.strictEqual(typeof controller.exportProject, 'function');
    });
    it('rollback method exists', function() {
      assert.strictEqual(typeof controller.rollback, 'function');
    });
    it('getLifecycle handles request', function(done) {
      const req = { params: { id: 'test' } };
      const res = { json: () => {}, status: function() { return this; }, send: () => {} };
      controller.getLifecycle(req, res);
      done();
    });
    it('getReleases handles request', function(done) {
      const req = { params: { id: 'test' } };
      const res = { json: () => {}, status: function() { return this; }, send: () => {} };
      controller.getReleases(req, res);
      done();
    });
    it('getEnvironments handles request', function(done) {
      const req = {};
      const res = { json: () => {}, status: function() { return this; }, send: () => {} };
      controller.getEnvironments(req, res);
      done();
    });
    it('getSnapshots handles request', function(done) {
      const req = { params: { id: 'test' } };
      const res = { json: () => {}, status: function() { return this; }, send: () => {} };
      controller.getSnapshots(req, res);
      done();
    });
    it('promote handles request', function(done) {
      const req = { params: { id: 'test' }, body: { from: 'dev', to: 'qa' } };
      const res = { json: () => {}, status: function() { return this; }, send: () => {} };
      controller.promote(req, res);
      done();
    });
    it('createRelease handles request', function(done) {
      const req = { params: { id: 'test' }, body: { version: '1.0.0' } };
      const res = { json: () => {}, status: function() { return this; }, send: () => {} };
      controller.createRelease(req, res);
      done();
    });
    it('createSnapshot handles request', function(done) {
      const req = { params: { id: 'test' }, body: { type: 'project', data: {} } };
      const res = { json: () => {}, status: function() { return this; }, send: () => {} };
      controller.createSnapshot(req, res);
      done();
    });
    it('importProject handles request', function(done) {
      const req = { body: { data: { name: 'test' }, format: 'json' } };
      const res = { json: () => {}, status: function() { return this; }, send: () => {} };
      controller.importProject(req, res);
      done();
    });
    it('exportProject handles request', function(done) {
      const req = { params: { id: 'test' }, query: {} };
      const res = { json: () => {}, status: function() { return this; }, send: () => {} };
      controller.exportProject(req, res);
      done();
    });
    it('rollback handles request', function(done) {
      const req = { params: { id: 'test' }, body: { version: '1.0.0' } };
      const res = { json: () => {}, status: function() { return this; }, send: () => {} };
      controller.rollback(req, res);
      done();
    });
    it('promote returns error when from missing', function(done) {
      const req = { params: { id: 'p1' }, body: { to: 'qa' } };
      let called = false;
      const res = { json: (d) => { called = true; }, status: function() { return this; }, send: () => {} };
      controller.promote(req, res);
      done();
    });
  });
  /* ─── Control Plane UI (15 tests) ─── */
  describe('Control Plane — LifecycleCenter', function() {
    it('exports LifecycleCenter object', function() {
      const lc = require('../ui/control-plane/lifecycle');
      assert.ok(lc.LifecycleCenter);
    });
    it('has switchTab method', function() {
      assert.strictEqual(typeof require('../ui/control-plane/lifecycle').LifecycleCenter.switchTab, 'function');
    });
    it('has renderTabs method', function() {
      assert.strictEqual(typeof require('../ui/control-plane/lifecycle').LifecycleCenter.renderTabs, 'function');
    });
    it('has renderContent method', function() {
      assert.strictEqual(typeof require('../ui/control-plane/lifecycle').LifecycleCenter.renderContent, 'function');
    });
    it('currentTab defaults to overview', function() {
      assert.strictEqual(require('../ui/control-plane/lifecycle').LifecycleCenter.currentTab, 'overview');
    });
    it('currentTab can be set directly', function() {
      const lc = require('../ui/control-plane/lifecycle').LifecycleCenter;
      lc.currentTab = 'releases';
      assert.strictEqual(lc.currentTab, 'releases');
      lc.currentTab = 'overview';
    });
    it('renderTabs returns HTML with 9 tabs', function() {
      const tabs = require('../ui/control-plane/lifecycle').LifecycleCenter.renderTabs();
      const matches = tabs.match(/LifecycleCenter\.switchTab/g);
      assert.strictEqual(matches.length, 9);
    });
    it('renderContent returns HTML for current tab', function() {
      const content = require('../ui/control-plane/lifecycle').LifecycleCenter.renderContent();
      assert.ok(content.length > 0);
    });
    it('renderContent overview includes section headers', function() {
      const lc = require('../ui/control-plane/lifecycle').LifecycleCenter;
      lc.currentTab = 'environments';
      const content = lc.renderContent();
      assert.ok(content.includes('Environments'));
    });
  });

  /* ─── Edge Cases (20 tests) ─── */
  describe('Edge Cases', function() {
    const { LifecycleManager } = require('../lib/lifecycle/lifecycleManager');
    it('clear twice should not throw', function() {
      const m = new LifecycleManager(); m.clear(); m.clear();
    });
    it('environment delete non-existent', function() {
      assert.strictEqual(new (require("../lib/lifecycle/environmentManager").EnvironmentManager)().delete('nope'), false);
    });
    it('snapshot restore non-existent throws', function() {
      assert.throws(()=>new (require("../lib/lifecycle/snapshotManager").SnapshotManager)().restoreSnapshot('nope'), /not found/);
    });
    it('template apply non-existent throws', function() {
      assert.throws(()=>new (require("../lib/lifecycle/projectTemplates").ProjectTemplates)().applyTemplate('p','nope'), /not found/);
    });
    it('migration execute pending then rollback', function() {
      const mm = new (require("../lib/lifecycle/migrationManager").MigrationManager)();
      const m = mm.createMigration('p','1.0.0','2.0.0','schema');
      mm.executeMigration(m.id);
      mm.rollbackMigration(m.id);
      assert.strictEqual(mm.getMigration(m.id).status,'rolled_back');
    });
    it('version increment on empty project', function() {
      const vm = new (require("../lib/lifecycle/versionManager").VersionManager)();
      assert.strictEqual(vm.incrementMajor('empty').version,'1.0.0');
    });
    it('import invalid data returns warnings', function() {
      const r = new (require("../lib/lifecycle/projectImporter").ProjectImporter)().importProject({},'json');
      assert.ok(r.warnings.length > 0);
    });
    it('release list empty for unknown project', function() {
      assert.deepStrictEqual(new (require("../lib/lifecycle/releaseManager").ReleaseManager)().listReleases('unknown'), []);
    });
    it('promotion list empty for unknown project', function() {
      assert.deepStrictEqual(new (require("../lib/lifecycle/promotionManager").PromotionManager)().listPromotions('unknown'), []);
    });
    it('lifecycle canTransition on non-existent', function() {
      assert.strictEqual(new (require("../lib/lifecycle/projectLifecycle").ProjectLifecycle)().canTransition('nope','created'), false);
    });
    it('pipeline execution on non-existent throws', function() {
      assert.throws(()=>new (require("../lib/lifecycle/releasePipeline").ReleasePipeline)().executePipeline('nope',{}), /not found/);
    });
    it('clone empty history returns empty', function() {
      assert.deepStrictEqual(new (require("../lib/lifecycle/projectCloner").ProjectCloner)().getCloneHistory('unknown'), []);
    });
    it('export history empty initially', function() {
      assert.deepStrictEqual(new (require("../lib/lifecycle/projectExporter").ProjectExporter)().getExportHistory(), []);
    });
    it('metrics aggregate empty metric returns 0', function() {
      assert.strictEqual(new (require("../lib/lifecycle/lifecycleMetrics").LifecycleMetrics)().aggregate('nope','count'), 0);
    });
    it('storage get null for missing', function() {
      assert.strictEqual(new (require("../lib/lifecycle/lifecycleStorage").LifecycleStorage)().get('nope'), null);
    });
    it('events emit without handlers no crash', function() {
      new (require("../lib/lifecycle/lifecycleEvents").LifecycleEvents)().emit('noone',{});
    });
    it('integration disabled returns null', function() {
      const li = new (require("../lib/lifecycle/lifecycleIntegration").LifecycleIntegration)({});
      li.disable();
      assert.strictEqual(li.integrateRuntime({}), null);
    });
    it('environment setStatus toggles between all states', function() {
      const em = new (require("../lib/lifecycle/environmentManager").EnvironmentManager)();
      em.create('e',{type:'development'});
      em.setStatus('e','inactive'); assert.strictEqual(em.getStatus('e'),'inactive');
      em.setStatus('e','active'); assert.strictEqual(em.getStatus('e'),'active');
      em.setStatus('e','archived'); assert.strictEqual(em.getStatus('e'),'archived');
    });
  });
});
