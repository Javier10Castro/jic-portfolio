const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.resolve(__dirname, '../../data/conversations');

function _ensureDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function _filePath(id) {
  return path.join(STORAGE_DIR, `${id}.json`);
}

function save(conversation) {
  _ensureDir();
  const fp = _filePath(conversation.id);
  fs.writeFileSync(fp, JSON.stringify(conversation, null, 2), 'utf-8');
  return { success: true, path: fp };
}

function load(id) {
  _ensureDir();
  const fp = _filePath(id);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {
    return null;
  }
}

function remove(id) {
  _ensureDir();
  const fp = _filePath(id);
  if (fs.existsSync(fp)) {
    fs.unlinkSync(fp);
    return { success: true };
  }
  return { success: false, reason: 'not_found' };
}

function list() {
  _ensureDir();
  const files = fs.readdirSync(STORAGE_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(STORAGE_DIR, f), 'utf-8'));
      return {
        id: data.id,
        title: data.session?.metadata?.title || data.metadata?.title || 'Untitled',
        status: data.session?.status || data.status || 'unknown',
        createdAt: data.session?.createdAt || data.createdAt,
        updatedAt: data.session?.updatedAt || data.updatedAt,
        messageCount: (data.session?.messages || data.messages || []).length,
        projectId: data.session?.projectId || data.projectId || null,
        workspaceId: data.session?.workspaceId || data.workspaceId || null,
      };
    } catch { return null; }
  }).filter(Boolean);
}

function exists(id) {
  return fs.existsSync(_filePath(id));
}

module.exports = { save, load, remove, list, exists, STORAGE_DIR };
