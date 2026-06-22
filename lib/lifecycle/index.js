const { ProjectLifecycle } = require('./projectLifecycle');
const { EnvironmentManager } = require('./environmentManager');
const { ReleaseManager } = require('./releaseManager');
const { ReleasePipeline } = require('./releasePipeline');
const { PromotionManager } = require('./promotionManager');
const { VersionManager } = require('./versionManager');
const { SnapshotManager } = require('./snapshotManager');
const { MigrationManager } = require('./migrationManager');
const { ProjectTemplates } = require('./projectTemplates');
const { ProjectCloner } = require('./projectCloner');
const { ProjectImporter } = require('./projectImporter');
const { ProjectExporter } = require('./projectExporter');
const { LifecycleEvents } = require('./lifecycleEvents');
const { LifecycleMetrics } = require('./lifecycleMetrics');
const { LifecycleStorage } = require('./lifecycleStorage');
const { LifecycleManager } = require('./lifecycleManager');

function getDefaultLifecycle() {
  return new LifecycleManager();
}

module.exports = {
  ProjectLifecycle,
  EnvironmentManager,
  ReleaseManager,
  ReleasePipeline,
  PromotionManager,
  VersionManager,
  SnapshotManager,
  MigrationManager,
  ProjectTemplates,
  ProjectCloner,
  ProjectImporter,
  ProjectExporter,
  LifecycleEvents,
  LifecycleMetrics,
  LifecycleStorage,
  LifecycleManager,
  getDefaultLifecycle
};
