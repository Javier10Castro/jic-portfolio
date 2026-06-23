# Case-Based Reasoning

## Overview

The Case-Based Reasoning (CBR) subsystem stores, retrieves, and ranks problem-solution cases to provide contextual recommendations for new projects.

## Components

### Case Registry
- **store(name, problem, solution, outcome)** — Stores a new case
- **findByName(name)** — Exact name match lookup
- **remove(id)** — Deletes a case

### Case Retriever
- **retrieve(query, limit)** — Finds cases matching query by text similarity
- String queries match against name, problem, and solution fields
- Object queries with `problem` field use word overlap scoring
- Object queries with `type` field adjust score by +0.2

### Case Similarity
- **compare(caseA, caseB)** — Weighted similarity score
- Default weights: problem 40%, solution 30%, outcome 20%, name 10%
- Text similarity uses Jaccard-like word overlap
- **setWeights(weights)** — Customize weight distribution

### Case Ranking
- **rank(cases, criteria)** — Multi-criteria ranking
- Default criteria: relevance (×1), recency (×1), success (×1)
- Recency decays linearly over 365 days
- Success score from outcome.success and outcome.score

## Similarity Flow

```
New Problem → Retrieve Similar Cases → Compute Similarity → Rank → Top K Results
                                                                   ↓
                                                         Apply to Current Project
```

## Usage

```js
const registry = new CaseRegistry();
registry.store('db-connection-pool', 'High connection churn', 'Implement connection pooling', { success: true, score: 95 });

const retriever = new CaseRetriever();
retriever.setSource(registry.list());
const matches = retriever.retrieve({ problem: 'database connection issues' });
```
