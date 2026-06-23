# Refactoring Engine

## Architecture

The refactoring engine analyzes modules and recommends structural improvements:

### ModuleSplit
Detects modules exceeding complexity thresholds:
- Lines of code > 500
- Responsibilities > 3
Returns candidates for splitting with metrics.

### ModuleMerge
Identifies modules with overlapping responsibilities that could be merged into cohesive units.

### DependencyCleanup
Detects:
- Unused dependencies (`usageCount === 0`)
- Duplicate dependencies (same name, different versions)
Produces removal and deduplication recommendations.

### ArchitectureRefactor
Analyzes overall architecture structure:
- Layer granularity (too few layers)
- Coupling (high coupling > 0.7)
- Cohesion (low cohesion < 0.3)
- Modularity (lack of modular decomposition)

### WorkflowOptimization
Identifies workflow improvements:
- Overly long workflows (>10 steps → parallelize)
- High retry counts (>3 → fragility)
- Long average durations (>30s → optimize)

### AgentOptimization
Analyzes agent performance:
- Too many tasks per agent (>20 → split)
- High error rates (>10% → reliability)
- High latency (>5s → optimize)
- Overlapping responsibilities with other agents
