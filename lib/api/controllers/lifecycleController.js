const { getDefaultLifecycle } = require('../../lifecycle');
const { success, error } = require('../responses/apiResponse');

function getController() {
  const lc = getDefaultLifecycle();
  return {
    getLifecycle(req, res) {
      try {
        const { id } = req.params;
        success(res, {
          projectId: id,
          state: lc.projectLifecycle ? lc.projectLifecycle.getState(id) : null,
          environments: lc.environments ? lc.environments.list() : [],
          releases: lc.releases ? lc.releases.listReleases(id) : [],
          snapshots: lc.snapshots ? lc.snapshots.listSnapshots(id) : [],
        });
      } catch (e) { error(res, e.message); }
    },
    getReleases(req, res) {
      try { success(res, { releases: lc.releases ? lc.releases.listReleases(req.params.id) : [] }); }
      catch (e) { error(res, e.message); }
    },
    getEnvironments(req, res) {
      try { success(res, { environments: lc.environments ? lc.environments.list() : [] }); }
      catch (e) { error(res, e.message); }
    },
    getSnapshots(req, res) {
      try { success(res, { snapshots: lc.snapshots ? lc.snapshots.listSnapshots(req.params.id) : [] }); }
      catch (e) { error(res, e.message); }
    },
    promote(req, res) {
      try {
        const { id } = req.params;
        const { from, to, options } = req.body;
        if (!from || !to) return error(res, 'From and to environments required');
        const result = lc.promotions ? lc.promotions.promote(id, from, to, options || {}) : null;
        if (lc.events) lc.events.emit(lc.events.EVENTS.RELEASE_PROMOTED, { projectId: id, from, to, result });
        success(res, { promotion: result });
      } catch (e) { error(res, e.message); }
    },
    createRelease(req, res) {
      try {
        const { id } = req.params;
        const { version, config } = req.body;
        if (!version) return error(res, 'Version required');
        const result = lc.releases ? lc.releases.createRelease(id, version, config || {}) : null;
        if (lc.events) lc.events.emit(lc.events.EVENTS.RELEASE_CREATED, { projectId: id, version });
        success(res, { release: result });
      } catch (e) { error(res, e.message); }
    },
    createSnapshot(req, res) {
      try {
        const { id } = req.params;
        const { type, data } = req.body;
        if (!type) return error(res, 'Type required');
        const result = lc.snapshots ? lc.snapshots.createSnapshot(id, type, data || {}) : null;
        success(res, { snapshot: result });
      } catch (e) { error(res, e.message); }
    },
    importProject(req, res) {
      try {
        const { data, format } = req.body;
        if (!data) return error(res, 'Data required');
        const result = lc.importer ? lc.importer.importProject(data, format || 'json') : null;
        success(res, { import: result });
      } catch (e) { error(res, e.message); }
    },
    exportProject(req, res) {
      try {
        const { id } = req.params;
        const { format } = req.query;
        const result = lc.exporter ? lc.exporter.exportProject(id, format || 'json') : null;
        success(res, { export: result });
      } catch (e) { error(res, e.message); }
    },
    rollback(req, res) {
      try {
        const { id } = req.params;
        const { version } = req.body;
        if (!version) return error(res, 'Version required');
        const result = lc.migrations ? lc.migrations.rollbackMigration(id) : null;
        success(res, { rollback: { projectId: id, targetVersion: version, result } });
      } catch (e) { error(res, e.message); }
    },
  };
}
module.exports = { getController };
