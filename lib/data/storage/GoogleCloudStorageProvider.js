class GoogleCloudStorageProvider {
  constructor() { this.name = 'gcs'; }
  connect(config) { if (!config.projectId) return { success: false, error: 'projectId required' }; return { success: true, instance: { provider: 'gcs', config } }; }
  listBuckets(instance) { return { success: true, buckets: [{ name: 'gcs-bucket' }] }; }
  listObjects(instance, bucket, prefix) { return { success: true, objects: [{ name: 'data.csv', size: 256 }] }; }
  upload(instance, bucket, object, body) { return { success: true, object, etag: 'jkl012' }; }
  download(instance, bucket, object) { return { success: true, body: 'gcs content' }; }
  delete(instance, bucket, object) { return { success: true }; }
}
module.exports = { GoogleCloudStorageProvider };
