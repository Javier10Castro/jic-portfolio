const { BlobStorage } = require('./blobStorage');
const { FileStorage } = require('./fileStorage');
const { AssetManager } = require('./assetManager');
const { CdnManager } = require('./cdnManager');

class ObjectStorage {
  constructor() {
    this._blobStorage = new BlobStorage();
    this._fileStorage = new FileStorage();
    this._assetManager = new AssetManager();
    this._cdnManager = new CdnManager();
  }

  store(key, data, options) {
    return this._blobStorage.store(key, data, options);
  }

  retrieve(key) {
    return this._blobStorage.retrieve(key);
  }

  delete(key) {
    return this._blobStorage.delete(key);
  }

  list(prefix) {
    return this._blobStorage.list(prefix);
  }

  getStorageInfo() {
    return {
      totalObjects: this._blobStorage.list('').length,
      totalSize: this._blobStorage.list('').reduce((acc, k) => {
        const b = this._blobStorage.retrieve(k);
        return acc + (b ? b.size : 0);
      }, 0),
      providers: ['blobStorage', 'fileStorage']
    };
  }

  clear() {
    this._blobStorage.clear();
    this._fileStorage.clear();
    this._assetManager.clear();
    this._cdnManager.clear();
  }
}

module.exports = { ObjectStorage };
