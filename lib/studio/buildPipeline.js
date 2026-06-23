class BuildPipeline {
  static STAGES = [
    'conversation',
    'questions',
    'context',
    'architecture',
    'knowledge',
    'composer',
    'generator',
    'evaluation',
    'deployment',
    'workspace'
  ];

  constructor() {
    this._builds = new Map();
    this._counter = 0;
  }

  start(projectId, prompt, options) {
    if (!projectId) throw new Error('projectId is required');
    if (!prompt) throw new Error('prompt is required');
    const id = 'build_' + (++this._counter);
    const build = {
      id,
      projectId,
      prompt,
      options: options || {},
      currentStage: null,
      status: 'pending',
      stages: BuildPipeline.STAGES.map(s => ({ name: s, status: 'pending', startedAt: null, completedAt: null, data: null })),
      progress: 0,
      artifacts: {},
      startedAt: new Date().toISOString(),
      completedAt: null
    };
    this._builds.set(id, build);
    return build;
  }

  advance(buildId, stageName, data) {
    const build = this._builds.get(buildId);
    if (!build) return null;
    const stageIndex = BuildPipeline.STAGES.indexOf(stageName);
    if (stageIndex === -1) return null;
    if (stageIndex > 0 && build.stages[stageIndex - 1].status !== 'completed') return null;
    if (build.currentStage && BuildPipeline.STAGES.indexOf(build.currentStage) >= stageIndex) return null;
    if (build.currentStage) {
      const prevIndex = BuildPipeline.STAGES.indexOf(build.currentStage);
      if (prevIndex >= 0) {
        build.stages[prevIndex].completedAt = new Date().toISOString();
        build.stages[prevIndex].status = 'completed';
      }
    }
    build.currentStage = stageName;
    build.stages[stageIndex].startedAt = new Date().toISOString();
    build.stages[stageIndex].status = 'running';
    if (data) build.stages[stageIndex].data = data;
    build.status = 'running';
    build.progress = Math.round((stageIndex / BuildPipeline.STAGES.length) * 100);
    return build;
  }

  completeStage(buildId, stageName, data) {
    const build = this._builds.get(buildId);
    if (!build) return null;
    const stageIndex = BuildPipeline.STAGES.indexOf(stageName);
    if (stageIndex === -1) return null;
    build.stages[stageIndex].completedAt = new Date().toISOString();
    build.stages[stageIndex].status = 'completed';
    build.stages[stageIndex].data = data || build.stages[stageIndex].data;
    build.progress = Math.round(((stageIndex + 1) / BuildPipeline.STAGES.length) * 100);
    if (stageName === 'workspace') {
      build.status = 'completed';
      build.completedAt = new Date().toISOString();
      build.progress = 100;
    }
    return build;
  }

  failStage(buildId, stageName, error) {
    const build = this._builds.get(buildId);
    if (!build) return null;
    const stageIndex = BuildPipeline.STAGES.indexOf(stageName);
    if (stageIndex === -1) return null;
    build.stages[stageIndex].status = 'failed';
    build.stages[stageIndex].error = error || 'unknown error';
    build.status = 'failed';
    return build;
  }

  getStatus(buildId) {
    const build = this._builds.get(buildId);
    if (!build) return null;
    return {
      id: build.id,
      projectId: build.projectId,
      status: build.status,
      currentStage: build.currentStage,
      progress: build.progress,
      stages: build.stages.map(s => ({ name: s.name, status: s.status })),
      startedAt: build.startedAt,
      completedAt: build.completedAt
    };
  }

  getProgress(buildId) {
    const build = this._builds.get(buildId);
    if (!build) return null;
    const completed = build.stages.filter(s => s.status === 'completed').length;
    const total = BuildPipeline.STAGES.length;
    return { completed, total, percent: Math.round((completed / total) * 100), currentStage: build.currentStage, status: build.status };
  }

  list(projectId) {
    if (!projectId) return Array.from(this._builds.values());
    return Array.from(this._builds.values()).filter(b => b.projectId === projectId);
  }

  clear() {
    this._builds.clear();
    this._counter = 0;
  }
}

module.exports = { BuildPipeline };
