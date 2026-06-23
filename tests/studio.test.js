const assert = require('assert');
const {
  StudioManager,
  BuildPipeline,
  ProjectManager,
  WorkspaceManager,
  StudioEvents,
  StudioStorage,
  StudioMetrics,
  getDefaultStudioManager
} = require('../lib/studio');

describe('Studio Core', function() {

  describe('StudioManager', function() {
    it('should create a manager with all sub-modules', function() {
      const sm = new StudioManager();
      const s = sm.getStatus();
      assert.strictEqual(s.initialized, true);
      assert(s.initializedAt);
      assert.strictEqual(Object.keys(s.submodules).length, 6);
      assert.strictEqual(s.submodules.buildPipeline, true);
      assert.strictEqual(s.submodules.projectManager, true);
      assert.strictEqual(s.submodules.workspaceManager, true);
      assert.strictEqual(s.submodules.studioEvents, true);
      assert.strictEqual(s.submodules.studioStorage, true);
      assert.strictEqual(s.submodules.studioMetrics, true);
    });
    it('should return getDefaultStudioManager', function() {
      const sm = getDefaultStudioManager();
      assert(sm instanceof StudioManager);
    });
    it('should start a build and return project', function() {
      const sm = new StudioManager();
      const p = sm.startBuild('Build a web app', {});
      assert(p.id);
      assert.strictEqual(p.prompt, 'Build a web app');
      assert.strictEqual(p.status, 'building');
    });
    it('should reject empty prompt', function() {
      const sm = new StudioManager();
      try { sm.startBuild(''); assert.fail('should throw'); } catch (e) {
        assert(e.message.includes('prompt'));
      }
    });
    it('should get build status', function() {
      const sm = new StudioManager();
      const p = sm.startBuild('Test app', {});
      const s = sm.getBuildStatus(p.id);
      assert(s);
      assert.strictEqual(s.projectId, p.id);
    });
    it('should return null for unknown build status', function() {
      const sm = new StudioManager();
      assert.strictEqual(sm.getBuildStatus('nonexistent'), null);
    });
    it('should get build progress', function() {
      const sm = new StudioManager();
      const p = sm.startBuild('Test app', {});
      const pr = sm.getBuildProgress(p.id);
      assert(pr);
      assert.strictEqual(pr.total, 10);
      assert.strictEqual(pr.completed, 0);
    });
    it('should return null for unknown build progress', function() {
      const sm = new StudioManager();
      assert.strictEqual(sm.getBuildProgress('nonexistent'), null);
    });
    it('should list projects', async function() {
      const sm = new StudioManager();
      await sm.startBuild('Project 1', {});
      await sm.startBuild('Project 2', {});
      assert.strictEqual(sm.listProjects().length, 2);
    });
    it('should list projects with filter', async function() {
      const sm = new StudioManager();
      await sm.startBuild('Project 1', {});
      const filtered = sm.listProjects({ status: 'building' });
      assert.strictEqual(filtered.length, 1);
    });
    it('should get project by id', async function() {
      const sm = new StudioManager();
      const p = await sm.startBuild('Test', {});
      const g = sm.getProject(p.id);
      assert(g);
      assert.strictEqual(g.id, p.id);
    });
    it('should return null for unknown project', function() {
      const sm = new StudioManager();
      assert.strictEqual(sm.getProject('unknown'), null);
    });
    it('should get workspace for project', async function() {
      const sm = new StudioManager();
      const p = await sm.startBuild('Test', {});
      const ws = sm.getWorkspace(p.id);
      assert(ws === null);
    });
    it('should get status', function() {
      const sm = new StudioManager();
      const s = sm.getStatus();
      assert(s.initialized);
      assert(s.initializedAt);
      assert(s.submodules);
    });
    it('should clear all state', async function() {
      const sm = new StudioManager();
      await sm.startBuild('Test', {});
      sm.clear();
      assert.strictEqual(sm.listProjects().length, 0);
    });
    it('should have buildPipeline getter', function() {
      const sm = new StudioManager();
      assert(sm.buildPipeline instanceof BuildPipeline);
    });
    it('should have projectManager getter', function() {
      const sm = new StudioManager();
      assert(sm.projectManager instanceof ProjectManager);
    });
    it('should have workspaceManager getter', function() {
      const sm = new StudioManager();
      assert(sm.workspaceManager instanceof WorkspaceManager);
    });
    it('should have studioEvents getter', function() {
      const sm = new StudioManager();
      assert(sm.studioEvents instanceof StudioEvents);
    });
    it('should have studioStorage getter', function() {
      const sm = new StudioManager();
      assert(sm.studioStorage instanceof StudioStorage);
    });
    it('should have studioMetrics getter', function() {
      const sm = new StudioManager();
      assert(sm.studioMetrics instanceof StudioMetrics);
    });
  });

  describe('StudioManager — build pipeline integration', function() {
    it('should advance pipeline stage', function() {
      const sm = new StudioManager();
      const p = sm.startBuild('Test', {});
      const buildId = sm._getBuildId(p.id);
      const b = sm.buildPipeline.advance(buildId, 'conversation');
      assert(b);
      assert.strictEqual(b.currentStage, 'conversation');
    });
    it('should complete pipeline stage', function() {
      const sm = new StudioManager();
      const p = sm.startBuild('Test', {});
      const buildId = sm._getBuildId(p.id);
      sm.buildPipeline.advance(buildId, 'conversation');
      const b = sm.buildPipeline.completeStage(buildId, 'conversation');
      assert(b);
      assert.strictEqual(b.stages[0].status, 'completed');
    });
    it('should fail pipeline stage', function() {
      const sm = new StudioManager();
      const p = sm.startBuild('Test', {});
      const buildId = sm._getBuildId(p.id);
      sm.buildPipeline.advance(buildId, 'conversation');
      const b = sm.buildPipeline.failStage(buildId, 'conversation', 'error occurred');
      assert(b);
      assert.strictEqual(b.status, 'failed');
    });
  });

  describe('BuildPipeline', function() {
    it('should have 10 stages', function() {
      assert.strictEqual(BuildPipeline.STAGES.length, 10);
      assert.deepStrictEqual(BuildPipeline.STAGES, [
        'conversation', 'questions', 'context', 'architecture',
        'knowledge', 'composer', 'generator', 'evaluation',
        'deployment', 'workspace'
      ]);
    });
    it('should start a build', function() {
      const bp = new BuildPipeline();
      const b = bp.start('proj_1', 'Test prompt');
      assert(b.id);
      assert.strictEqual(b.projectId, 'proj_1');
      assert.strictEqual(b.prompt, 'Test prompt');
      assert.strictEqual(b.status, 'pending');
      assert.strictEqual(b.stages.length, 10);
      assert.strictEqual(b.progress, 0);
      assert(b.startedAt);
      assert.strictEqual(b.completedAt, null);
    });
    it('should start build with options', function() {
      const bp = new BuildPipeline();
      const b = bp.start('proj_1', 'Test', { fast: true });
      assert.strictEqual(b.options.fast, true);
    });
    it('should reject missing projectId', function() {
      const bp = new BuildPipeline();
      try { bp.start(); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should reject missing prompt', function() {
      const bp = new BuildPipeline();
      try { bp.start('proj_1'); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should advance to conversation stage', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      const b = bp.advance('build_1', 'conversation');
      assert(b);
      assert.strictEqual(b.currentStage, 'conversation');
      assert.strictEqual(b.stages[0].status, 'running');
      assert(b.stages[0].startedAt);
    });
    it('should advance through all stages sequentially', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      const stages = BuildPipeline.STAGES;
      for (let i = 0; i < stages.length; i++) {
        if (i > 0) bp.completeStage('build_1', stages[i - 1]);
        const b = bp.advance('build_1', stages[i]);
        assert(b, 'Failed to advance to ' + stages[i]);
        assert.strictEqual(b.currentStage, stages[i]);
        if (i > 0) {
          assert.strictEqual(b.stages[i - 1].status, 'completed');
          assert(b.stages[i - 1].completedAt);
        }
      }
      assert.strictEqual(bp.getStatus('build_1').currentStage, 'workspace');
    });
    it('should complete a stage', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      bp.advance('build_1', 'conversation');
      const b = bp.completeStage('build_1', 'conversation', { result: 'done' });
      assert(b);
      assert.strictEqual(b.stages[0].status, 'completed');
      assert(b.stages[0].completedAt);
      assert.deepStrictEqual(b.stages[0].data, { result: 'done' });
    });
    it('should mark build completed after workspace stage', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      const stages = BuildPipeline.STAGES;
      for (let i = 0; i < stages.length; i++) {
        bp.advance('build_1', stages[i]);
        bp.completeStage('build_1', stages[i], {});
      }
      const b = bp.getStatus('build_1');
      assert.strictEqual(b.status, 'completed');
      assert(b.completedAt);
    });
    it('should mark build progress at 100% after completion', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      const stages = BuildPipeline.STAGES;
      for (let i = 0; i < stages.length; i++) {
        bp.advance('build_1', stages[i]);
        bp.completeStage('build_1', stages[i], {});
      }
      const pr = bp.getProgress('build_1');
      assert.strictEqual(pr.percent, 100);
    });
    it('should fail a stage', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      bp.advance('build_1', 'conversation');
      const b = bp.failStage('build_1', 'conversation', 'something went wrong');
      assert(b);
      assert.strictEqual(b.status, 'failed');
      assert.strictEqual(b.stages[0].status, 'failed');
      assert.strictEqual(b.stages[0].error, 'something went wrong');
    });
    it('should fail a stage with default error', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      bp.advance('build_1', 'conversation');
      const b = bp.failStage('build_1', 'conversation');
      assert.strictEqual(b.stages[0].error, 'unknown error');
    });
    it('should return null for advance on unknown build', function() {
      const bp = new BuildPipeline();
      assert.strictEqual(bp.advance('unknown', 'conversation'), null);
    });
    it('should return null for complete on unknown build', function() {
      const bp = new BuildPipeline();
      assert.strictEqual(bp.completeStage('unknown', 'conversation'), null);
    });
    it('should return null for fail on unknown build', function() {
      const bp = new BuildPipeline();
      assert.strictEqual(bp.failStage('unknown', 'conversation'), null);
    });
    it('should return null for advance on invalid stage name', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      assert.strictEqual(bp.advance('build_1', 'invalid_stage'), null);
    });
    it('should reject skipping stages', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      const b = bp.advance('build_1', 'generator');
      assert.strictEqual(b, null);
    });
    it('should reject going backward', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      bp.advance('build_1', 'conversation');
      bp.completeStage('build_1', 'conversation');
      bp.advance('build_1', 'questions');
      const b = bp.advance('build_1', 'conversation');
      assert.strictEqual(b, null);
    });
    it('should get status', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      bp.advance('build_1', 'conversation');
      const s = bp.getStatus('build_1');
      assert(s);
      assert.strictEqual(s.id, 'build_1');
      assert.strictEqual(s.projectId, 'proj_1');
      assert.strictEqual(s.currentStage, 'conversation');
      assert.strictEqual(s.stages.length, 10);
      assert(s.startedAt);
    });
    it('should return null for unknown status', function() {
      const bp = new BuildPipeline();
      assert.strictEqual(bp.getStatus('unknown'), null);
    });
    it('should get progress', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      bp.advance('build_1', 'conversation');
      bp.completeStage('build_1', 'conversation');
      const pr = bp.getProgress('build_1');
      assert(pr);
      assert.strictEqual(pr.completed, 1);
      assert.strictEqual(pr.total, 10);
      assert.strictEqual(pr.percent, 10);
    });
    it('should return null for unknown progress', function() {
      const bp = new BuildPipeline();
      assert.strictEqual(bp.getProgress('unknown'), null);
    });
    it('should list all builds', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      bp.start('proj_2', 'Test 2');
      assert.strictEqual(bp.list().length, 2);
    });
    it('should list builds by project id', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      bp.start('proj_2', 'Test 2');
      assert.strictEqual(bp.list('proj_1').length, 1);
      assert.strictEqual(bp.list('proj_2').length, 1);
    });
    it('should clear all builds', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      bp.clear();
      assert.strictEqual(bp.list().length, 0);
    });
    it('should update progress when completing stage', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      const stages = BuildPipeline.STAGES;
      for (let i = 0; i < stages.length; i++) {
        bp.advance('build_1', stages[i]);
        bp.completeStage('build_1', stages[i], {});
        const pr = bp.getProgress('build_1');
        assert.strictEqual(pr.completed, i + 1);
      }
    });
    it('should advance with data', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      const b = bp.advance('build_1', 'conversation', { messages: [] });
      assert.deepStrictEqual(b.stages[0].data, { messages: [] });
    });
    it('should preserve data when completing stage without new data', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'Test');
      bp.advance('build_1', 'conversation', { messages: [] });
      const b = bp.completeStage('build_1', 'conversation');
      assert.deepStrictEqual(b.stages[0].data, { messages: [] });
    });
    it('should increment build counter', function() {
      const bp = new BuildPipeline();
      const b1 = bp.start('p1', 'Test');
      const b2 = bp.start('p2', 'Test');
      assert.notStrictEqual(b1.id, b2.id);
    });
    it('should reset counter on clear', function() {
      const bp = new BuildPipeline();
      bp.start('p1', 'Test');
      bp.clear();
      const b = bp.start('p2', 'Test');
      assert.strictEqual(b.id, 'build_1');
    });
  });

  describe('ProjectManager', function() {
    it('should create a project', function() {
      const pm = new ProjectManager();
      const p = pm.create({ prompt: 'Build a web app' });
      assert(p.id);
      assert(p.id.startsWith('proj_'));
      assert.strictEqual(p.prompt, 'Build a web app');
      assert.strictEqual(p.status, 'draft');
      assert(p.createdAt);
      assert(p.updatedAt);
    });
    it('should create project with all fields', function() {
      const pm = new ProjectManager();
      const p = pm.create({ prompt: 'Test', name: 'My App', status: 'building', buildId: 'build_1', architectureId: 'arch_1', compositionId: 'comp_1', deploymentId: 'dep_1', previewUrl: 'https://preview.com', liveUrl: 'https://live.com' });
      assert.strictEqual(p.name, 'My App');
      assert.strictEqual(p.status, 'building');
      assert.strictEqual(p.buildId, 'build_1');
      assert.strictEqual(p.architectureId, 'arch_1');
      assert.strictEqual(p.compositionId, 'comp_1');
      assert.strictEqual(p.deploymentId, 'dep_1');
      assert.strictEqual(p.previewUrl, 'https://preview.com');
      assert.strictEqual(p.liveUrl, 'https://live.com');
    });
    it('should reject missing data', function() {
      const pm = new ProjectManager();
      try { pm.create(); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should reject missing prompt', function() {
      const pm = new ProjectManager();
      try { pm.create({}); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should auto-name from prompt', function() {
      const pm = new ProjectManager();
      const p = pm.create({ prompt: 'Build a customer portal' });
      assert(p.name.startsWith('Build a customer portal'));
    });
    it('should get a project by id', function() {
      const pm = new ProjectManager();
      const p = pm.create({ prompt: 'Test' });
      const g = pm.get(p.id);
      assert(g);
      assert.strictEqual(g.id, p.id);
    });
    it('should return null for unknown project', function() {
      const pm = new ProjectManager();
      assert.strictEqual(pm.get('unknown'), null);
    });
    it('should return null for empty id', function() {
      const pm = new ProjectManager();
      assert.strictEqual(pm.get(''), null);
    });
    it('should update a project', function() {
      const pm = new ProjectManager();
      const p = pm.create({ prompt: 'Test' });
      const u = pm.update(p.id, { status: 'completed' });
      assert(u);
      assert.strictEqual(u.status, 'completed');
      assert(u.updatedAt >= p.createdAt);
    });
    it('should return null updating unknown project', function() {
      const pm = new ProjectManager();
      assert.strictEqual(pm.update('unknown', { status: 'completed' }), null);
    });
    it('should list projects', function() {
      const pm = new ProjectManager();
      pm.create({ prompt: 'A' });
      pm.create({ prompt: 'B' });
      assert.strictEqual(pm.list().length, 2);
    });
    it('should list projects sorted by createdAt desc', function() {
      const pm = new ProjectManager();
      pm.create({ prompt: 'A' });
      pm.create({ prompt: 'B' });
      const list = pm.list();
      assert(new Date(list[0].createdAt) >= new Date(list[1].createdAt));
    });
    it('should list projects with status filter', function() {
      const pm = new ProjectManager();
      pm.create({ prompt: 'A', status: 'completed' });
      pm.create({ prompt: 'B', status: 'building' });
      assert.strictEqual(pm.list({ status: 'completed' }).length, 1);
      assert.strictEqual(pm.list({ status: 'building' }).length, 1);
      assert.strictEqual(pm.list({ status: 'draft' }).length, 0);
    });
    it('should remove a project', function() {
      const pm = new ProjectManager();
      const p = pm.create({ prompt: 'Test' });
      assert(pm.remove(p.id));
      assert.strictEqual(pm.get(p.id), null);
    });
    it('should return false removing unknown project', function() {
      const pm = new ProjectManager();
      assert.strictEqual(pm.remove('unknown'), false);
    });
    it('should count projects', function() {
      const pm = new ProjectManager();
      assert.strictEqual(pm.count(), 0);
      pm.create({ prompt: 'A' });
      assert.strictEqual(pm.count(), 1);
      pm.create({ prompt: 'B' });
      assert.strictEqual(pm.count(), 2);
    });
    it('should clear all projects', function() {
      const pm = new ProjectManager();
      pm.create({ prompt: 'A' });
      pm.create({ prompt: 'B' });
      pm.clear();
      assert.strictEqual(pm.count(), 0);
    });
    it('should reset counter on clear', function() {
      const pm = new ProjectManager();
      pm.create({ prompt: 'A' });
      pm.clear();
      const p = pm.create({ prompt: 'B' });
      assert.strictEqual(p.id, 'proj_1');
    });
    it('should update only specified fields', function() {
      const pm = new ProjectManager();
      const p = pm.create({ prompt: 'Test', name: 'Original' });
      pm.update(p.id, { status: 'completed' });
      const g = pm.get(p.id);
      assert.strictEqual(g.name, 'Original');
      assert.strictEqual(g.status, 'completed');
    });
  });

  describe('WorkspaceManager', function() {
    it('should create a workspace', function() {
      const wm = new WorkspaceManager();
      const ws = wm.create('proj_1');
      assert(ws.id);
      assert(ws.id.startsWith('ws_'));
      assert.strictEqual(ws.projectId, 'proj_1');
      assert.deepStrictEqual(ws.files, []);
      assert.strictEqual(ws.status, 'active');
      assert(ws.createdAt);
    });
    it('should create workspace with data', function() {
      const wm = new WorkspaceManager();
      const ws = wm.create('proj_1', { files: [{ path: 'index.js' }], env: { NODE_ENV: 'prod' }, config: { port: 3000 } });
      assert.strictEqual(ws.files.length, 1);
      assert.strictEqual(ws.env.NODE_ENV, 'prod');
      assert.strictEqual(ws.config.port, 3000);
    });
    it('should reject missing projectId', function() {
      const wm = new WorkspaceManager();
      try { wm.create(); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should get workspace by project id', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      assert(wm.get('proj_1'));
    });
    it('should return null for unknown project', function() {
      const wm = new WorkspaceManager();
      assert.strictEqual(wm.get('nonexistent'), null);
    });
    it('should return null for empty projectId', function() {
      const wm = new WorkspaceManager();
      assert.strictEqual(wm.get(''), null);
    });
    it('should add file to workspace', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      const ws = wm.addFile('proj_1', { path: 'src/index.js', content: '// code' });
      assert(ws);
      assert.strictEqual(ws.files.length, 1);
      assert.strictEqual(ws.files[0].path, 'src/index.js');
      assert(ws.files[0].addedAt);
    });
    it('should return null adding file to unknown project', function() {
      const wm = new WorkspaceManager();
      assert.strictEqual(wm.addFile('unknown', { path: 'f.js' }), null);
    });
    it('should return null adding file with missing args', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      assert.strictEqual(wm.addFile('proj_1', null), null);
      assert.strictEqual(wm.addFile(null, { path: 'f.js' }), null);
    });
    it('should update workspace', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      const ws = wm.update('proj_1', { status: 'archived' });
      assert(ws);
      assert.strictEqual(ws.status, 'archived');
    });
    it('should return null updating unknown project', function() {
      const wm = new WorkspaceManager();
      assert.strictEqual(wm.update('unknown', { status: 'archived' }), null);
    });
    it('should remove workspace', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      assert(wm.remove('proj_1'));
      assert.strictEqual(wm.get('proj_1'), null);
    });
    it('should return false removing unknown project', function() {
      const wm = new WorkspaceManager();
      assert.strictEqual(wm.remove('unknown'), false);
    });
    it('should list all workspaces', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      wm.create('proj_2');
      assert.strictEqual(wm.list().length, 2);
    });
    it('should clear all workspaces', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      wm.clear();
      assert.strictEqual(wm.list().length, 0);
    });
    it('should reset counter on clear', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      wm.clear();
      assert.strictEqual(wm.create('proj_2').id, 'ws_1');
    });
  });

  describe('StudioEvents', function() {
    it('should have all event types', function() {
      const evts = StudioEvents.EVENTS;
      assert(evts.BUILD_STARTED);
      assert(evts.STAGE_ADVANCED);
      assert(evts.STAGE_COMPLETED);
      assert(evts.STAGE_FAILED);
      assert(evts.BUILD_COMPLETED);
      assert(evts.BUILD_FAILED);
      assert(evts.PROJECT_CREATED);
      assert(evts.PROJECT_UPDATED);
      assert(evts.WORKSPACE_UPDATED);
      assert.strictEqual(Object.keys(evts).length, 9);
    });
    it('should register and emit events', function() {
      const ev = new StudioEvents();
      let called = false;
      ev.on('test:event', () => { called = true; });
      ev.emit('test:event');
      assert(called);
    });
    it('should emit with args', function() {
      const ev = new StudioEvents();
      let result = null;
      ev.on('test', (a, b) => { result = a + b; });
      ev.emit('test', 1, 2);
      assert.strictEqual(result, 3);
    });
    it('should return false if no listeners', function() {
      const ev = new StudioEvents();
      assert.strictEqual(ev.emit('nonexistent'), false);
    });
    it('should return true if listeners exist', function() {
      const ev = new StudioEvents();
      ev.on('test', () => {});
      assert.strictEqual(ev.emit('test'), true);
    });
    it('should remove a listener', function() {
      const ev = new StudioEvents();
      let count = 0;
      const fn = () => { count++; };
      ev.on('test', fn);
      ev.emit('test');
      assert.strictEqual(count, 1);
      ev.off('test', fn);
      ev.emit('test');
      assert.strictEqual(count, 1);
    });
    it('should handle off with no listeners', function() {
      const ev = new StudioEvents();
      ev.off('test', () => {});
    });
    it('should handle off with no matching listener', function() {
      const ev = new StudioEvents();
      ev.on('test', () => {});
      ev.off('test', () => {});
    });
    it('should handle error in listener gracefully', function() {
      const ev = new StudioEvents();
      ev.on('test', () => { throw new Error('bad'); });
      ev.on('test', () => {});
      ev.emit('test');
    });
    it('should list registered events', function() {
      const ev = new StudioEvents();
      ev.on('a', () => {});
      ev.on('b', () => {});
      const list = ev.listEvents();
      assert(list.includes('a'));
      assert(list.includes('b'));
    });
    it('should reject invalid event name', function() {
      const ev = new StudioEvents();
      try { ev.on('', () => {}); assert.fail('should throw'); } catch (e) { assert(e); }
      try { ev.on(null, () => {}); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should reject non-function listener', function() {
      const ev = new StudioEvents();
      try { ev.on('test', 'not a function'); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should reject invalid emit', function() {
      const ev = new StudioEvents();
      try { ev.emit(''); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should allow multiple listeners', function() {
      const ev = new StudioEvents();
      let c1 = 0, c2 = 0;
      ev.on('test', () => { c1++; });
      ev.on('test', () => { c2++; });
      ev.emit('test');
      assert.strictEqual(c1, 1);
      assert.strictEqual(c2, 1);
    });
    it('should clear all listeners', function() {
      const ev = new StudioEvents();
      ev.on('test', () => {});
      ev.clear();
      assert.strictEqual(ev.listEvents().length, 0);
    });
    it('should chain on calls', function() {
      const ev = new StudioEvents();
      const ret = ev.on('test', () => {});
      assert.strictEqual(ret, ev);
    });
  });

  describe('StudioStorage', function() {
    it('should set and get values', function() {
      const ss = new StudioStorage();
      ss.set('key1', 'value1');
      assert.strictEqual(ss.get('key1'), 'value1');
    });
    it('should return null for missing key', function() {
      const ss = new StudioStorage();
      assert.strictEqual(ss.get('nonexistent'), null);
    });
    it('should return null for null key', function() {
      const ss = new StudioStorage();
      assert.strictEqual(ss.get(null), null);
    });
    it('should return null for undefined key', function() {
      const ss = new StudioStorage();
      assert.strictEqual(ss.get(undefined), null);
    });
    it('should handle has', function() {
      const ss = new StudioStorage();
      ss.set('key1', 'val');
      assert(ss.has('key1'));
      assert(!ss.has('nonexistent'));
    });
    it('should handle has with null', function() {
      const ss = new StudioStorage();
      assert(!ss.has(null));
    });
    it('should delete values', function() {
      const ss = new StudioStorage();
      ss.set('key1', 'val');
      assert(ss.delete('key1'));
      assert(!ss.has('key1'));
    });
    it('should return false deleting missing key', function() {
      const ss = new StudioStorage();
      assert(!ss.delete('nonexistent'));
    });
    it('should return false deleting null', function() {
      const ss = new StudioStorage();
      assert(!ss.delete(null));
    });
    it('should return all items', function() {
      const ss = new StudioStorage();
      ss.set('a', 1);
      ss.set('b', 2);
      const all = ss.getAll();
      assert.deepStrictEqual(all, { a: 1, b: 2 });
    });
    it('should return size', function() {
      const ss = new StudioStorage();
      assert.strictEqual(ss.size(), 0);
      ss.set('a', 1);
      assert.strictEqual(ss.size(), 1);
      ss.set('b', 2);
      assert.strictEqual(ss.size(), 2);
    });
    it('should clear all items', function() {
      const ss = new StudioStorage();
      ss.set('a', 1);
      ss.set('b', 2);
      ss.clear();
      assert.strictEqual(ss.size(), 0);
    });
    it('should handle object values', function() {
      const ss = new StudioStorage();
      const obj = { foo: 'bar' };
      ss.set('obj', obj);
      assert.deepStrictEqual(ss.get('obj'), obj);
    });
    it('should handle number keys', function() {
      const ss = new StudioStorage();
      ss.set(42, 'answer');
      assert.strictEqual(ss.get('42'), 'answer');
    });
    it('should return this from set', function() {
      const ss = new StudioStorage();
      const ret = ss.set('a', 1);
      assert.strictEqual(ret, ss);
    });
    it('should overwrite existing value', function() {
      const ss = new StudioStorage();
      ss.set('key', 'old');
      ss.set('key', 'new');
      assert.strictEqual(ss.get('key'), 'new');
    });
    it('should be empty after clear', function() {
      const ss = new StudioStorage();
      ss.set('a', 1);
      ss.clear();
      assert.strictEqual(ss.size(), 0);
      assert.strictEqual(ss.get('a'), null);
    });
    it('should handle setting and getting independently', function() {
      const ss = new StudioStorage();
      ss.set('a', 1);
      ss.set('b', 2);
      assert.strictEqual(ss.get('a'), 1);
      assert.strictEqual(ss.get('b'), 2);
    });
  });

  describe('StudioMetrics', function() {
    it('should record a metric', function() {
      const sm = new StudioMetrics();
      const e = sm.record('build_time', 1234, { stage: 'conversation' });
      assert(e);
      assert.strictEqual(e.name, 'build_time');
      assert.strictEqual(e.value, 1234);
      assert.deepStrictEqual(e.tags, { stage: 'conversation' });
      assert(e.timestamp);
    });
    it('should reject missing name', function() {
      const sm = new StudioMetrics();
      try { sm.record(); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should reject missing value', function() {
      const sm = new StudioMetrics();
      try { sm.record('test'); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should reject null value', function() {
      const sm = new StudioMetrics();
      try { sm.record('test', null); assert.fail('should throw'); } catch (e) { assert(e); }
    });
    it('should query by name', function() {
      const sm = new StudioMetrics();
      sm.record('latency', 100);
      sm.record('latency', 200);
      sm.record('throughput', 50);
      const entries = sm.query('latency');
      assert.strictEqual(entries.length, 2);
    });
    it('should return empty for unknown name', function() {
      const sm = new StudioMetrics();
      assert.deepStrictEqual(sm.query('unknown'), []);
    });
    it('should return empty for empty name', function() {
      const sm = new StudioMetrics();
      assert.deepStrictEqual(sm.query(''), []);
    });
    it('should aggregate with sum', function() {
      const sm = new StudioMetrics();
      sm.record('cost', 10);
      sm.record('cost', 20);
      sm.record('cost', 30);
      assert.strictEqual(sm.aggregate('cost'), 60);
    });
    it('should aggregate with custom fn', function() {
      const sm = new StudioMetrics();
      sm.record('latency', 100);
      sm.record('latency', 200);
      const avg = sm.aggregate('latency', vals => vals.reduce((a, b) => a + b, 0) / vals.length);
      assert.strictEqual(avg, 150);
    });
    it('should return null aggregating unknown', function() {
      const sm = new StudioMetrics();
      assert.strictEqual(sm.aggregate('unknown'), null);
    });
    it('should return null aggregating with no entries', function() {
      const sm = new StudioMetrics();
      assert.strictEqual(sm.aggregate('unknown', () => 42), null);
    });
    it('should get metric names', function() {
      const sm = new StudioMetrics();
      sm.record('a', 1);
      sm.record('b', 2);
      sm.record('a', 3);
      const names = sm.getMetricNames();
      assert(names.includes('a'));
      assert(names.includes('b'));
      assert.strictEqual(names.length, 2);
    });
    it('should clear all metrics', function() {
      const sm = new StudioMetrics();
      sm.record('a', 1);
      sm.clear();
      assert.deepStrictEqual(sm.query('a'), []);
    });
    it('should record with default empty tags', function() {
      const sm = new StudioMetrics();
      const e = sm.record('test', 42);
      assert.deepStrictEqual(e.tags, {});
    });
    it('should record timestamps', function() {
      const sm = new StudioMetrics();
      const before = new Date();
      const e = sm.record('test', 1);
      const after = new Date();
      const ts = new Date(e.timestamp);
      assert(ts >= before && ts <= after);
    });
  });

  describe('Studio Events — specific event types', function() {
    it('should emit BUILD_STARTED', function() {
      const ev = new StudioEvents();
      let fired = false;
      ev.on(StudioEvents.EVENTS.BUILD_STARTED, () => { fired = true; });
      ev.emit(StudioEvents.EVENTS.BUILD_STARTED, { projectId: 'proj_1' });
      assert(fired);
    });
    it('should emit STAGE_ADVANCED', function() {
      const ev = new StudioEvents();
      let data = null;
      ev.on(StudioEvents.EVENTS.STAGE_ADVANCED, (d) => { data = d; });
      ev.emit(StudioEvents.EVENTS.STAGE_ADVANCED, { stage: 'architecture' });
      assert.strictEqual(data.stage, 'architecture');
    });
    it('should emit STAGE_COMPLETED', function() {
      const ev = new StudioEvents();
      let fired = false;
      ev.on(StudioEvents.EVENTS.STAGE_COMPLETED, () => { fired = true; });
      ev.emit(StudioEvents.EVENTS.STAGE_COMPLETED, { stage: 'generator' });
      assert(fired);
    });
    it('should emit STAGE_FAILED', function() {
      const ev = new StudioEvents();
      let fired = false;
      ev.on(StudioEvents.EVENTS.STAGE_FAILED, () => { fired = true; });
      ev.emit(StudioEvents.EVENTS.STAGE_FAILED, { stage: 'evaluation', error: 'test failed' });
      assert(fired);
    });
    it('should emit BUILD_COMPLETED', function() {
      const ev = new StudioEvents();
      let fired = false;
      ev.on(StudioEvents.EVENTS.BUILD_COMPLETED, () => { fired = true; });
      ev.emit(StudioEvents.EVENTS.BUILD_COMPLETED, { projectId: 'proj_1' });
      assert(fired);
    });
    it('should emit BUILD_FAILED', function() {
      const ev = new StudioEvents();
      let fired = false;
      ev.on(StudioEvents.EVENTS.BUILD_FAILED, () => { fired = true; });
      ev.emit(StudioEvents.EVENTS.BUILD_FAILED, { projectId: 'proj_1' });
      assert(fired);
    });
    it('should emit PROJECT_CREATED', function() {
      const ev = new StudioEvents();
      let fired = false;
      ev.on(StudioEvents.EVENTS.PROJECT_CREATED, () => { fired = true; });
      ev.emit(StudioEvents.EVENTS.PROJECT_CREATED, { projectId: 'proj_1' });
      assert(fired);
    });
    it('should emit PROJECT_UPDATED', function() {
      const ev = new StudioEvents();
      let fired = false;
      ev.on(StudioEvents.EVENTS.PROJECT_UPDATED, () => { fired = true; });
      ev.emit(StudioEvents.EVENTS.PROJECT_UPDATED, { projectId: 'proj_1' });
      assert(fired);
    });
    it('should emit WORKSPACE_UPDATED', function() {
      const ev = new StudioEvents();
      let fired = false;
      ev.on(StudioEvents.EVENTS.WORKSPACE_UPDATED, () => { fired = true; });
      ev.emit(StudioEvents.EVENTS.WORKSPACE_UPDATED, { projectId: 'proj_1' });
      assert(fired);
    });
  });

  describe('BuildPipeline — edge cases', function() {
    it('should handle completeStage on already completed stage', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'test');
      bp.advance('build_1', 'conversation');
      bp.completeStage('build_1', 'conversation');
      const b = bp.completeStage('build_1', 'conversation');
      assert(b);
    });
    it('should handle multiple advances to same stage', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'test');
      bp.advance('build_1', 'conversation');
      bp.advance('build_1', 'conversation');
      assert.strictEqual(bp.getStatus('build_1').currentStage, 'conversation');
    });
    it('should track progress correctly after each stage', function() {
      const bp = new BuildPipeline();
      bp.start('proj_1', 'test');
      for (let i = 0; i < 5; i++) {
        bp.advance('build_1', BuildPipeline.STAGES[i]);
        bp.completeStage('build_1', BuildPipeline.STAGES[i]);
      }
      const pr = bp.getProgress('build_1');
      assert.strictEqual(pr.percent, 50);
      assert.strictEqual(pr.completed, 5);
    });
    it('should handle empty list', function() {
      const bp = new BuildPipeline();
      assert.deepStrictEqual(bp.list(), []);
    });
  });

  describe('ProjectManager — edge cases', function() {
    it('should auto-generate name from long prompt', function() {
      const pm = new ProjectManager();
      const longPrompt = 'A'.repeat(200);
      const p = pm.create({ prompt: longPrompt });
      assert(p.name.length <= 53);
    });
    it('should handle empty filter object', function() {
      const pm = new ProjectManager();
      pm.create({ prompt: 'A' });
      assert.strictEqual(pm.list({}).length, 1);
    });
    it('should handle multiple updates', function() {
      const pm = new ProjectManager();
      const p = pm.create({ prompt: 'Test' });
      pm.update(p.id, { status: 'building' });
      pm.update(p.id, { status: 'completed' });
      pm.update(p.id, { previewUrl: 'https://example.com' });
      const g = pm.get(p.id);
      assert.strictEqual(g.status, 'completed');
      assert.strictEqual(g.previewUrl, 'https://example.com');
    });
  });

  describe('WorkspaceManager — edge cases', function() {
    it('should add multiple files', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      wm.addFile('proj_1', { path: 'a.js' });
      wm.addFile('proj_1', { path: 'b.js' });
      wm.addFile('proj_1', { path: 'c.js' });
      const ws = wm.get('proj_1');
      assert.strictEqual(ws.files.length, 3);
    });
    it('should update updatedAt on file add', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      const ws1 = wm.get('proj_1');
      const t1 = ws1.updatedAt;
      wm.addFile('proj_1', { path: 'a.js' });
      const ws2 = wm.get('proj_1');
      assert(ws2.updatedAt >= t1);
    });
    it('should handle status transitions', function() {
      const wm = new WorkspaceManager();
      wm.create('proj_1');
      wm.update('proj_1', { status: 'active' });
      wm.update('proj_1', { status: 'archived' });
      wm.update('proj_1', { status: 'deleted' });
      assert.strictEqual(wm.get('proj_1').status, 'deleted');
    });
  });

  describe('Studio index', function() {
    it('should export all classes', function() {
      const index = require('../lib/studio');
      assert(index.StudioManager);
      assert(index.BuildPipeline);
      assert(index.ProjectManager);
      assert(index.WorkspaceManager);
      assert(index.StudioEvents);
      assert(index.StudioStorage);
      assert(index.StudioMetrics);
      assert(index.getDefaultStudioManager);
    });
    it('getDefaultStudioManager returns instance', function() {
      const index = require('../lib/studio');
      const sm = index.getDefaultStudioManager();
      assert(sm instanceof index.StudioManager);
    });
  });

  describe('StudioManager — full integration', function() {
    it('should execute full pipeline lifecycle', function() {
      const sm = new StudioManager();
      const p = sm.startBuild('Build a full-stack app', {});
      assert(p.id);
      assert.strictEqual(p.status, 'building');
      const buildId = sm._getBuildId(p.id);
      const stages = BuildPipeline.STAGES;
      for (let i = 0; i < stages.length; i++) {
        sm.buildPipeline.advance(buildId, stages[i]);
        sm.buildPipeline.completeStage(buildId, stages[i]);
      }
      const status = sm.getBuildStatus(p.id);
      assert.strictEqual(status.status, 'completed');
      assert(status.completedAt);
      const progress = sm.getBuildProgress(p.id);
      assert.strictEqual(progress.percent, 100);
    });
    it('should record metrics during pipeline execution', function() {
      const sm = new StudioManager();
      const p = sm.startBuild('Metrics test', {});
      const buildId = sm._getBuildId(p.id);
      sm.studioMetrics.record('build_started', Date.now(), { projectId: p.id });
      sm.buildPipeline.advance(buildId, 'conversation');
      sm.studioMetrics.record('stage_advanced', Date.now(), { stage: 'conversation' });
      sm.buildPipeline.completeStage(buildId, 'conversation');
      sm.studioMetrics.record('stage_completed', Date.now(), { stage: 'conversation' });
      const metrics = sm.studioMetrics.query('stage_completed');
      assert.strictEqual(metrics.length, 1);
      assert.strictEqual(metrics[0].tags.stage, 'conversation');
    });
    it('should fire events during pipeline execution', function() {
      const sm = new StudioManager();
      const events = [];
      sm.studioEvents.on(StudioEvents.EVENTS.STAGE_ADVANCED, (d) => events.push('advanced:' + d.stage));
      sm.studioEvents.on(StudioEvents.EVENTS.STAGE_COMPLETED, (d) => events.push('completed:' + d.stage));
      const p = sm.startBuild('Event test', {});
      const buildId = sm._getBuildId(p.id);
      sm.buildPipeline.advance(buildId, 'conversation');
      sm.studioEvents.emit(StudioEvents.EVENTS.STAGE_ADVANCED, { stage: 'conversation' });
      sm.buildPipeline.completeStage(buildId, 'conversation');
      sm.studioEvents.emit(StudioEvents.EVENTS.STAGE_COMPLETED, { stage: 'conversation' });
      assert(events.includes('advanced:conversation'));
      assert(events.includes('completed:conversation'));
    });
    it('should handle build failure gracefully', function() {
      const sm = new StudioManager();
      const p = sm.startBuild('Fail test', {});
      const buildId = sm._getBuildId(p.id);
      sm.buildPipeline.advance(buildId, 'conversation');
      sm.buildPipeline.failStage(buildId, 'conversation', 'simulated error');
      const status = sm.getBuildStatus(p.id);
      assert.strictEqual(status.status, 'failed');
    });
    it('should list projects after multiple builds', function() {
      const sm = new StudioManager();
      const p1 = sm.startBuild('Project A', {});
      const p2 = sm.startBuild('Project B', {});
      const p3 = sm.startBuild('Project C', {});
      const b1 = sm._getBuildId(p1.id);
      const b2 = sm._getBuildId(p2.id);
      sm.buildPipeline.completeStage(b1, 'workspace');
      sm.buildPipeline.advance(b2, 'conversation');
      const projects = sm.listProjects();
      assert.strictEqual(projects.length, 3);
    });
  });

  describe('Studio API Controller', function() {
    const controller = require('../lib/api/controllers/studioController');
    it('should export getController', function() {
      const ctrl = controller.getController();
      assert(ctrl.getStatus);
      assert(ctrl.createProject);
      assert(ctrl.getProject);
      assert(ctrl.getBuildStatus);
      assert(ctrl.getWorkspace);
      assert(ctrl.listProjects);
      assert(ctrl.advanceStage);
      assert(ctrl.completeStage);
    });
    it('getStatus should return status object', function() {
      const ctrl = controller.getController();
      const req = {};
      let resData = null;
      const res = {
        status: (code) => res,
        json: (data) => { resData = data; }
      };
      ctrl.getStatus(req, res);
      assert(resData);
      assert.strictEqual(resData.success, true);
      assert(resData.data.status);
      assert(resData.data.projects);
    });
    it('createProject should reject missing prompt', function() {
      const ctrl = controller.getController();
      const req = { body: {} };
      let resData = null;
      const res = {
        status: (code) => res,
        json: (data) => { resData = data; }
      };
      ctrl.createProject(req, res);
      assert(resData);
      assert.strictEqual(resData.success, false);
    });
    it('createProject should create project', function() {
      const ctrl = controller.getController();
      const req = { body: { prompt: 'Build a test app' } };
      let resData = null;
      const res = {
        status: (code) => { return { json: (data) => { resData = data; } }; },
        json: (data) => { resData = data; }
      };
      ctrl.createProject(req, res);
      assert(resData);
      assert.strictEqual(resData.success, true);
      assert(resData.data);
      assert(resData.data.project);
      assert(resData.data.project.id);
    });
    it('getProject should reject missing projectId', function() {
      const ctrl = controller.getController();
      const req = { params: {} };
      let resData = null;
      const res = {
        status: (code) => res,
        json: (data) => { resData = data; }
      };
      ctrl.getProject(req, res);
      assert(resData);
      assert.strictEqual(resData.success, false);
    });
    it('getProject should return project data', function() {
      const ctrl = controller.getController();
      const creq = { body: { prompt: 'Test' } };
      let projectData = null;
      const cres = {
        status: (code) => { return { json: (d) => { projectData = d.data && d.data.project; } }; },
        json: (d) => { projectData = d.data && d.data.project; }
      };
      ctrl.createProject(creq, cres);
      if (!projectData) return;
      const req = { params: { projectId: projectData.id } };
      let resData = null;
      const res = {
        status: () => { return { json: (d) => { resData = d; } }; },
        json: (d) => { resData = d; }
      };
      ctrl.getProject(req, res);
      assert(resData.success);
      assert(resData.data);
      assert(resData.data.project);
    });
    it('getBuildStatus should reject missing projectId', function() {
      const ctrl = controller.getController();
      const req = { params: {} };
      let resData = null;
      const res = {
        status: () => res,
        json: (d) => { resData = d; }
      };
      ctrl.getBuildStatus(req, res);
      assert(!resData.success);
    });
    it('listProjects should return projects array', function() {
      const ctrl = controller.getController();
      const req = { query: {} };
      let resData = null;
      const res = {
        status: () => res,
        json: (d) => { resData = d; }
      };
      ctrl.listProjects(req, res);
      assert(resData.success);
      assert(Array.isArray(resData.data.projects));
    });
    it('advanceStage should reject missing params', function() {
      const ctrl = controller.getController();
      const req = { body: {} };
      let resData = null;
      const res = {
        status: () => res,
        json: (d) => { resData = d; }
      };
      ctrl.advanceStage(req, res);
      assert(!resData.success);
    });
    it('completeStage should reject missing params', function() {
      const ctrl = controller.getController();
      const req = { body: {} };
      let resData = null;
      const res = {
        status: () => res,
        json: (d) => { resData = d; }
      };
      ctrl.completeStage(req, res);
      assert(!resData.success);
    });
  });

  describe('Studio Routes', function() {
    const { registerStudioRoutes } = require('../lib/api/routes/studioRoutes');
    it('should export registerStudioRoutes', function() {
      assert.strictEqual(typeof registerStudioRoutes, 'function');
    });
    it('should register routes on a router', function() {
      const routes = [];
      const mockRouter = {
        get: (path, handler) => { routes.push({ method: 'get', path }); },
        post: (path, handler) => { routes.push({ method: 'post', path }); }
      };
      const controller = require('../lib/api/controllers/studioController').getController();
      registerStudioRoutes(mockRouter, controller);
      assert.strictEqual(routes.length, 8);
      const paths = routes.map(r => r.path);
      assert(paths.includes('/studio'));
      assert(paths.includes('/studio/project'));
      assert(paths.includes('/studio/project/:projectId'));
      assert(paths.includes('/studio/project/:projectId/build'));
      assert(paths.includes('/studio/project/:projectId/workspace'));
      assert(paths.includes('/studio/projects'));
      assert(paths.includes('/studio/pipeline/advance'));
      assert(paths.includes('/studio/pipeline/complete'));
    });
  });
});

describe('Studio — random access patterns', function() {
  it('should handle concurrent operations', function() {
    const sm = new StudioManager();
    const builds = [];
    for (let i = 0; i < 10; i++) {
      const p = sm.projectManager.create({ prompt: 'Concurrent ' + i });
      builds.push(p);
    }
    assert.strictEqual(sm.listProjects().length, 10);
    builds.forEach(b => {
      const g = sm.getProject(b.id);
      assert(g);
    });
  });
  it('should handle rapid stage advancement', function() {
    const bp = new BuildPipeline();
    bp.start('p1', 'test');
    for (let i = 0; i < 100; i++) {
      const idx = i % 10;
      bp.advance('build_1', BuildPipeline.STAGES[idx]);
    }
    assert(bp.getStatus('build_1'));
  });
  it('should handle empty storage operations', function() {
    const ss = new StudioStorage();
    assert.strictEqual(ss.get('any'), null);
    assert(!ss.has('any'));
    assert(!ss.delete('any'));
    assert.deepStrictEqual(ss.getAll(), {});
  });
  it('should handle metrics with many entries', function() {
    const sm = new StudioMetrics();
    for (let i = 0; i < 1000; i++) {
      sm.record('test_metric', i, { index: i });
    }
    assert.strictEqual(sm.query('test_metric').length, 1000);
    assert.strictEqual(sm.aggregate('test_metric'), 499500);
  });
  it('should handle workspace with many files', function() {
    const wm = new WorkspaceManager();
    wm.create('p1');
    for (let i = 0; i < 100; i++) {
      wm.addFile('p1', { path: 'file_' + i + '.js', content: '// file ' + i });
    }
    assert.strictEqual(wm.get('p1').files.length, 100);
  });
  it('should handle project lifecycle with all statuses', function() {
    const pm = new ProjectManager();
    const p = pm.create({ prompt: 'Full lifecycle' });
    assert.strictEqual(p.status, 'draft');
    pm.update(p.id, { status: 'building' });
    assert.strictEqual(pm.get(p.id).status, 'building');
    pm.update(p.id, { status: 'completed' });
    assert.strictEqual(pm.get(p.id).status, 'completed');
    pm.update(p.id, { status: 'failed' });
    assert.strictEqual(pm.get(p.id).status, 'failed');
  });
  it('should handle event cleanup', function() {
    const ev = new StudioEvents();
    for (let i = 0; i < 50; i++) {
      ev.on('event_' + i, () => {});
    }
    assert.strictEqual(ev.listEvents().length, 50);
    ev.clear();
    assert.strictEqual(ev.listEvents().length, 0);
  });
  it('should handle storage with mixed types', function() {
    const ss = new StudioStorage();
    ss.set('string', 'hello');
    ss.set('number', 42);
    ss.set('boolean', true);
    ss.set('null', null);
    ss.set('array', [1, 2, 3]);
    ss.set('object', { a: 1 });
    assert.strictEqual(ss.get('string'), 'hello');
    assert.strictEqual(ss.get('number'), 42);
    assert.strictEqual(ss.get('boolean'), true);
    assert.strictEqual(ss.get('null'), null);
    assert.deepStrictEqual(ss.get('array'), [1, 2, 3]);
    assert.deepStrictEqual(ss.get('object'), { a: 1 });
  });
  it('should get workspace with update timestamp', function() {
    const wm = new WorkspaceManager();
    wm.create('p1');
    const ws1 = wm.get('p1');
    const t1 = ws1.updatedAt;
    wm.update('p1', { config: { debug: true } });
    const ws2 = wm.get('p1');
    assert(ws2.updatedAt >= t1);
  });
  it('should handle project with preview and live urls', function() {
    const pm = new ProjectManager();
    const p = pm.create({ prompt: 'URL test', previewUrl: 'https://preview.example.com', liveUrl: 'https://example.com' });
    assert.strictEqual(p.previewUrl, 'https://preview.example.com');
    assert.strictEqual(p.liveUrl, 'https://example.com');
  });
  it('should emit all event types at least once', function() {
    const ev = new StudioEvents();
    const fired = {};
    Object.values(StudioEvents.EVENTS).forEach(e => {
      ev.on(e, () => { fired[e] = true; });
      ev.emit(e);
    });
    Object.values(StudioEvents.EVENTS).forEach(e => {
      assert(fired[e], 'Event ' + e + ' was not fired');
    });
  });
  it('should handle duplicate listener registration', function() {
    const ev = new StudioEvents();
    let count = 0;
    const fn = () => { count++; };
    ev.on('test', fn);
    ev.on('test', fn);
    ev.emit('test');
    assert.strictEqual(count, 2);
  });
  it('should not crash on emit with no listeners', function() {
    const ev = new StudioEvents();
    ev.emit('nonexistent');
  });
  it('should handle off for non-existent event', function() {
    const ev = new StudioEvents();
    ev.off('nothing', () => {});
  });
  it('should maintain build list after clear', function() {
    const bp = new BuildPipeline();
    bp.start('p1', 'test');
    bp.clear();
    bp.start('p2', 'test2');
    assert.strictEqual(bp.list().length, 1);
    assert.strictEqual(bp.list()[0].projectId, 'p2');
  });
  it('should maintain project list after clear', function() {
    const pm = new ProjectManager();
    pm.create({ prompt: 'A' });
    pm.clear();
    pm.create({ prompt: 'B' });
    assert.strictEqual(pm.count(), 1);
    assert.strictEqual(pm.list()[0].prompt, 'B');
  });
  it('should maintain workspace list after clear', function() {
    const wm = new WorkspaceManager();
    wm.create('p1');
    wm.clear();
    wm.create('p2');
    assert.strictEqual(wm.list().length, 1);
    assert.strictEqual(wm.list()[0].projectId, 'p2');
  });
  it('should handle multiple independent StudioManagers', function() {
    const sm1 = new StudioManager();
    const sm2 = new StudioManager();
    sm1.startBuild('Project 1', {});
    sm2.startBuild('Project 2', {});
    assert.strictEqual(sm1.listProjects().length, 1);
    assert.strictEqual(sm2.listProjects().length, 1);
  });
  it('should handle workspace with env and config', function() {
    const wm = new WorkspaceManager();
    wm.create('p1', { env: { KEY: 'value' }, config: { setting: true } });
    const ws = wm.get('p1');
    assert.strictEqual(ws.env.KEY, 'value');
    assert.strictEqual(ws.config.setting, true);
  });
  it('should handle storage with special characters', function() {
    const ss = new StudioStorage();
    ss.set('key with spaces', 'value with spaces');
    ss.set('key.with.dots', 'value.with.dots');
    ss.set('unicode-✓', 'unicode-🎉');
    assert.strictEqual(ss.get('key with spaces'), 'value with spaces');
    assert.strictEqual(ss.get('key.with.dots'), 'value.with.dots');
    assert.strictEqual(ss.get('unicode-✓'), 'unicode-🎉');
  });
  it('should handle metric aggregation with empty values', function() {
    const sm = new StudioMetrics();
    assert.strictEqual(sm.aggregate('nonexistent'), null);
  });
});
