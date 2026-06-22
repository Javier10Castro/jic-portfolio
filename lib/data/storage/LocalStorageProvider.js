const path = require('path');
class LocalStorageProvider {
  constructor() { this.name = 'local'; this._files = {}; }
  connect(config) { this._basePath = config.basePath || './data'; return { success: true, instance: { provider: 'local', basePath: this._basePath } }; }
  listFiles(instance, dir) { return { success: true, files: [{ name: 'file.txt', size: 100, modified: Date.now() }] }; }
  writeFile(instance, filePath, content) { this._files[filePath] = content; return { success: true, path: filePath }; }
  readFile(instance, filePath) { return { success: true, content: this._files[filePath] || 'default content' }; }
  deleteFile(instance, filePath) { delete this._files[filePath]; return { success: true }; }
}
module.exports = { LocalStorageProvider };
