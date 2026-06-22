# Enterprise Data Platform

## Overview

The Enterprise Data Platform provides a unified, provider-agnostic data infrastructure spanning relational databases, NoSQL stores, vector search, knowledge management, caching, search, analytics, backup/replication, and data quality. 70+ modules across 11 subdirectories implement a comprehensive data layer with simulation-mode compatibility across all providers.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         DataPlatform (lib/data/)                              │
│                                                                              │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ DataManager  │  │ StorageMgr │  │ Transaction  │  │   Repository        │ │
│  │ (registry)   │  │ (provider  │  │ Manager     │  │   (generic pattern)  │ │
│  │              │  │  abstract) │  │(begin/commit │  │                      │ │
│  │              │  │            │  │ /rollback)   │  │                      │ │
│  └─────────────┘  └────────────┘  └─────────────┘  └──────────────────────┘ │
│                                                                              │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Connection   │  │ DataStorage │  │ DataEvents  │  │   DataMetrics       │ │
│  │ Manager      │  │ (key-value) │  │ (20+ types) │  │   (recording + agg) │ │
│  └─────────────┘  └────────────┘  └─────────────┘  └──────────────────────┘ │
│                                                                              │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ DataHealth   │  │ DataEncrypt│  │ DataCompress │  │   DataRetention     │ │
│  │ (monitoring) │  │ (encrypt)  │  │ (compress)   │  │   (policies)        │ │
│  └─────────────┘  └────────────┘  └─────────────┘  └──────────────────────┘ │
│                                                                              │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ DataIntegr. │  │ AdapterReg.│  │ Migrations   │  │   Schema             │ │
│  │ (10 hooks)  │  │ (register) │  │ (lifecycle)  │  │   (management)       │ │
│  └─────────────┘  └────────────┘  └─────────────┘  └──────────────────────┘ │
│                                                                              │
│  ┌─────────────┐  ┌────────────┐                                              │
│  │ BackupManager│  │ RestoreMgr │  │ Replication  │                              │
│  └─────────────┘  └────────────┘  └─────────────┘                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────────┐
          ▼                         ▼                             ▼
┌──────────────────┐   ┌─────────────────────┐   ┌─────────────────────────┐
│  Provider Layer   │   │   Cache Layer       │   │   Vector Search Stack   │
│  (7 DB providers) │   │  (memory/redis/     │   │  (embed → index →       │
│  PostgreSQL/MySQL │   │   distributed/      │   │   semantic → hybrid →   │
│  SQLite/MongoDB   │   │   invalidation)     │   │   rerank)               │
│  Redis/Elastic/   │   │                     │   │                         │
│  DuckDB)          │   │                     │   │                         │
└──────────────────┘   └─────────────────────┘   └─────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────────┐
          ▼                         ▼                             ▼
┌──────────────────┐   ┌─────────────────────┐   ┌─────────────────────────┐
│  Knowledge Base   │   │  Search Engine      │   │  Analytics Warehouse    │
│  (document→chunk  │   │  (full-text +       │   │  (query→aggregate→     │
│   →index→version→ │   │   semantic + hybrid │   │   materialize→report)   │
│   snapshot)       │   │   + index mgmt)     │   │                         │
└──────────────────┘   └─────────────────────┘   └─────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │  Backup / Replication        │
                    │  (snapshot → replicate →     │
                    │   retain → restore)          │
                    └─────────────────────────────┘
```

## Storage Abstraction

Provider-agnostic storage with a unified interface. Seven database providers, all compatible with simulation mode (no credentials required).

| Provider | Type | Simulation Mode |
|---|---|---|
| PostgreSQL | Relational | ✅ |
| MySQL | Relational | ✅ |
| SQLite | Embedded | ✅ |
| MongoDB | Document | ✅ |
| Redis | Key-Value/Cache | ✅ |
| Elasticsearch | Search/Analytics | ✅ |
| DuckDB | Analytical/Embedded | ✅ |

## Repository Pattern

Generic repository pattern providing CRUD operations, query building, pagination, filtering, and transaction support across all database providers.

```
Repository<T>
├── create(data) → T
├── findById(id) → T | null
├── findAll(query) → T[]
├── update(id, data) → T
├── delete(id) → boolean
├── paginate(options) → Page<T>
├── query(spec) → T[]
└── transaction(fn) → T
```

## Vector Search Pipeline

End-to-end vector search: text → embedding → index → semantic search → hybrid (semantic + keyword) → rerank → results.

```
Query Text
    ↓
EmbeddingManager → EmbeddingProviders (multiple providers)
    ↓
VectorStore → IndexManager
    ↓
SemanticSearch → SimilaritySearch
    ↓
HybridSearch (weighted semantic + keyword)
    ↓
Reranker (cross-encoder, score normalization, diversity)
    ↓
Results
```

## Knowledge Base

Document management with chunking, indexing, versioning, and snapshot support.

```
Document → Chunk → Index → Store → Version → Snapshot
                ↓
           KnowledgeBase orchestrator
                ↓
         KnowledgeRetriever (query → search → rank → results)
```

## Cache Hierarchy

Multi-level cache with eviction policies and invalidation strategies.

```
Memory Cache (L1) → Redis Cache (L2) → Distributed Cache (L3)
                           ↓
                    Cache Policies (TTL, LFU, LRU, FIFO)
                           ↓
                    Cache Invalidation (key/pattern/tag/stale)
```

## Search Architecture

Full-text search with index management and query optimization.

```
SearchEngine
├── FullTextSearch (lexical, fuzzy, phrase)
├── SemanticSearch (vector-based)
├── HybridSearch (combined)
├── IndexManager (create, update, rebuild, optimize)
└── QueryOptimizer (rewrite, expand, normalize, cache)
```

## Backup Strategy

Comprehensive backup and recovery with replication.

```
BackupManager
├── Full Backup → Snapshot → Replicate
├── Incremental Backup → Snapshot → Replicate
├── Retention Policies (count, age, size)
└── Restore Manager (full, point-in-time, selective)
```

## Migration Flow

Schema versioning with forward/rollback support.

```
Schema Versioning → Migration Runner → Seeds → Rollback
                           ↓
                    MigrationHistory
                           ↓
                    MigrationGenerator (scaffold new migrations)
```

## Analytics

Data warehouse with query engine, aggregation engine, and materialized views.

```
AnalyticsWarehouse
├── QueryEngine (SQL, pipeline)
├── AggregationEngine (rollups, cubes)
├── MetricsStore (counters, gauges, histograms)
└── MaterializedViews (auto-refresh, incremental)
```

## Data Quality

Validation, deduplication, integrity, and consistency checking.

```
DataQuality
├── Validator (schema, type, constraint, format)
├── Deduplicator (exact, fuzzy, ML-based)
├── IntegrityChecker (referential, constraint, checksum)
└── ConsistencyChecker (cross-system, temporal, business rule)
```
