# Search Engine Architecture

## Overview

The Search Engine provides unified full-text, semantic, and hybrid search across application data. Includes index management (create, rebuild, optimize) and query optimization (rewrite, expand, cache).

## SearchEngine

Central orchestrator coordinating search operations, index lifecycle, and query optimization.

```
SearchEngine
├── search(query, options) → SearchResults
├── fullTextSearch(query, options) → SearchResults
├── semanticSearch(query, options) → SearchResults
├── hybridSearch(query, options) → SearchResults
├── indexManager → IndexManager
├── queryOptimizer → QueryOptimizer
└── health() → SearchEngineHealth
```

## FullTextSearch

Lexical search using inverted index with support for multiple scoring algorithms.

| Feature | Description |
|---|---|
| Tokenization | Whitespace, language-aware, custom |
| Normalization | Lowercase, stemming, lemmatization |
| Filtering | Stop words, min token length |
| Matching | Exact, prefix, fuzzy, phrase, wildcard |
| Scoring | TF-IDF, BM25, custom |
| Features | Field boosting, boolean operators, faceting, highlighting |

### Query Types

```
Exact:      "hello world"           → match entire phrase
Fuzzy:      helo~                   → edit distance 2
Prefix:     hello*                  → match prefix
Boolean:    hello AND world         → boolean operators
Field:      title:"hello world"     → field-scoped search
Range:      date:[2024 TO 2025]     → range query
```

## HybridSearch

Combines full-text and semantic search results using configurable fusion strategies.

```
HybridSearch.search(query, { alpha = 0.7 })
    ↓
fullTextResults = FullTextSearch.search(query, { limit: k * 2 })
    ↓
semanticResults = SemanticSearch.search(query, { limit: k * 2 })
    ↓
Normalize scores (min-max or z-score)
    ↓
Fuse: score = α × semanticScore + (1-α) × textScore
    ↓
Merge, deduplicate, sort by fused score
    ↓
Return top-k results
```

### Fusion Strategies

| Strategy | Description |
|---|---|
| Weighted Sum | α × semantic + (1-α) × keyword |
| Reciprocal Rank Fusion | RRF score = Σ 1/(rank + k) |
| Convex Combination | Min-max normalize then weighted sum |
| Rank-Based | Interleave results by rank position |

## SemanticSearch

Vector-based semantic search (see `docs/vector-search.md` for full details).

```
SemanticSearch.search(query, { k, threshold, provider })
    ↓
EmbeddingManager.embed(query, provider) → queryVector
    ↓
VectorStore.search(queryVector, { k, threshold })
    ↓
Return results with similarity scores
```

## IndexManager

Manages index lifecycle: creation, updates, rebuilding, optimization, and deletion.

```
IndexManager
├── createIndex(name, config) → Index
├── getIndex(name) → Index
├── listIndexes() → Index[]
├── deleteIndex(name) → void
├── rebuildIndex(name, options) → void
├── optimizeIndex(name) → void
├── getIndexStats(name) → IndexStats
└── health() → IndexHealth
```

### Index Lifecycle

```
Create Index
    ↓
Add Documents (batch or streaming)
    ↓
Build Index (inverted index + optional vector index)
    ↓
Optimize (merge segments, prune, rebalance)
    ↓
Serve Queries
    ↓
Update (add/update/delete documents) → auto-commit
    ↓
Periodic Optimize
    ↓
Rebuild (full rebuild from source data)
    ↓
Delete Index
```

### Index Configuration

| Parameter | Options | Description |
|---|---|---|
| analyzer | standard, simple, language, custom | Text analysis pipeline |
| tokenizer | whitespace, standard, letter, regex | Tokenization method |
| filters | lowercase, stop, stem, synonym, ngram | Post-tokenization filters |
| similarity | BM25, TF-IDF, boolean | Scoring algorithm |
| storage | memory, filesystem, database | Index storage backend |
| vector | none, flat, IVF, HNSW | Vector index type (semantic) |
| replication | 1–N | Index replication factor |

## QueryOptimizer

Analyzes and optimizes search queries for performance and relevance.

```
QueryOptimizer
├── rewrite(query) → Query        # Query rewriting/normalization
├── expand(query) → Query[]       # Query expansion (synonyms, related)
├── suggest(prefix) → string[]    # Query suggestions
├── correct(query) → Query        # Spell correction
├── cache(query) → Query          # Query result caching
├── explain(query) → QueryPlan    # Query execution plan
└── analyze(query, results) → QueryAnalysis
```

### Optimization Techniques

| Technique | Description |
|---|---|
| Query Rewrite | Normalize boolean operators, field syntax, escaping |
| Synonym Expansion | Expand query terms with configured synonyms |
| Spell Correction | Edit-distance based correction for typos |
| Query Caching | Cache frequent query results with TTL |
| Result Caching | Cache individual document scores |
| Index Selection | Route to best index based on query pattern |
| Query Execution Plan | Analyze and optimize query execution order |
| Pagination Optimization | Skip/limit optimization for deep pagination |
