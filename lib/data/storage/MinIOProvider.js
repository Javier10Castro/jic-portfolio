class MinIOProvider {
  constructor() { this.name = 'minio'; }
  connect(config) { if (!config.endpoint) return { success: false, error: 'endpoint required' }; return { success: true, instance: { provider: 'minio', config } }; }
  listBuckets(instance) { return { success: true, buckets: [{ name: 'minio-bucket' }] }; }
  listObjects(instance, bucket, prefix) { return { success: true, objects: [{ key: 'backup.zip', size: 2048 }] }; }
  upload(instance, bucket, key, body) { return { success: true, key, etag: 'def456' }; }
  download(instance, bucket, key) { return { success: true, body: 'minio content' }; }
  delete(instance, bucket, key) { return { success: true }; }
}
module.exports = { MinIOProvider };
