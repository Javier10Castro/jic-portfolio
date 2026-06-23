const { getDefaultStudioManager } = require('../../studio');
const { success, error } = require('../responses/apiResponse');

function getController() {
  const sm = getDefaultStudioManager();
  return {
    getStatus(req, res) {
      try {
        const status = sm.getStatus();
        const projects = sm.listProjects();
        success(res, { status, projects, healthy: true });
      } catch (e) { error(res, e.message); }
    },
    health(req, res) {
      try {
        const status = sm.getStatus();
        success(res, { healthy: true, initialized: status.initialized, submodules: status.submodules });
      } catch (e) { error(res, e.message); }
    },
    createProject(req, res) {
      try {
        const { prompt, options } = req.body;
        if (!prompt) return error(res, 'prompt is required');
        const project = sm.startBuild(prompt, options);
        sm.studioEvents.emit(sm.studioEvents.constructor.EVENTS.PROJECT_CREATED, { projectId: project.id });
        success(res, { project });
      } catch (e) { error(res, e.message); }
    },
    getProject(req, res) {
      try {
        const { projectId } = req.params;
        if (!projectId) return error(res, 'projectId is required');
        const project = sm.getProject(projectId);
        if (!project) return error(res, 'Project not found');
        const buildStatus = sm.getBuildStatus(project.buildId);
        const progress = sm.getBuildProgress(project.buildId);
        const workspace = sm.getWorkspace(projectId);
        success(res, { project, build: buildStatus, progress, workspace });
      } catch (e) { error(res, e.message); }
    },
    getBuildStatus(req, res) {
      try {
        const { projectId } = req.params;
        if (!projectId) return error(res, 'projectId is required');
        const status = sm.getBuildStatus(projectId);
        if (!status) return error(res, 'Build not found');
        const progress = sm.getBuildProgress(projectId);
        success(res, { build: status, progress });
      } catch (e) { error(res, e.message); }
    },
    getWorkspace(req, res) {
      try {
        const { projectId } = req.params;
        if (!projectId) return error(res, 'projectId is required');
        const workspace = sm.getWorkspace(projectId);
        success(res, { workspace: workspace || {} });
      } catch (e) { error(res, e.message); }
    },
    listProjects(req, res) {
      try {
        const { status: filterStatus } = req.query;
        const projects = sm.listProjects(filterStatus ? { status: filterStatus } : undefined);
        success(res, { projects });
      } catch (e) { error(res, e.message); }
    },
    advanceStage(req, res) {
      try {
        const { projectId, stage, data } = req.body;
        if (!projectId || !stage) return error(res, 'projectId and stage are required');
        const buildId = sm._getBuildId(projectId);
        if (!buildId) return error(res, 'Build not found for project');
        const build = sm.buildPipeline.advance(buildId, stage, data);
        if (build) sm.studioEvents.emit(sm.studioEvents.constructor.EVENTS.STAGE_ADVANCED, { projectId, stage });
        success(res, { build });
      } catch (e) { error(res, e.message); }
    },
    completeStage(req, res) {
      try {
        const { projectId, stage, data } = req.body;
        if (!projectId || !stage) return error(res, 'projectId and stage are required');
        const buildId = sm._getBuildId(projectId);
        if (!buildId) return error(res, 'Build not found for project');
        const build = sm.buildPipeline.completeStage(buildId, stage, data);
        if (build && stage === 'workspace') sm.studioEvents.emit(sm.studioEvents.constructor.EVENTS.BUILD_COMPLETED, { projectId });
        success(res, { build });
      } catch (e) { error(res, e.message); }
    }
  };
}

module.exports = { getController };
