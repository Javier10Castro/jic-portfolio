class AzureBlobProvider {
  constructor() { this.name = 'azure-blob'; }
  connect(config) { if (!config.connectionString) return { success: false, error: 'connectionString required' }; return { success: true, instance: { provider: 'azure-blob', config } }; }
  listContainers(instance) { return { success: true, containers: [{ name: 'data-container' }] }; }
  listBlobs(instance, container, prefix) { return { success: true, blobs: [{ name: 'file.json', size: 512 }] }; }
  upload(instance, container, blob, body) { return { success: true, blob, etag: 'ghi789' }; }
  download(instance, container, blob) { return { success: true, body: 'azure content' }; }
  delete(instance, container, blob) { return { success: true }; }
}
module.exports = { AzureBlobProvider };
