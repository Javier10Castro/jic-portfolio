const deploymentEngine = require('../../deployment');
const { projectManager } = require('../../saas');
const { success, created } = require('../responses');
const { NotFoundError, ValidationError } = require('../errors');

function deploy(req, res) {
  const { projectId, buildPath, provider, dryRun } = req.body;
  if (!projectId && !buildPath) throw new ValidationError('projectId or buildPath is required');

  if (projectId) {
    const project = projectManager.getProject(projectId);
    if (!project) throw new NotFoundError(`Project "${projectId}" not found`);
  }

  const resultPromise = deploymentEngine.deploy({
    buildPath: buildPath || './dist',
    projectName: req.body.projectName || projectId || 'api-deploy',
    version: req.body.version || `deploy-${Date.now()}`,
    providerName: provider || 'vercel',
    dryRun: dryRun || false,
  });

  resultPromise.then(result => {
    return created(res, result);
  }).catch(err => {
    res.status(500).json({
      success: false, data: null,
      errors: [{ code: 'DeploymentError', message: err.message, details: {} }],
      meta: { timestamp: new Date().toISOString() },
      requestId: req.requestId,
    });
  });
}

function listDeployments(req, res) {
  const deployments = deploymentEngine.listDeployments ? deploymentEngine.listDeployments() : [];
  return success(res, deployments);
}

function getDeployment(req, res) {
  const dep = deploymentEngine.getDeployment ? deploymentEngine.getDeployment(req.params.id) : null;
  if (!dep) throw new NotFoundError(`Deployment "${req.params.id}" not found`);
  return success(res, dep);
}

function rollbackDeployment(req, res) {
  const resultPromise = deploymentEngine.rollback ? deploymentEngine.rollback(req.params.id) : null;
  if (!resultPromise) throw new NotFoundError(`Rollback not supported or deployment "${req.params.id}" not found`);
  resultPromise.then(result => {
    return success(res, result);
  }).catch(err => {
    res.status(500).json({
      success: false, data: null,
      errors: [{ code: 'RollbackError', message: err.message, details: {} }],
      meta: { timestamp: new Date().toISOString() },
      requestId: req.requestId,
    });
  });
}

module.exports = { deploy, listDeployments, getDeployment, rollbackDeployment };
