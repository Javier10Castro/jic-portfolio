const fs = require('fs');
const path = require('path');

const STORAGE_PATH = path.resolve(__dirname, '../../data/deployments.json');

function _ensureStorage() {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORAGE_PATH)) fs.writeFileSync(STORAGE_PATH, '[]', 'utf-8');
}

function _readAll() {
  _ensureStorage();
  try { return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8')); } catch { return []; }
}

function _writeAll(list) {
  _ensureStorage();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(list, null, 2), 'utf-8');
}

function record(entry) {
  if (!entry || !entry.deploymentId) throw new Error('deploymentId is required');
  const list = _readAll();
  entry.timestamp = entry.timestamp || new Date().toISOString();
  list.push(entry);
  _writeAll(list);
  return entry;
}

function getHistory() {
  return _readAll().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function latest() {
  const list = _readAll();
  if (list.length === 0) return null;
  return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
}

function find(id) {
  if (!id) return null;
  return _readAll().find(d => d.deploymentId === id) || null;
}

function findByVersion(version) {
  if (!version) return [];
  return _readAll().filter(d => d.version === version);
}

function findByName(projectName) {
  if (!projectName) return [];
  return _readAll().filter(d => d.projectName === projectName || d.project_name === projectName);
}

function updateStatus(deploymentId, status) {
  const list = _readAll();
  const entry = list.find(d => d.deploymentId === deploymentId);
  if (!entry) return null;
  entry.status = status;
  entry.updatedAt = new Date().toISOString();
  _writeAll(list);
  return entry;
}

function clear() {
  _writeAll([]);
}

module.exports = { record, getHistory, latest, find, findByVersion, findByName, updateStatus, clear };
