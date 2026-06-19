function generateReport(deploymentResult, { buildArtifacts, warnings } = {}) {
  if (!deploymentResult) throw new Error('deploymentResult is required');

  const now = new Date().toISOString();

  return {
    deploymentId: deploymentResult.deploymentId || `report-${Date.now().toString(36)}`,
    provider: deploymentResult.provider || 'unknown',
    version: deploymentResult.version || 'v1.0.0',
    commit: deploymentResult.commitSha || null,
    url: deploymentResult.url || null,
    duration: deploymentResult.duration || 0,
    deployedAt: deploymentResult.deployedAt || now,
    status: deploymentResult.status || 'unknown',
    simulated: deploymentResult.simulated || false,
    warnings: warnings || [],
    rollbackAvailable: deploymentResult.status === 'deployed' || deploymentResult.status === 'pushed',
    filesDeployed: buildArtifacts ? buildArtifacts.files.length : 0,
    totalSize: buildArtifacts ? buildArtifacts.manifest.totalSize : 0,
    generatedAt: now,
  };
}

function summarizeHistory(deployments) {
  if (!deployments || deployments.length === 0) {
    return { total: 0, latest: null, byProvider: {}, byStatus: {} };
  }

  const byProvider = {};
  const byStatus = {};

  for (const d of deployments) {
    const prov = d.provider || 'unknown';
    const stat = d.status || 'unknown';
    byProvider[prov] = (byProvider[prov] || 0) + 1;
    byStatus[stat] = (byStatus[stat] || 0) + 1;
  }

  return {
    total: deployments.length,
    latest: deployments[0],
    byProvider,
    byStatus,
  };
}

module.exports = { generateReport, summarizeHistory };
