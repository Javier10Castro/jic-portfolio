const { workspaceManager } = require('../../saas');
const { success } = require('../responses');
const { NotFoundError } = require('../errors');

function getWorkspace(req, res) {
  if (req.workspace) return success(res, req.workspace);

  const ws = workspaceManager.getUserWorkspace(req.user?.id);
  if (!ws) throw new NotFoundError('No workspace found for user');
  return success(res, ws);
}

function updateWorkspace(req, res) {
  const wsId = req.workspace?.id;
  if (!wsId) throw new NotFoundError('No workspace found');
  const updated = workspaceManager.updateWorkspace(wsId, req.body);
  return success(res, updated);
}

module.exports = { getWorkspace, updateWorkspace };
