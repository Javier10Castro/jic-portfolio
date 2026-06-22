const { getDefaultRuntime, RuntimeManager } = require('../../runtime');
const { FeatureFlagManager } = require('../../runtime/featureFlagManager');
const { ConfigurationManager } = require('../../runtime/configurationManager');
const { SecretManager } = require('../../runtime/secretManager');
const { success, error } = require('../responses/apiResponse');

function getController() {
  const runtime = getDefaultRuntime();
  const flags = new FeatureFlagManager();
  const config = new ConfigurationManager();
  const secrets = new SecretManager();

  return {
    getOverview(req, res) {
      try {
        success(res, Object.assign({}, runtime.getStatus(), {
          activeFlags: flags.getStatus(),
          activeConfigs: config.getStatus(),
          secrets: secrets.getStatus(),
        }));
      } catch (e) { error(res, e.message); }
    },
    getConfiguration(req, res) {
      try { success(res, { configs: config.getConfigValue ? config.getConfigValue(req.query.name) || {} : {} }); }
      catch (e) { error(res, e.message); }
    },
    getFlags(req, res) {
      try { success(res, { flags: flags.getStatus() }); }
      catch (e) { error(res, e.message); }
    },
    getSecrets(req, res) {
      try { success(res, { secrets: secrets.getStatus() }); }
      catch (e) { error(res, e.message); }
    },
    getServices(req, res) {
      try {
        const sd = require('../../runtime/serviceRegistry');
        const reg = new sd.ServiceRegistry();
        success(res, { services: reg.list() });
      } catch (e) { error(res, e.message); }
    },
    getRollouts(req, res) {
      try {
        const rm = require('../../runtime/rolloutManager');
        const mgr = new rm.RolloutManager();
        success(res, { rollouts: mgr.listRollouts() });
      } catch (e) { error(res, e.message); }
    },
    getLocks(req, res) {
      try {
        const dl = require('../../runtime/distributedLocks');
        const locks = new dl.DistributedLocks();
        success(res, { locks: locks.listLocks() });
      } catch (e) { error(res, e.message); }
    },
    postConfiguration(req, res) {
      try {
        const { name, value } = req.body;
        if (!name) return error(res, 'Name required');
        config.setConfig(name, value);
        success(res, { updated: true, name, value });
      } catch (e) { error(res, e.message); }
    },
    postFlags(req, res) {
      try {
        const { key, name, enabled } = req.body;
        if (!key) return error(res, 'Key required');
        flags.createFlag({ key, name: name || key, enabled: enabled !== false });
        success(res, { created: true, key });
      } catch (e) { error(res, e.message); }
    },
    postRollouts(req, res) {
      try {
        const { name, config } = req.body;
        if (!name) return error(res, 'Name required');
        const rm = require('../../runtime/rolloutManager');
        const mgr = new rm.RolloutManager();
        mgr.createRollout(name, config || {});
        success(res, { created: true, name });
      } catch (e) { error(res, e.message); }
    },
    postRollback(req, res) {
      try {
        const { name, targetVersion } = req.body;
        if (!name) return error(res, 'Name required');
        const rbm = require('../../runtime/rollbackManager');
        const mgr = new rbm.RollbackManager();
        const result = mgr.executeRollback(name, targetVersion);
        success(res, { rollback: result });
      } catch (e) { error(res, e.message); }
    },
    postKillSwitch(req, res) {
      try {
        const { key, reason } = req.body;
        if (!key || !reason) return error(res, 'Key and reason required');
        const ksm = require('../../runtime/killSwitchManager');
        const mgr = new ksm.KillSwitchManager();
        const result = mgr.activate(key, reason);
        success(res, { killSwitch: result });
      } catch (e) { error(res, e.message); }
    },
    postSafeMode(req, res) {
      try {
        const { action, reason } = req.body;
        const sm = require('../../runtime/safeMode');
        const safe = new sm.SafeMode();
        let result;
        if (action === 'enter') result = safe.enterSafeMode(reason || 'Manual');
        else if (action === 'exit') result = safe.exitSafeMode();
        else return error(res, 'Action must be enter or exit');
        success(res, { safeMode: result });
      } catch (e) { error(res, e.message); }
    },
  };
}
module.exports = { getController };
