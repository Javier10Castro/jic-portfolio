# Storage Abstraction Architecture

## Overview

The Storage Abstraction Layer provides a unified, provider-agnostic interface for blob, file, and object storage operations. Supports multiple cloud providers (S3, Azure Blob, GCS, MinIO) and local filesystem, all with simulation mode for development without credentials.

## StorageManager

Central orchestrator managing provider registration, selection, and lifecycle. Routes storage operations to the appropriate provider based on configuration.

```
StorageManager
├── registerProvider(name, provider) → void
├── getProvider(name) → StorageProvider
├── listProviders() → string[]
├── defaultProvider → string
└── health() → Map<string, ProviderHealth>
```

## BlobStorage

Binary large object storage with streaming support. Optimized for large files (images, videos, binaries).

| Operation | Description |
|---|---|
| upload(key, blob, options) | Upload blob with metadata |
| download(key) → Blob | Download blob as stream |
| delete(key) | Delete blob |
| exists(key) → boolean | Check blob existence |
| list(prefix) → Blob[] | List blobs by prefix |
| getUrl(key, options) → string | Generate signed/unsigned URL |
| copy(source, dest) | Copy blob between keys |

## FileStorage

File-oriented storage with directory semantics. Supports hierarchical paths, metadata, and streaming.

| Operation | Description |
|---|---|
| writeFile(path, data, options) | Write file |
| readFile(path) → Buffer | Read file |
| deleteFile(path) | Delete file |
| listDirectory(path) → FileEntry[] | List directory contents |
| moveFile(source, dest) | Move/rename file |
| copyFile(source, dest) | Copy file |
| getFileInfo(path) → FileInfo | File metadata (size, modified, type) |

## ObjectStorage

Object storage with rich metadata, tagging, and lifecycle management.

| Operation | Description |
|---|---|
| putObject(key, data, metadata) | Store object |
| getObject(key) → Object | Retrieve object |
| deleteObject(key) | Delete object |
| listObjects(prefix) → Object[] | List objects |
| copyObject(source, dest) | Copy object |
| tagObject(key, tags) | Apply tags |
| getObjectMetadata(key) → Metadata | Get metadata |

## AssetManager

Asset lifecycle management: upload, optimize, transform, version, and deliver.

```
AssetManager
├── uploadAsset(file, options) → Asset
├── getAsset(id) → Asset
├── deleteAsset(id) → void
├── transformAsset(id, transformations) → Asset
├── optimizeAsset(id, options) → Asset
├── createVersion(id) → AssetVersion
└── getDeliveryUrl(id, options) → string
```

## CdnManager

Content delivery network management for cache invalidation, purging, and预热.

| Operation | Description |
|---|---|
| invalidate(paths) | Purge CDN cache for paths |
| invalidateByTag(tag) | Purge by tag |
| getCacheStatus(path) → CacheStatus | Check cache status |
| configureDomain(domain, options) | Manage CDN domains |
| getMetrics() → CDNMetrics | CDN performance metrics |

## Provider Architecture

```
StorageProvider (abstract interface)
    ↑           ↑           ↑           ↑           ↑
    │           │           │           │           │
S3Provider  AzureBlob   GCS        MinIO      LocalStorage
            Provider    Provider   Provider    Provider
```

### S3Provider
- Amazon S3 and compatible (DigitalOcean Spaces, Wasabi, etc.)
- Features: multipart upload, signed URLs, bucket policies, lifecycle rules, encryption (SSE-S3/SSE-KMS), versioning

### AzureBlobProvider
- Azure Blob Storage
- Features: block/append/page blobs, SAS tokens, tier management (hot/cool/archive), soft delete, immutability

### GoogleCloudStorageProvider
- Google Cloud Storage
- Features: object composition, signed URLs, bucket locking, object holds, lifecycle management, requester pays

### MinIOProvider
- MinIO (self-hosted S3-compatible)
- Features: bucket policies, SSE, versioning, object locking, console UI

### LocalStorageProvider
- Local filesystem
- Features: path-based operations, streaming, metadata, directory management, no credentials needed

## Provider-agnostic Interface

All providers implement the same interface, enabling seamless switching:

```javascript
class StorageProvider {
  async upload(key, data, options)    // Upload data
  async download(key)                  // Download data
  async delete(key)                    // Delete data
  async exists(key)                    // Check existence
  async list(prefix)                   // List entries
  async copy(source, dest)             // Copy data
  async move(source, dest)             // Move data
  async getMetadata(key)               // Get metadata
  async health()                       // Provider health check
}
```

## Simulation Mode

All providers support simulation mode for development and testing without real credentials. Simulation mode:
- Uses local filesystem as backing store
- Returns realistic responses matching provider behavior
- Tracks operations for verification
- Supports configurable latency simulation
- Enables offline development
