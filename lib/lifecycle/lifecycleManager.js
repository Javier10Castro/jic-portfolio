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

class LifecycleManager {
  constructor() {
    this._projectLifecycle = new ProjectLifecycle();
    this._environmentManager = new EnvironmentManager();
    this._releaseManager = new ReleaseManager();
    this._releasePipeline = new ReleasePipeline();
    this._promotionManager = new PromotionManager();
    this._versionManager = new VersionManager();
    this._snapshotManager = new SnapshotManager();
    this._migrationManager = new MigrationManager();
    this._projectTemplates = new ProjectTemplates();
    this._projectCloner = new ProjectCloner();
    this._projectImporter = new ProjectImporter();
    this._projectExporter = new ProjectExporter();
    this._lifecycleEvents = new LifecycleEvents();
    this._lifecycleMetrics = new LifecycleMetrics();
    this._lifecycleStorage = new LifecycleStorage();
  }

  get projectLifecycle() { return this._projectLifecycle; }
  get environmentManager() { return this._environmentManager; }
  get releaseManager() { return this._releaseManager; }
  get releasePipeline() { return this._releasePipeline; }
  get promotionManager() { return this._promotionManager; }
  get versionManager() { return this._versionManager; }
  get snapshotManager() { return this._snapshotManager; }
  get migrationManager() { return this._migrationManager; }
  get projectTemplates() { return this._projectTemplates; }
  get projectCloner() { return this._projectCloner; }
  get projectImporter() { return this._projectImporter; }
  get projectExporter() { return this._projectExporter; }
  get lifecycleEvents() { return this._lifecycleEvents; }
  get lifecycleMetrics() { return this._lifecycleMetrics; }
  get lifecycleStorage() { return this._lifecycleStorage; }

  getStatus() {
    return {
      environments: this._environmentManager.list().length,
      releases: this._releaseManager.listReleases().length,
      promotions: this._promotionManager.listPromotions().length,
      snapshots: this._snapshotManager.listSnapshots().length,
      migrations: this._migrationManager.listMigrations().length,
      templates: this._projectTemplates.listTemplates().length
    };
  }

  clear() {
    this._projectLifecycle.clear();
    this._environmentManager.clear();
    this._releaseManager.clear();
    this._releasePipeline.clear();
    this._promotionManager.clear();
    this._versionManager.clear();
    this._snapshotManager.clear();
    this._migrationManager.clear();
    this._projectTemplates.clear();
    this._projectCloner.clear();
    this._projectImporter.clear();
    this._projectExporter.clear();
    this._lifecycleEvents.clear();
    this._lifecycleMetrics.clear();
    this._lifecycleStorage.clear();
  }
}

module.exports = { LifecycleManager };
