const { StudioManager } = require('./studioManager');
const { BuildPipeline } = require('./buildPipeline');
const { ProjectManager } = require('./projectManager');
const { WorkspaceManager } = require('./workspaceManager');
const { StudioEvents } = require('./studioEvents');
const { StudioStorage } = require('./studioStorage');
const { StudioMetrics } = require('./studioMetrics');

function getDefaultStudioManager() {
  return new StudioManager();
}

module.exports = {
  StudioManager,
  BuildPipeline,
  ProjectManager,
  WorkspaceManager,
  StudioEvents,
  StudioStorage,
  StudioMetrics,
  getDefaultStudioManager
};
