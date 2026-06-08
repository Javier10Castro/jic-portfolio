const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEPLOY_STORAGE = path.resolve(__dirname, '../../data/deployments.json');

function ensureStorage() {
  const dir = path.dirname(DEPLOY_STORAGE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DEPLOY_STORAGE)) fs.writeFileSync(DEPLOY_STORAGE, '[]', 'utf-8');
}

function readDeployments() {
  ensureStorage();
  try { return JSON.parse(fs.readFileSync(DEPLOY_STORAGE, 'utf-8')); } catch { return []; }
}

function writeDeployments(list) {
  ensureStorage();
  fs.writeFileSync(DEPLOY_STORAGE, JSON.stringify(list, null, 2), 'utf-8');
}

function _exec(cmd, cwd) {
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' });
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

function initRepository(projectPath) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path does not exist', path: projectPath };
  }

  const gitCheck = _exec('git --version', projectPath);
  if (!gitCheck.success) {
    return { success: false, error: 'Git is not installed or not in PATH', instruction: 'Install Git from https://git-scm.com/' };
  }

  const init = _exec('git init', projectPath);
  if (!init.success) return { success: false, error: 'git init failed', output: init.output };

  const branch = _exec('git branch -M main', projectPath);
  if (!branch.success) return { success: false, error: 'git branch failed', output: branch.output };

  const status = _exec('git status', projectPath);
  return { success: true, output: status.output };
}

function createGitHubRepo(name, projectPath) {
  if (!name) return { success: false, error: 'Repository name is required' };

  if (!_isAvailable('gh')) {
    return {
      success: false,
      available: false,
      instruction: `GitHub CLI (gh) is not installed. To create repo manually:\n  1. Go to https://github.com/new\n  2. Create a repo named "${name}"\n  3. Run: git remote add origin https://github.com/YOUR_USER/${name}.git`,
    };
  }

  const authCheck = _exec('gh auth status', projectPath);
  if (!authCheck.success) {
    return { success: false, error: 'GitHub CLI is not authenticated', instruction: 'Run: gh auth login' };
  }

  const result = _exec(`gh repo create ${name} --public --source=. --remote=origin`, projectPath);
  if (!result.success) return { success: false, error: 'Failed to create GitHub repo', output: result.output };

  return { success: true, output: `Repository "${name}" created on GitHub` };
}

function commitProject(projectPath) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path does not exist', path: projectPath };
  }

  const add = _exec('git add .', projectPath);
  if (!add.success) return { success: false, error: 'git add failed', output: add.output };

  const commit = _exec('git commit -m "feat: initial deployment"', projectPath);
  if (!commit.success) {
    if (commit.output.includes('nothing to commit') || commit.output.includes('no changes')) {
      return { success: false, error: 'Nothing to commit — working tree clean' };
    }
    return { success: false, error: 'git commit failed', output: commit.output };
  }

  return { success: true, output: commit.output };
}

function pushToRemote(projectPath) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path does not exist', path: projectPath };
  }

  const remoteCheck = _exec('git remote -v', projectPath);
  if (!remoteCheck.success || !remoteCheck.output) {
    return { success: false, error: 'No remote configured', instruction: 'Run: createGitHubRepo() first or git remote add origin <url>' };
  }

  const push = _exec('git push -u origin main', projectPath);
  if (!push.success) return { success: false, error: 'git push failed', output: push.output };

  return { success: true, output: push.output };
}

function registerDeployment({ project_name, repo_url, status, engine_version }) {
  if (!project_name) throw new Error('project_name is required');

  const deployments = readDeployments();

  const entry = {
    id: `deploy-${String(deployments.length + 1).padStart(3, '0')}`,
    project_name,
    repo_url: repo_url || '',
    status: status || 'pending',
    engine_version: engine_version || 'v1.0.0',
    timestamp: new Date().toISOString(),
  };

  deployments.push(entry);
  writeDeployments(deployments);
  return entry;
}

function listDeployments() {
  return readDeployments();
}

function deployFullPipeline(projectPath, { project_name, repo_url, engine_version } = {}) {
  if (!projectPath) return { success: false, error: 'projectPath is required' };
  if (!project_name) return { success: false, error: 'project_name is required' };

  const results = { init: null, commit: null, repo: null, push: null, register: null };
  let failed = false;

  results.init = initRepository(projectPath);
  if (!results.init.success) failed = true;

  if (!failed) {
    results.commit = commitProject(projectPath);
    if (!results.commit.success) {
      if (results.commit.error === 'Nothing to commit — working tree clean') {
        results.commit.success = true;
      } else {
        failed = true;
      }
    }
  }

  if (!failed) {
    results.repo = createGitHubRepo(project_name, projectPath);
    if (!results.repo.success && results.repo.available === false) {
      failed = true;
    }
  }

  if (!failed && results.repo && results.repo.success) {
    results.push = pushToRemote(projectPath);
    if (!results.push.success) failed = true;
  }

  const overallStatus = failed ? 'failed' : 'deployed';
  results.register = registerDeployment({
    project_name,
    repo_url: repo_url || (results.repo?.success ? `https://github.com/YOUR_USER/${project_name}` : ''),
    status: overallStatus,
    engine_version: engine_version || 'v1.0.0',
  });

  return { success: !failed, status: overallStatus, steps: results };
}

module.exports = {
  initRepository,
  createGitHubRepo,
  commitProject,
  pushToRemote,
  registerDeployment,
  listDeployments,
  deployFullPipeline,
};
