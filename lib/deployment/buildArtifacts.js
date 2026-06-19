const fs = require('fs');
const path = require('path');

function packageBuild({ buildPath, projectName, version }) {
  if (!buildPath || !fs.existsSync(buildPath)) {
    return { success: false, error: `Build path does not exist: ${buildPath}` };
  }

  const files = [];
  const entries = _walkDir(buildPath);
  let totalSize = 0;

  for (const filePath of entries) {
    const stat = fs.statSync(filePath);
    const relative = path.relative(buildPath, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    files.push({ path: relative, size: stat.size, content });
    totalSize += stat.size;
  }

  const manifest = {
    projectName: projectName || 'generated-site',
    version: version || 'v1.0.0',
    files: files.map(f => ({ path: f.path, size: f.size })),
    totalFiles: files.length,
    totalSize,
    packagedAt: new Date().toISOString(),
    format: 'fileset',
  };

  return { success: true, manifest, files };
}

function _walkDir(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  for (const entry of list) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(..._walkDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function compressBuild(buildArtifacts) {
  if (!buildArtifacts || !buildArtifacts.files) {
    return { success: false, error: 'No build artifacts to compress' };
  }
  const compressed = Buffer.from(JSON.stringify(buildArtifacts.manifest)).toString('base64');
  return { success: true, compressed, originalSize: buildArtifacts.manifest.totalSize };
}

module.exports = { packageBuild, compressBuild };
