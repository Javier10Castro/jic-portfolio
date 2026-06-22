# Vector Search Architecture

## Overview

The Vector Search stack provides end-to-end vector search capabilities: embedding generation, vector storage and indexing, semantic search, hybrid search (semantic + keyword), and result reranking. Supports multiple vector database providers and embedding providers with a unified API.

## Components

### VectorManager
Central orchestrator that coordinates the full vector search pipeline. Manages embedding, indexing, search, and reranking operations through a unified interface.

### VectorStore
Abstract interface for vector database operations. Implementations handle vector CRUD, similarity search, index management, and metadata filtering.

### EmbeddingManager
Orchestrates embedding generation across multiple providers. Handles provider selection, fallback chains, batch processing, caching, and rate limiting.

### EmbeddingProviders
Provider abstraction for embedding models. Supports multiple providers:

| Provider | Models | Dimensions |
|---|---|---|
| OpenAI | text-embedding-3-small, text-embedding-3-large | 512–3072 |
| Anthropic | embedding-v1 | 1024 |
| Cohere | embed-english-v3, embed-multilingual-v3 | 1024 |
| HuggingFace | Various models | Configurable |
| Local | ONNX, sentence-transformers | Configurable |

### SemanticSearch
Pure vector-based semantic search. Converts query to embedding and finds nearest neighbors in vector space.

### SimilaritySearch
Configurable similarity algorithms with support for multiple distance metrics.

### HybridSearch
Combines semantic (vector) search with keyword (lexical) search using weighted scoring.

### Reranker
Re-ranks initial search results using cross-encoders or other scoring models for improved relevance.

## Embedding Pipeline

```
Text Input
    ↓
EmbeddingManager.selectProvider(query, options)
    ↓
EmbeddingProviders.embed(text, { model, dimensions })
    ↓
Normalize vector
    ↓
Cache embedding (optional)
    ↓
VectorStore.store(embedding, metadata, namespace)
    ↓
IndexManager.buildIndex(namespace, algorithm)
```

## Search Pipeline

```
Search Query
    ↓
VectorManager.search(query, options)
    ↓
EmbeddingManager.embed(query) → query vector
    ↓
SemanticSearch.search(vector, { k, filters, namespace })
    ↓
Optionally: HybridSearch (weighted semantic + keyword)
    ↓
Optionally: Reranker (cross-encoder, diversity, score normalization)
    ↓
Results (ranked, scored, with metadata)
```

## Provider Support

| Provider | Type | Features | Simulation |
|---|---|---|---|
| Chroma | Embedded | Metadata filtering, collections, persistence | ✅ |
| PgVector | PostgreSQL | Full SQL integration, indexes, ACID | ✅ |
| Pinecone | SaaS | Managed, auto-scaling, namespaces | ✅ |
| Qdrant | Self-hosted/SaaS | Filters, payload, sharding | ✅ |
| Weaviate | Self-hosted/SaaS | Graph + vector, hybrid, modules | ✅ |

## Similarity Algorithms

| Algorithm | Metric | Use Case |
|---|---|---|
| Cosine Similarity | cos(θ) | General purpose, normalized vectors |
| Euclidean Distance | L2 | Dense vectors, magnitude-sensitive |
| Dot Product | a·b | Normalized vectors, efficiency |
| Manhattan Distance | L1 | Sparse vectors, robustness |
| Minkowski Distance | Lp | Configurable p-norm |
| Hamming Distance | Bits | Binary embeddings |

## Hybrid Search

Weighted combination of semantic (vector) and keyword (lexical) search:

```
score = α × semanticScore + (1 - α) × keywordScore
```

- **α** configurable per query type (default 0.7)
- **Keyword search**: TF-IDF, BM25, or full-text index
- **Normalization**: Min-max or z-score normalize before combining
- **Fusion strategies**: Weighted sum, reciprocal rank fusion (RRF), or convex combination

## Reranking Strategies

| Strategy | Description |
|---|---|
| Cross-encoder | Transformer-based pairwise scoring |
| Score normalization | Min-max, z-score, or rank-based normalization |
| Diversity | MMR (Maximal Marginal Relevance) for result diversity |
| Recency | Boost recent results by timestamp decay |
| Authority | Boost by source authority/reliability score |
| Custom | Pluggable reranking functions |
