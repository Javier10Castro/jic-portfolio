# Service Discovery

## Overview

Service discovery system with round-robin instance selection, health monitoring, and endpoint resolution.

## Components

- **Registry**: Service registration
- **Discovery**: Service discovery (round-robin)
- **Health**: Health monitoring
- **Resolver**: Endpoint resolution

## Registration Lifecycle

```
register → health check → discover → resolve
```

1. Service instance registers with metadata (name, version, endpoint, health check URL)
2. Health checks run periodically
3. Discovery queries return healthy instances
4. Resolver returns specific endpoint URLs

## Round-Robin Instance Selection

- Distributes requests across healthy instances
- Automatically excludes unhealthy instances
- Weighted selection for capacity-aware distribution

## Health Checking

- Periodic health checks
- Configurable check intervals
- Health status: healthy, degraded, offline
- Automatic deregistration of offline instances

## Endpoint Resolution

Resolves service names to concrete endpoint URLs:
- `service-name` → `http://host:port/path`
- Supports multiple protocols (HTTP, HTTPS, gRPC)
- Load balancer integration
