const fs = require('fs');
const path = require('path');

function createProjectDir(name) {
  const dir = path.resolve(name);
  if (fs.existsSync(dir)) {
    throw new Error(`Directory "${name}" already exists`);
  }
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createDirectories(basePath) {
  const dirs = [
    'assets/css',
    'assets/js',
    'assets/img'
  ];
  for (const dir of dirs) {
    fs.mkdirSync(path.join(basePath, dir), { recursive: true });
  }
}

function writeFile(basePath, filePath, content) {
  const fullPath = path.join(basePath, filePath);
  fs.writeFileSync(fullPath, content, 'utf-8');
}

function createAssetPlaceholders(basePath) {
  const css = path.join(basePath, 'assets/css/style.css');
  const js = path.join(basePath, 'assets/js/main.js');
  if (!fs.existsSync(css)) fs.writeFileSync(css, '/* scaffold placeholder */\n', 'utf-8');
  if (!fs.existsSync(js)) fs.writeFileSync(js, '// scaffold placeholder\n', 'utf-8');
}

function sanitizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

module.exports = { createProjectDir, createDirectories, writeFile, createAssetPlaceholders, sanitizeName };
