class S3Provider {
  constructor() { this.name = 's3'; }
  connect(config) { if (!config.region) return { success: false, error: 'region required' }; return { success: true, instance: { provider: 's3', config } }; }
  listBuckets(instance) { return { success: true, buckets: [{ name: 'data-bucket', created: Date.now() }] }; }
  listObjects(instance, bucket, prefix) { return { success: true, objects: [{ key: 'file.txt', size: 1024, lastModified: Date.now() }] }; }
  upload(instance, bucket, key, body) { return { success: true, key, etag: 'abc123' }; }
  download(instance, bucket, key) { return { success: true, body: 'file content', contentType: 'text/plain' }; }
  delete(instance, bucket, key) { return { success: true }; }
}
module.exports = { S3Provider };
