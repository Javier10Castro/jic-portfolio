const { execSync } = require('child_process');
const { registerProvider } = require('./deploymentProvider');

function _exec(cmd, cwd) {
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe', timeout: 60000 });
    return { success: true, output: out.trim() };
  } catch (err) {
    return { success: false, output: (err.stderr || err.message || '').trim() };
  }
}

function _requires(key) {
  const val = process.env[key];
  if (!val) return { available: false, missing: key };
  return { available: true, value: val };
}

function health() {
  const vercelToken = _requires('VERCEL_TOKEN');
  const vercelOrg = _requires('VERCEL_ORG_ID');
  const vercelProject = _requires('VERCEL_PROJECT_ID');
  return {
    provider: 'vercel',
    status: (vercelToken.available && vercelOrg.available && vercelProject.available) ? 'ready' : 'missing_credentials',
    tokenConfigured: vercelToken.available,
    orgConfigured: vercelOrg.available,
    projectConfigured: vercelProject.available,
  };
}

function deploy({ buildPath, projectName, projectUrl, version, commitSha, buildArtifacts }) {
  const h = health();
  if (h.status === 'missing_credentials') {
    return simulateDeploy({ buildPath, projectName, projectUrl, version, commitSha, buildArtifacts });
  }
  return realDeploy({ buildPath, projectName, version, commitSha });
}

function simulateDeploy({ buildPath, projectName, projectUrl, version, commitSha, buildArtifacts }) {
  const now = new Date().toISOString();
  const deployId = `vercel-sim-${Date.now().toString(36)}`;
  return {
    success: true,
    simulated: true,
    provider: 'vercel',
    deploymentId: deployId,
    url: projectUrl || `https://${(projectName || 'project').toLowerCase().replace(/\s+/g, '-')}.vercel.app`,
    version: version || 'v1.0.0',
    commitSha: commitSha || 'simulated',
    deployedAt: now,
    duration: 0,
    status: 'deployed',
    buildArtifacts: buildArtifacts || null,
  };
}

function realDeploy({ buildPath, projectName, version, commitSha }) {
  const cwd = buildPath || process.cwd();
  const vercelDeploy = _exec(`vercel deploy --prod --name="${projectName || 'deploy'}" --token="${process.env.VERCEL_TOKEN}"`, cwd);
  if (!vercelDeploy.success) {
    return { success: false, provider: 'vercel', status: 'failed', error: vercelDeploy.output };
  }
  const url = vercelDeploy.output.trim();
  const now = new Date().toISOString();
  return {
    success: true,
    simulated: false,
    provider: 'vercel',
    deploymentId: `vercel-${Date.now().toString(36)}`,
    url,
    version: version || 'v1.0.0',
    commitSha: commitSha || 'unknown',
    deployedAt: now,
    duration: 0,
    status: 'deployed',
  };
}

function status(deploymentId) {
  const h = health();
  if (h.status === 'missing_credentials') {
    return { provider: 'vercel', deploymentId, status: 'unknown', message: 'Vercel credentials not configured' };
  }
  const result = _exec(`vercel inspect ${deploymentId} --token="${process.env.VERCEL_TOKEN}"`, process.cwd());
  if (!result.success) return { provider: 'vercel', deploymentId, status: 'unknown', error: result.output };
  return { provider: 'vercel', deploymentId, status: 'deployed', output: result.output };
}

function rollback(deploymentId) {
  const h = health();
  if (h.status === 'missing_credentials') {
    return { success: true, simulated: true, provider: 'vercel', deploymentId, status: 'rolled_back', message: 'Simulated rollback — Vercel credentials not configured' };
  }
  const result = _exec(`vercel rollback ${deploymentId} --token="${process.env.VERCEL_TOKEN}"`, process.cwd());
  if (!result.success) return { success: false, provider: 'vercel', error: result.output };
  return { success: true, provider: 'vercel', deploymentId, status: 'rolled_back' };
}

registerProvider('vercel', { deploy, status, rollback, health });

module.exports = { deploy, status, rollback, health };
