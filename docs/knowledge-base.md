# Knowledge Base Architecture

## Overview

The Knowledge Base subsystem provides end-to-end document management for AI-powered applications. Documents are ingested, chunked, indexed, stored with versioning, and retrievable through semantic search. Snapshots provide point-in-time views of the knowledge base state.

## Components

### KnowledgeBase
Central orchestrator coordinating the full knowledge lifecycle. Exposes high-level operations: add document, search, retrieve, version, snapshot, and restore.

```
KnowledgeBase
├── addDocument(doc) → documentId
├── search(query, options) → results[]
├── retrieve(documentId) → Document
├── createVersion(label) → Version
├── listVersions() → Version[]
├── restoreVersion(versionId) → void
├── createSnapshot(label) → Snapshot
├── listSnapshots() → Snapshot[]
└── restoreSnapshot(snapshotId) → void
```

### KnowledgeIndexer
Handles document processing pipeline: receives raw documents, applies chunking strategy, generates embeddings via VectorManager, and stores indexed chunks in VectorStore with metadata.

### KnowledgeRetriever
Handles query-time retrieval: embeds the query, searches VectorStore, applies reranking, and returns ranked results with relevance scores.

### KnowledgeChunks
Manages chunking configuration and strategy. Supports configurable chunk size, overlap, and boundary detection.

### KnowledgeVersioning
Manages version snapshots of the knowledge base. Each version captures the complete state of all indexed documents at a point in time.

### KnowledgeSnapshots
Manages named snapshots with metadata, labels, and optional expiration.

## Document Lifecycle

```
Add Document
    ↓
KnowledgeBase.addDocument(document)
    ↓
KnowledgeIndexer.process(document)
    ↓
KnowledgeChunks.chunk(document.content, strategy)
    ↓
For each chunk:
    ├── EmbeddingManager.embed(chunk.text)
    ├── VectorStore.store(embedding, chunk.metadata)
    └── KnowledgeIndexer.record(documentId, chunkIds)
    ↓
KnowledgeBase.version() (optional auto-version)
    ↓
Complete
```

## Chunking Strategy

### Configuration

| Parameter | Default | Range | Description |
|---|---|---|---|
| chunkSize | 512 | 128–8192 | Target tokens per chunk |
| chunkOverlap | 64 | 0–512 | Overlap between consecutive chunks |
| boundaryMode | sentence | sentence/word/paragraph/token | How to respect natural boundaries |

### Boundary Detection

| Mode | Behavior |
|---|---|
| sentence | Split at sentence boundaries within chunkSize tolerance |
| word | Split at word boundaries |
| paragraph | Split at paragraph breaks, merge small paragraphs |
| token | Split at exact token count, no boundary respect |

### Strategy

```
chunk(text, { chunkSize, chunkOverlap, boundaryMode })
    ↓
Split text into segments at natural boundaries
    ↓
Merge segments into chunks of target size
    ↓
Apply overlap: each chunk overlaps with previous by chunkOverlap tokens
    ↓
Return Chunk[] with position, text, metadata
```

## Retrieval

```
Query
    ↓
KnowledgeRetriever.search(query, { k, threshold, namespace })
    ↓
EmbeddingManager.embed(query) → queryVector
    ↓
SemanticSearch.search(queryVector, { k: k * 2 })
    ↓
Filter by score > threshold
    ↓
Rerank results (cross-encoder or diversity)
    ↓
Return top-k results with: chunk, documentId, score, metadata
```

## Version Management

| Operation | Description |
|---|---|
| Create Version | Snapshot current index state with auto-increment label |
| List Versions | Retrieve version history with timestamps |
| Get Version | Full version metadata including document count, size |
| Restore Version | Rebuild index from version snapshot |
| Diff Versions | Compare added/removed/changed documents |
| Auto-Version | Configurable auto-versioning (per N documents, daily) |

## Snapshots

| Operation | Description |
|---|---|
| Create Snapshot | Named point-in-time capture with metadata |
| List Snapshots | All snapshots with labels, timestamps, size |
| Get Snapshot | Snapshot metadata and contents |
| Restore Snapshot | Full restore from snapshot |
| Delete Snapshot | Remove snapshot, preserve current state |
| Expiration | Optional TTL-based auto-cleanup |
