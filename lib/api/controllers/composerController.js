const { getDefaultComposer } = require('../../composer');
const { success, error } = require('../responses/apiResponse');

function getController() {
  const cm = getDefaultComposer();
  return {
    getComposer(req, res) {
      try { success(res, { status: cm.getStatus(), capabilities: cm.capabilityRegistry ? cm.capabilityRegistry.listCapabilities().length : 0 }); }
      catch (e) { error(res, e.message); }
    },
    compose(req, res) {
      try {
        const { appId, blueprint, options } = req.body;
        if (!appId || !blueprint) return error(res, 'appId and blueprint required');
        const result = cm.applicationComposer ? cm.applicationComposer.compose(appId, blueprint, options || {}) : null;
        if (cm.compositionEvents) cm.compositionEvents.emit(cm.compositionEvents.EVENTS.COMPOSITION_CREATED, { appId });
        success(res, { composition: result });
      } catch (e) { error(res, e.message); }
    },
    validate(req, res) {
      try {
        const { composition } = req.body;
        if (!composition) return error(res, 'Composition required');
        const result = cm.compositionValidator ? cm.compositionValidator.validate(composition) : { valid: false, errors: ['Validator unavailable'] };
        success(res, { validation: result });
      } catch (e) { error(res, e.message); }
    },
    simulate(req, res) {
      try {
        const { composition } = req.body;
        if (!composition) return error(res, 'Composition required');
        const result = cm.compositionSimulation ? cm.compositionSimulation.simulate(composition) : null;
        success(res, { simulation: result });
      } catch (e) { error(res, e.message); }
    },
    exportComposition(req, res) {
      try {
        const { appId, format } = req.body;
        if (!appId) return error(res, 'appId required');
        const manifest = cm.applicationManifest ? cm.applicationManifest.export(appId, format || 'json') : null;
        success(res, { export: manifest });
      } catch (e) { error(res, e.message); }
    },
    getTemplates(req, res) {
      try {
        const templates = [];
        const names = ['website','saas','crm','erp','marketplace','knowledgeBase','automation','dashboard','aiAssistant','custom'];
        for (const n of names) {
          try {
            const tpl = require('../../composer/' + n);
            const className = n.charAt(0).toUpperCase() + n.slice(1) + 'Template';
            const inst = tpl[className] ? new tpl[className]() : null;
            if (inst && inst.getName) templates.push({ name: inst.getName(), description: inst.getDescription(), modules: inst.getModules() });
          } catch(e) {}
        }
        success(res, { templates });
      } catch (e) { error(res, e.message); }
    },
    getCapabilities(req, res) {
      try {
        const { type } = req.query;
        const capabilities = cm.capabilityRegistry ? cm.capabilityRegistry.listCapabilities(type) : [];
        success(res, { capabilities });
      } catch (e) { error(res, e.message); }
    },
    getGraph(req, res) {
      try {
        const { compositionId } = req.query;
        if (!compositionId) return error(res, 'compositionId required');
        const graph = cm.compositionGraph ? cm.compositionGraph.getGraph(compositionId) : null;
        success(res, { graph });
      } catch (e) { error(res, e.message); }
    },
  };
}
module.exports = { getController };
