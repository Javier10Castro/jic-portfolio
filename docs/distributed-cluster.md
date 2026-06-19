# Distributed Execution Cluster

## Architecture

The Distributed Execution Cluster transforms the platform into a horizontally scalable execution system. The Workflow Engine delegates execution to a cluster of workers managed by the Cluster Coordinator.

```
                 API
                  |
          Workflow Engine
                  |
          Cluster Coordinator
                  |
      +-----------+------------+
      |           |            |
 Worker A     Worker B     Worker C
      |           |            |
 AI Providers AI Providers AI Providers
```

## Cluster Topology

```
Cluster Coordinator
  ├── Cluster Manager (singleton coordinator)
  ├── Worker Manager (worker lifecycle)
  ├── Leader Election (active coordinator failover)
  ├── Heartbeat Monitor (worker health)
  ├── Task Dispatcher (send tasks to workers)
  ├── Task Queue (priority, FIFO, LIFO, scheduled, delayed, dead-letter)
  ├── Load Balancer (dispatch strategies)
  ├── Distributed Scheduler (cron, interval, delayed)
  ├── Cluster Metrics (counters, gauges, histograms)
  ├── Cluster Events (pub/sub event bus)
  └── Cluster Storage (in-memory persistence)
```

## Directory Structure

```
lib/cluster/
├── index.js                # Entry point — 10 exported functions + all classes
├── clusterManager.js       # Central coordinator — ties all modules together
├── clusterStorage.js       # In-memory persistence for workers, tasks, queues, leaders, metrics
├── clusterEvents.js        # Event types + pub/sub event bus (11 event types)
├── clusterMetrics.js       # Counters, gauges, histograms with tag support
├── workerManager.js        # Worker lifecycle management + heartbeat processing
├── workerRegistry.js       # Register, unregister, list, query workers
├── workerNode.js           # Worker representation with status management
├── heartbeatMonitor.js     # Detect offline, stale, slow workers
├── leaderElection.js       # Single active coordinator with automatic failover
├── taskDispatcher.js       # Orchestrate task dispatch + retry + dead letter
├── taskQueue.js            # Priority, FIFO, LIFO, scheduled, delayed, dead-letter queues
├── loadBalancer.js         # 6 dispatch strategies: round_robin, least_busy, weighted, latency, cost, sticky
└── distributedScheduler.js # Schedule tasks across cluster
```

## Worker Lifecycle

```
Registered (idle)
    ↓
Dispatched (busy) ← heartbeat
    ↓                    ↓
Complete (idle)    Fail (retrying)
                       ↓
               Max retries (dead letter)
                       
Offline ← heartbeat timeout (15s)
Stale   ← heartbeat threshold (30s)
Reconnected ← heartbeat received (back to idle)
```

### Worker Types

| Type | Purpose |
|------|---------|
| `workflow` | Execute workflow steps |
| `ai` | Run AI provider calls |
| `deployment` | Handle deployments |
| `background` | Process background tasks |
| `scheduled` | Execute scheduled jobs |

## Queues

### Queue Types

| Queue | Strategy | Use Case |
|-------|----------|----------|
| `priority` | Higher priority dequeued first | Critical workflows |
| `fifo` | First in, first out | Background jobs |
| `lifo` | Last in, first out (stack) | Recent-first processing |
| `scheduled` | Run at specific time | Cron/delayed execution |
| `delayed` | Run after a delay | Retry backoff |
| `deadLetter` | Failed after max retries | Error investigation |

### Queue Example

```js
const { TaskQueue } = require('./lib/cluster');
const q = new TaskQueue();

// Priority queue
await q.enqueuePriority({ id: 'critical-task', type: 'workflow' }, 10);
await q.enqueuePriority({ id: 'normal-task', type: 'workflow' }, 1);
const task = await q.dequeuePriority(); // critical-task first

// FIFO
await q.enqueueFifo({ id: 'first' });
await q.enqueueFifo({ id: 'second' });
await q.dequeueFifo(); // first

// Delayed (retry)
await q.enqueueDelayed({ id: 'retry-task' }, 5000); // 5s delay

// Dead letter
await q.enqueueDeadLetter(task, 'Max retries exceeded');

// Visibility timeout
const visTask = await q.dequeueWithVisibility('fifo', 30000);
// task is invisible for 30s, then reappears
q.acknowledge(visTask.id); // mark as processed
```

## Dispatch Strategies

### Load Balancer

| Strategy | Description |
|----------|-------------|
| `round_robin` | Cycle through workers evenly |
| `least_busy` | Pick worker with fewest running tasks |
| `weighted` | Random selection weighted by worker weight |
| `latency` | Pick worker with lowest avg latency |
| `cost` | Pick worker with lowest avg cost |
| `sticky` | Same workflow → same worker |

### Dispatch Example

```js
const { ClusterManager } = require('./lib/cluster');

const cm = new ClusterManager();
await cm.start({ simulateWorkers: true, workerCount: 5, isLocal: true });

// Default (priority queue, round_robin)
await cm.dispatchTask({ type: 'workflow', payload: { steps: ['init'] }});

// Custom strategy and queue
await cm.dispatchTask(
  { type: 'ai', payload: { model: 'gpt-4' }, priority: 8 },
  { strategy: 'least_busy', queueType: 'fifo' }
);

await cm.stop();
```

### Dispatch Result

```json
{
  "taskId": "t-a1b2c3d4e5",
  "status": "dispatched",
  "workerId": "sim-worker-3"
}
```

Or if no worker available:

```json
{
  "taskId": "t-a1b2c3d4e5",
  "status": "queued",
  "workerId": null
}
```

## Heartbeat

Workers send heartbeats every configurable interval.

### Heartbeat Example

```js
// Worker sends heartbeat
clusterManager.receiveHeartbeat('worker-1', {
  cpu: 45,
  memory: { used: 512, total: 1024 },
  runningTasks: ['task-1', 'task-2'],
});

// HeartbeatMonitor detects failures automatically
```

### Heartbeat Detection

| Condition | Elapsed | Action |
|-----------|---------|--------|
| Healthy | < timeout (15s) | Normal operation |
| Offline | > timeout (15s) | Mark offline, emit failover |
| Stale | > staleThreshold (30s) | Mark stale |

## Leader Election

The cluster uses a simple leader election algorithm:

1. Each node is a candidate
2. Election: node collects votes (all other candidates)
3. Majority wins (floor(N/2) + 1)
4. Leader sends heartbeats every interval
5. If leader heartbeat times out (> electionTimeout), new election
6. Automatic failover to new leader

### Leader Example

```js
const { LeaderElection } = require('./lib/cluster');

const le = new LeaderElection({
  nodeId: 'coordinator-1',
  heartbeatInterval: 3000,
  electionTimeout: 10000,
  onBecomeLeader: (id, term) => console.log(`${id} is leader (term ${term})`),
});

le.start(['coordinator-1', 'coordinator-2', 'coordinator-3']);
console.log(le.isLeader()); // true if this node won
console.log(le.getLeaderId()); // current leader
```

## Failover

### Worker Failover

When a worker goes offline:

1. Heartbeat timeout → worker marked offline
2. `cluster.worker.left` event emitted
3. `cluster.failover` event emitted
4. Task reassignment: queued tasks picked up by other workers
5. Running tasks on failed worker → retry → reassign

### Leader Failover

When the leader goes offline:

1. Leader heartbeat timeout
2. `cluster.failover` event emitted
3. New election held
4. New leader takes over
5. All queues and scheduling continue

## Events

| Event | When |
|-------|------|
| `cluster.started` | Cluster coordinator started |
| `cluster.stopped` | Cluster coordinator stopped |
| `cluster.worker.joined` | Worker registered or reconnected |
| `cluster.worker.left` | Worker unregistered, offline, or stale |
| `cluster.leader.changed` | Leader elected, resigned, or changed |
| `cluster.task.dispatched` | Task sent to worker or queued |
| `cluster.task.completed` | Task completed by worker |
| `cluster.task.failed` | Task failed (with retry info) |
| `cluster.failover` | Worker or leader failover |
| `cluster.heartbeat` | Worker heartbeat received |
| `cluster.queue.depth` | Queue depth changed |

### Event Example

```js
const { getClusterManager } = require('./lib/cluster');
const cm = getClusterManager();

cm.getEventBus().on('cluster.failover', (entry) => {
  console.log('Failover:', entry.data);
  // { workerId, reason, timestamp }
});

cm.getEventBus().on('cluster.task.completed', (entry) => {
  console.log('Task completed:', entry.data.taskId);
});
```

## Metrics

| Metric | Type | Tags |
|--------|------|------|
| `tasks.dispatched` | counter | workerId, strategy |
| `tasks.completed` | counter | workerId |
| `tasks.failed` | counter | workerId |
| `task.duration` | histogram | workerId |
| `heartbeats` | counter | workerId |
| `failovers` | counter | (none) |

### Metrics Example

```js
const cm = getClusterManager();
const metrics = cm.getMetricsCollector();
console.log(metrics.getCounter('tasks.dispatched'));
console.log(metrics.getHistogram('task.duration'));
```

## Scaling Guide

### Horizontal Scaling

- Add workers by calling `registerWorker()`
- Workers can run on separate machines/containers
- Load balancer distributes across all available workers
- No single point of failure (leader election handles coordinator failover)

### Worker Sizing

| Worker Type | Recommended Spec |
|-------------|-----------------|
| `workflow` | 2 CPU, 4GB RAM |
| `ai` | 4 CPU, 8GB RAM (LLM inference) |
| `deployment` | 2 CPU, 2GB RAM |
| `background` | 1 CPU, 2GB RAM |

### Queue Sizing

- Monitor queue depth via dashboard
- Scale workers when queue depth exceeds 1000
- Dead letter queue: investigate failed tasks at > 1% failure rate

## Deployment Guide

### Local Development

```js
const { startCluster } = require('./lib/cluster');

// Start with 5 simulated workers
await startCluster({
  simulateWorkers: true,
  workerCount: 5,
  isLocal: true,
});
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-coordinator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cluster-coordinator
  template:
    metadata:
      labels:
        app: cluster-coordinator
    spec:
      containers:
      - name: coordinator
        image: app:latest
        env:
        - name: CLUSTER_MODE
          value: "coordinator"
---
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 10
  selector:
    matchLabels:
      app: cluster-worker
  template:
    metadata:
      labels:
        app: cluster-worker
    spec:
      containers:
      - name: worker
        image: app:latest
        env:
        - name: CLUSTER_MODE
          value: "worker"
        - name: WORKER_TYPE
          value: "ai"
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_MODE` | `standalone` | `coordinator`, `worker`, or `standalone` |
| `WORKER_TYPE` | `workflow` | Worker specialization type |
| `HEARTBEAT_INTERVAL` | `5000` | Heartbeat interval in ms |
| `HEARTBEAT_TIMEOUT` | `15000` | Worker timeout in ms |
| `ELECTION_TIMEOUT` | `10000` | Leader election timeout in ms |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cluster` | Cluster health overview |
| GET | `/api/v1/cluster/workers` | List workers (filter by `status`, `type`) |
| GET | `/api/v1/cluster/queues` | Queue depth and samples |
| GET | `/api/v1/cluster/metrics` | Cluster metrics (filter by `name`, `since`) |
| GET | `/api/v1/cluster/leader` | Current leader status |
| POST | `/api/v1/cluster/workers/register` | Register a new worker |
| POST | `/api/v1/cluster/workers/remove` | Remove a worker |
| POST | `/api/v1/cluster/dispatch` | Dispatch a task |

## Dashboard

The Cluster Center dashboard provides:

- Worker list with status, CPU, memory, tasks, heartbeat, uptime
- Leader status (ID, term, isLeader)
- Queue depth with progress bars
- Task metrics (dispatched, completed, failed, running)
- Cluster uptime and failover count
- Load balancer and heartbeat configuration

## Extension Guide

### Add a queue adapter (Redis, RabbitMQ)

```js
class RedisTaskQueue {
  async enqueuePriority(task, priority) { /* Redis ZADD */ }
  async dequeuePriority() { /* Redis ZPOPMAX */ }
  // ... implement all TaskQueue methods
}

const cm = new ClusterManager({
  queue: new RedisTaskQueue(redisClient),
});
```

### Add a custom dispatch strategy

```js
const { LoadBalancer } = require('./lib/cluster');

class CustomLoadBalancer extends LoadBalancer {
  async selectWorker(workers, task, strategy) {
    // Custom logic
  }
}
```

### Add storage adapter (PostgreSQL, Redis)

```js
const cm = new ClusterManager({
  storage: new PostgresClusterStorage(pool),
});
```
