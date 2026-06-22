# SDK Guide

## Installation

### JavaScript/Node.js
```bash
npm install @platform/sdk-js
# or
yarn add @platform/sdk-js
```

### TypeScript
```bash
npm install @platform/sdk-ts
```

### Python
```bash
pip install platform-sdk
```

### Go
```bash
go get github.com/platform/sdk-go
```

### Java
```xml
<!-- Maven -->
<dependency>
  <groupId>com.platform</groupId>
  <artifactId>sdk</artifactId>
  <version>4.5.0</version>
</dependency>
```
```gradle
// Gradle
implementation 'com.platform:sdk:4.5.0'
```

### C#
```bash
dotnet add package Platform.Sdk
```

### PHP
```bash
composer require platform/sdk-php
```

## Authentication

All SDKs authenticate using an API key. Set via constructor or environment variable:

```javascript
// JavaScript
const { PlatformClient } = require('@platform/sdk-js');
const client = new PlatformClient({ apiKey: 'your-api-key' });
// Or via env: PLATFORM_API_KEY
```

```python
# Python
from platform_sdk import PlatformClient
client = PlatformClient(api_key='your-api-key')
```

```go
// Go
import "github.com/platform/sdk-go"
client := platform.NewClient(platform.Config{APIKey: "your-api-key"})
```

```java
// Java
PlatformClient client = new PlatformClient("your-api-key");
```

```csharp
// C#
var client = new Platform.Sdk.PlatformClient("your-api-key");
```

```php
// PHP
$client = new Platform\Sdk\PlatformClient('your-api-key');
```

## Basic Usage

### JavaScript
```javascript
const { PlatformClient } = require('@platform/sdk-js');
const client = new PlatformClient({ apiKey: process.env.PLATFORM_API_KEY });

// List plugins
const plugins = await client.get('/plugins');
console.log(plugins);

// List integrations
const integrations = await client.get('/integrations');
console.log(integrations);

// Deploy
const deploy = await client.post('/deployments', { projectId: 'proj-123' });
console.log(deploy);
```

### Python
```python
from platform_sdk import PlatformClient
client = PlatformClient()

# List plugins
plugins = client.get('/plugins')
print(plugins)

# List integrations
integrations = client.get('/integrations')
print(integrations)
```

### Go
```go
client := platform.NewClient(platform.Config{APIKey: os.Getenv("PLATFORM_API_KEY")})
plugins, _ := client.ListPlugins()
integrations, _ := client.ListIntegrations()
```

### Java
```java
PlatformClient client = new PlatformClient(System.getenv("PLATFORM_API_KEY"));
String plugins = client.listPlugins();
String integrations = client.listIntegrations();
```

### C#
```csharp
var client = new Platform.Sdk.PlatformClient();
string plugins = await client.ListPluginsAsync();
string integrations = await client.ListIntegrationsAsync();
```

### PHP
```php
$client = new Platform\Sdk\PlatformClient(getenv('PLATFORM_API_KEY'));
$plugins = $client->listPlugins();
$integrations = $client->listIntegrations();
```

## Pagination

### JavaScript
```javascript
const paginator = client.paginate('/plugins', { limit: 20 });
for await (const page of paginator) {
  console.log(`Got ${page.items.length} items`);
  for (const item of page.items) {
    console.log(item);
  }
}
```

### Python
```python
for item in client.paginate('/plugins', limit=20):
    print(item)
```

### TypeScript
```typescript
const pages = client.paginate<Plugin>('/plugins', { limit: 20 });
for await (const page of pages) {
  for (const plugin of page.items) {
    console.log(plugin);
  }
}
```

## Streaming

### JavaScript
```javascript
const unsubscribe = client.stream('/events', (data) => {
  console.log('Event received:', data);
});
// Later: unsubscribe()
```

## Retries

All SDKs implement automatic retry with exponential backoff:

| SDK | Max Retries | Backoff | Trigger |
|---|---|---|---|
| JavaScript | 3 | 2^n * 100ms | 5xx responses |
| TypeScript | 3 | 2^n * 100ms | 5xx responses |
| Python | 3 | 2^n * 100ms | 5xx responses |
| Go | 3 | 2^n * 100ms | 5xx responses |
| Java | 3 | 2^n * 100ms | 5xx responses |
| C# | 3 | 2^n * 100ms | 5xx responses |
| PHP | 3 | 2^n * 100ms | 5xx responses |

## Error Handling

```javascript
try {
  const result = await client.get('/plugins');
} catch (err) {
  if (err.message.includes('HTTP 401')) {
    console.error('Authentication failed — check your API key');
  } else if (err.message.includes('HTTP 429')) {
    console.error('Rate limited — retry after backoff');
  } else if (err.message.includes('Request timeout')) {
    console.error('Request timed out');
  } else {
    console.error('API error:', err.message);
  }
}
```

```python
from platform_sdk import PlatformClient, PlatformApiError
client = PlatformClient()
try:
    plugins = client.get('/plugins')
except PlatformApiError as e:
    if e.status_code == 401:
        print("Authentication failed")
    elif e.status_code == 429:
        print("Rate limited")
    else:
        print(f"API error: {e}")
```

## TypeScript Types Reference

```typescript
interface PlatformConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

interface Plugin {
  id: string;
  name: string;
  version: string;
  type: string;
  enabled: boolean;
}

interface Integration {
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt: string;
}

interface Deployment {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  url?: string;
}

interface Workflow {
  id: string;
  name: string;
  steps: number;
  status: string;
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
}
```
