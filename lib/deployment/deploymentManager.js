const history = require('./deploymentHistory');
const report = require('./deploymentReport');
const buildArtifacts = require('./buildArtifacts');
const rollbackManager = require('./rollbackManager');
const provider = require('./deploymentProvider');
require('./vercelProvider');
require('./githubProvider');

function deploy({ buildPath, projectName, projectUrl, version, commitSha, providerName, branch, dryRun } = {}) {
  const results = { steps: {}, success: false };
  const warnings = [];
  const startTime = Date.now();

  if (dryRun) {
    return dryRunDeploy({ buildPath, projectName, projectUrl, version, commitSha, providerName, branch });
  }

  const provName = providerName || 'vercel';

  if (buildPath) {
    const artifacts = buildArtifacts.packageBuild({ buildPath, projectName, version });
    results.steps.package = artifacts;
    if (!artifacts.success) {
      return { success: false, status: 'failed', error: 'Build packaging failed', detail: artifacts.error, steps: results.steps };
    }
    results.buildArtifacts = artifacts;
  }

  const prov = provider.getProvider(provName);
  const deployResult = prov.deploy({
    buildPath,
    projectName,
    projectUrl,
    version,
    commitSha,
    branch,
    buildArtifacts: results.buildArtifacts || null,
  });

  results.steps.deploy = deployResult;
  deployResult.duration = Date.now() - startTime;

  if (!deployResult.success) {
    results.success = false;
    results.status = 'failed';
    results.error = deployResult.error || 'Provider deploy failed';
    history.record({
      deploymentId: deployResult.deploymentId || `failed-${Date.now().toString(36)}`,
      projectName,
      provider: provName,
      version: version || 'v1.0.0',
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: results.error,
    });
    return results;
  }

  history.record({
    deploymentId: deployResult.deploymentId,
    projectName: projectName || 'generated-site',
    projectUrl: deployResult.url || projectUrl || null,
    provider: provName,
    version: deployResult.version || version || 'v1.0.0',
    commitSha: deployResult.commitSha || commitSha || null,
    status: deployResult.status || 'deployed',
    simulated: deployResult.simulated || false,
    timestamp: new Date().toISOString(),
    duration: deployResult.duration,
  });

  results.success = true;
  results.status = deployResult.status || 'deployed';
  results.deploymentId = deployResult.deploymentId;
  results.deploymentReport = report.generateReport(deployResult, { buildArtifacts: results.buildArtifacts, warnings });

  return results;
}

function dryRunDeploy({ buildPath, projectName, projectUrl, version, commitSha, providerName, branch }) {
  const provName = providerName || 'vercel';
  const now = new Date().toISOString();
  const deploymentId = `dryrun-${Date.now().toString(36)}`;

  let filesDeployed = 0;
  let totalSize = 0;
  if (buildPath) {
    const artifacts = buildArtifacts.packageBuild({ buildPath, projectName, version });
    if (artifacts.success) {
      filesDeployed = artifacts.files.length;
      totalSize = artifacts.manifest.totalSize;
    }
  }

  return {
    success: true,
    dryRun: true,
    deploymentId,
    provider: provName,
    projectName: projectName || 'generated-site',
    version: version || 'v1.0.0',
    commitSha: commitSha || 'dry-run',
    url: projectUrl || `https://${(projectName || 'project').toLowerCase().replace(/\s+/g, '-')}.vercel.app`,
    status: 'dry_run',
    deployedAt: now,
    filesDeployed,
    totalSize,
    duration: 0,
    message: `Dry-run deployment to ${provName} for ${projectName || 'generated-site'} v${version || '1.0.0'}`,
  };
}

function status(deploymentId) {
  return history.find(deploymentId);
}

function getHistory() {
  return history.getHistory();
}

function latest() {
  return history.latest();
}

function rollbackTo(version, options = {}) {
  return rollbackManager.rollback(version, options);
}

module.exports = { deploy, status, getHistory, latest, rollbackTo };
