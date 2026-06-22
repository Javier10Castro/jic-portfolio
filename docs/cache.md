# Cache Architecture

## Overview

Multi-level cache hierarchy providing fast data access with configurable eviction policies and invalidation strategies. Supports memory (in-process), Redis (shared), and distributed caching for horizontal scaling.

## Cache Manager

Central orchestrator managing cache instances, routing, policies, and invalidation.

```
CacheManager
├── get(key) → value | null
├── set(key, value, ttl) → void
├── delete(key) → boolean
├── clear() → void
├── has(key) → boolean
├── getStats() → CacheStats
├── getOrSet(key, factory, ttl) → value
└── invalidate(options) → number
```

## Memory Cache

In-process memory cache using Map with TTL-based expiration. Fastest tier (nanosecond access).

| Feature | Description |
|---|---|
| Storage | In-memory Map |
| Eviction | TTL + configurable max size |
| Cleanup | Periodic sweep + lazy expiration |
| Serialization | Direct object references (no serialization) |
| Max Size | Configurable (default 1000 entries) |

## Redis Cache

Shared cache using Redis. Suitable for multi-instance deployments and cross-process caching.

| Feature | Description |
|---|---|
| Connection | Single / cluster / sentinel |
| Serialization | JSON / MessagePack / custom |
| Key Prefix | Namespace prefix for isolation |
| Data Types | String, Hash, List, Set, SortedSet |
| Transactions | MULTI/EXEC, optimistic locking (WATCH) |
| Pub/Sub | Channel-based notifications for invalidation |
| Persistence | RDB / AOF configurable |

## Distributed Cache

Distributed cache layer for horizontally scaled deployments. Uses consistent hashing for key distribution.

```
DistributedCache
├── Ring: consistent hashing ring
├── Nodes: cache node registry
├── Replication: configurable replication factor
├── Failure: automatic failover + rebalancing
└── Gossip: node discovery + health propagation
```

| Feature | Description |
|---|---|
| Topology | Consistent hashing ring |
| Replication | N replicas per key (default 2) |
| Failover | Automatic node detection + rebalancing |
| Partition Tolerance | Read from replicas during partition |
| Node Discovery | Gossip protocol |

## Cache Policies

| Policy | Description | Eviction Order |
|---|---|---|
| TTL | Time-to-live expiration | Oldest expiry first |
| LFU | Least Frequently Used | Lowest access frequency |
| LRU | Least Recently Used | Oldest access time |
| FIFO | First In, First Out | Insertion order |
| Hybrid | Combination of above | Configurable |

### TTL Policy
```
set(key, value, ttlMs)
    → entry = { value, expiresAt: now + ttlMs }
get(key)
    → if expired → delete + return null
    → else → return value
```

### LRU Policy
```
On access:
    move entry to head of doubly-linked list
On eviction:
    remove entry at tail (least recently used)
```

### LFU Policy
```
On access:
    increment frequency counter
Maintain frequency buckets:
    each bucket holds entries with same frequency
On eviction:
    remove from lowest-frequency, oldest-entry within bucket
```

### FIFO Policy
```
Maintain insertion-ordered queue
On eviction:
    remove oldest (first inserted) entry
```

## Cache Invalidation

| Strategy | Scope | Description |
|---|---|---|
| Key | Single key | `invalidate('user:123')` |
| Pattern | Key pattern | `invalidate('user:*')` via Redis SCAN |
| Tag | Tagged keys | `invalidateByTag('users')` |
| Stale | Grace period | Serve stale while async refresh |
| Time | TTL-based | Automatic expiration |

### Invalidation Strategies

```
Key Invalidation:
    delete specific key from all cache tiers

Pattern Invalidation:
    find keys matching pattern → delete each

Tag Invalidation:
    maintain tag→keys index
    on invalidate(tag): delete all indexed keys

Stale Invalidation:
    get(): if expired but within grace → return stale → async refresh
    if past grace → return null → refresh
```

## Cache Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                  Application Layer                    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│     CacheManager (routing + policy + invalidation)   │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌─────────────┐ ┌──────────┐ ┌──────────────┐
│ Memory Cache │ │Redis Cache│ │Distributed   │
│   (L1)       │ │  (L2)    │ │Cache (L3)    │
│   ~1ns       │ │  ~1ms    │ │  ~5ms        │
│   process    │ │  shared  │ │  cluster     │
└─────────────┘ └──────────┘ └──────────────┘
```

**Read-through**: L1 → L2 → L3 → DB (populate on miss)
**Write-through**: Write to all tiers synchronously
**Write-behind**: Write to L1, async propagate to L2/L3/DB
