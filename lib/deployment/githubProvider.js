const { execSync } = require('child_process');
const fs = require('fs');
const { registerProvider } = require('./deploymentProvider');

function _exec(cmd, cwd) {
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe', timeout: 60000 });
    return { success: true, output: out.trim() };
  } catch (err) {
    return { success: false, output: (err.stderr || err.message || '').trim() };
  }
}

function _isAvailable(cmd) {
  try {
    const r = process.platform === 'win32'
      ? execSync(`where ${cmd}`, { stdio: 'pipe', encoding: 'utf-8' })
      : execSync(`which ${cmd}`, { stdio: 'pipe', encoding: 'utf-8' });
    return !!r;
  } catch { return false; }
}

function health() {
  const ghAvailable = _isAvailable('gh');
  const gitAvailable = _isAvailable('git');
  return {
    provider: 'github',
    status: (ghAvailable && gitAvailable) ? 'ready' : 'missing_tools',
    gitInstalled: gitAvailable,
    ghInstalled: ghAvailable,
    ghAuthenticated: ghAvailable ? _exec('gh auth status', process.cwd()).success : false,
  };
}

function deploy({ buildPath, projectName, version, commitSha, repository, branch }) {
  const cwd = buildPath || process.cwd();
  const repoName = repository || projectName || 'generated-site';
  const branchName = branch || 'main';

  if (!fs.existsSync(cwd)) {
    return { success: false, provider: 'github', status: 'failed', error: `Build path does not exist: ${cwd}` };
  }

  const gitInit = _exec('git init', cwd);
  if (!gitInit.success) return { success: false, provider: 'github', status: 'failed', error: 'git init failed', detail: gitInit.output };

  _exec(`git checkout -b ${branchName}`, cwd);
  _exec('git add .', cwd);
  const commitResult = _exec(`git commit -m "deploy: ${projectName || 'generated site'} v${version || '1.0.0'}"`, cwd);

  if (!commitResult.success && !commitResult.output.includes('nothing to commit')) {
    return { success: false, provider: 'github', status: 'failed', error: 'git commit failed', detail: commitResult.output };
  }

  if (!_isAvailable('gh')) {
    const now = new Date().toISOString();
    return {
      success: true, simulated: true, provider: 'github',
      deploymentId: `gh-sim-${Date.now().toString(36)}`,
      repository: repoName,
      branch: branchName,
      version: version || 'v1.0.0',
      commitSha: commitSha || (commitResult.success ? commitResult.output.match(/[a-f0-9]{7,}/)?.[0] || 'unknown' : 'unknown'),
      deployedAt: now,
      status: 'committed_locally',
      message: `GitHub CLI not available. Repository ${repoName} initialized locally with commit. Push manually:\n  cd ${cwd}\n  git remote add origin https://github.com/YOUR_USER/${repoName}.git\n  git push -u origin ${branchName}`,
    };
  }

  const authCheck = _exec('gh auth status', cwd);
  if (!authCheck.success) {
    return { success: false, provider: 'github', status: 'failed', error: 'GitHub CLI not authenticated', instruction: 'Run: gh auth login' };
  }

  const repoCreate = _exec(`gh repo create ${repoName} --public --source=. --remote=origin --push`, cwd);
  if (!repoCreate.success) {
    return { success: false, provider: 'github', status: 'failed', error: 'Failed to create GitHub repository', detail: repoCreate.output };
  }

  const tagName = `v${version || '1.0.0'}`;
  _exec(`git tag ${tagName}`, cwd);
  _exec(`git push origin ${tagName}`, cwd);

  const now = new Date().toISOString();
  const headSha = _exec('git rev-parse HEAD', cwd).output;
  return {
    success: true, simulated: false, provider: 'github',
    deploymentId: `gh-${Date.now().toString(36)}`,
    repository: repoName,
    branch: branchName,
    commitSha: headSha || commitSha || 'unknown',
    version: version || 'v1.0.0',
    releaseTag: tagName,
    deployedAt: now,
    status: 'pushed',
    url: `https://github.com/YOUR_USER/${repoName}`,
  };
}

function status(deploymentId) {
  return { provider: 'github', deploymentId, status: 'unknown', message: 'GitHub status requires repository inspection' };
}

function rollback(deploymentId) {
  return { success: true, simulated: true, provider: 'github', deploymentId, status: 'rolled_back', message: 'GitHub rollback requires manual revert via git revert or gh CLI' };
}

registerProvider('github', { deploy, status, rollback, health });

module.exports = { deploy, status, rollback, health };
