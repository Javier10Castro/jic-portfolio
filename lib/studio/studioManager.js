const { BuildPipeline } = require('./buildPipeline');
const { ProjectManager } = require('./projectManager');
const { WorkspaceManager } = require('./workspaceManager');
const { StudioEvents } = require('./studioEvents');
const { StudioStorage } = require('./studioStorage');
const { StudioMetrics } = require('./studioMetrics');

class StudioManager {
  constructor() {
    this._buildPipeline = new BuildPipeline();
    this._projectManager = new ProjectManager();
    this._workspaceManager = new WorkspaceManager();
    this._studioEvents = new StudioEvents();
    this._studioStorage = new StudioStorage();
    this._studioMetrics = new StudioMetrics();
    this._initializedAt = new Date().toISOString();
    this._projectToBuild = new Map();
  }

  get buildPipeline() { return this._buildPipeline; }
  get projectManager() { return this._projectManager; }
  get workspaceManager() { return this._workspaceManager; }
  get studioEvents() { return this._studioEvents; }
  get studioStorage() { return this._studioStorage; }
  get studioMetrics() { return this._studioMetrics; }

  startBuild(prompt, options) {
    if (!prompt) throw new Error('prompt is required');
    const project = this._projectManager.create({ prompt, options: options || {}, status: 'building' });
    this._studioEvents.emit('studio:build:started', { projectId: project.id, prompt });
    const pipeline = this._buildPipeline;
    const build = pipeline.start(project.id, prompt, options);
    this._projectToBuild.set(project.id, build.id);
    this._projectManager.update(project.id, { buildId: build.id });
    return project;
  }

  _getBuildId(projectId) {
    return this._projectToBuild.get(projectId) || null;
  }

  getBuildStatus(projectId) {
    const buildId = this._getBuildId(projectId);
    if (!buildId) return null;
    return this._buildPipeline.getStatus(buildId);
  }

  getBuildProgress(projectId) {
    const buildId = this._getBuildId(projectId);
    if (!buildId) return null;
    return this._buildPipeline.getProgress(buildId);
  }

  listProjects(filter) {
    return this._projectManager.list(filter);
  }

  getProject(projectId) {
    return this._projectManager.get(projectId);
  }

  getWorkspace(projectId) {
    return this._workspaceManager.get(projectId);
  }

  getStatus() {
    return {
      initialized: true,
      initializedAt: this._initializedAt,
      submodules: {
        buildPipeline: this._buildPipeline !== null,
        projectManager: this._projectManager !== null,
        workspaceManager: this._workspaceManager !== null,
        studioEvents: this._studioEvents !== null,
        studioStorage: this._studioStorage !== null,
        studioMetrics: this._studioMetrics !== null
      }
    };
  }

  clear() {
    this._buildPipeline = new BuildPipeline();
    this._projectManager = new ProjectManager();
    this._workspaceManager = new WorkspaceManager();
    this._studioEvents = new StudioEvents();
    this._studioStorage = new StudioStorage();
    this._studioMetrics = new StudioMetrics();
    this._projectToBuild.clear();
  }
}

module.exports = { StudioManager };
