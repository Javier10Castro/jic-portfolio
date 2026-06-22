# Webhook Engine — Enterprise Integration Hub

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                Webhook Engine                                           │
│                                                                                        │
│  ┌─────────────────────────┐          ┌───────────────────────────────────────────┐    │
│  │    Incoming Webhooks     │          │         Outgoing Webhooks                  │    │
│  │                         │          │                                            │    │
│  │  External Service ────> │          │  Integration Hub ────> External Service    │    │
│  │  POST /api/webhooks     │          │  POST https://ex.com/hook                  │    │
│  │                         │          │                                            │    │
│  │  1. Receive payload     │          │  1. Build payload with event + timestamp   │    │
│  │  2. Verify signature    │          │  2. Sign with HMAC-SHA256                  │    │
│  │  3. Emit event          │          │  3. Send to registered URL                 │    │
│  │  4. Route to handlers   │          │  4. Track delivery status                  │    │
│  └─────────────────────────┘          └───────────────────────────────────────────┘    │
│                                                                                        │
│  ┌────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          Webhook Registry                                       │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │    │
│  │  │    ID      │  │  Provider  │  │ Direction  │  │   Secret   │  │  Events  │ │    │
│  │  │ wh_in_xxx  │  │  github    │  │  incoming  │  │  whsec_xx  │  │    *     │ │    │
│  │  │ wh_out_xxx │  │  slack     │  │  outgoing  │  │  whsec_yy  │  │ [push]   │ │    │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │    │
│  └────────────────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## Webhook Registration

### Incoming Webhook

```js
const { IntegrationWebhook } = require('../lib/integrations/integrationWebhook');

const webhook = new IntegrationWebhook({ events, storage, secrets });

const result = webhook.registerIncoming('github', {
  path: '/webhooks/github',
  secret: 'whsec_your_secret'
});
// { success: true, id: 'wh_in_github_1' }
```

### Outgoing Webhook

```js
const result = webhook.registerOutgoing('github', {
  url: 'https://api.example.com/webhooks/github-events',
  secret: 'whsec_outgoing_secret',
  events: ['push', 'pull_request', 'issues']
});
// { success: true, id: 'wh_out_github_1' }
```

## Signature Verification

The engine uses **HMAC-SHA256** for webhook signature verification.

### Verification Flow

```
Incoming Webhook:
  POST /api/v1/integrations/webhook
  Headers: x-hub-signature-256: sha256=abc123...

  1. Look up webhook by provider
  2. Get stored secret
  3. Compute HMAC-SHA256(secret, JSON.stringify(payload))
  4. Compare computed signature with header value
  5. If match → process webhook
  6. If mismatch → reject with 401
```

### Implementation

```js
const crypto = require('crypto');

function computeSignature(secret, payload) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

function verifySignature(secret, payload, signature) {
  const expected = computeSignature(secret, payload);
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
```

## Retry Logic with Backoff

Outgoing webhook delivery uses exponential backoff:

| Attempt | Delay | Total Elapsed |
|---|---|---|
| 1 | 0s (immediate) | 0s |
| 2 | 5s | 5s |
| 3 | 25s | 30s |
| 4 | 125s | 155s |
| 5 | 625s | 780s (13 min) |

Max retries: 5

```
function calculateBackoff(attempt) {
  return Math.pow(5, attempt) * 1000;
}
```

## Replay Protection

The engine prevents replay attacks using timestamp validation:

```
Incoming Webhook Validation:
  1. Check x-timestamp header
  2. Reject if timestamp is older than 5 minutes
  3. Include timestamp in signature payload
  4. Cache processed webhook IDs for 10 minutes
  5. Reject duplicate webhook IDs

Outgoing Webhook:
  1. Include timestamp in each payload
  2. Recipient validates timestamp window
  3. Include unique webhook ID in payload
```

### Replay Detection Code

```js
const processedIds = new Set();

function detectReplay(webhookId, timestamp) {
  const now = Date.now();
  const age = now - timestamp;

  if (age > 300000) {
    return { replay: true, reason: 'Timestamp too old' };
  }

  if (processedIds.has(webhookId)) {
    return { replay: true, reason: 'Duplicate webhook ID' };
  }

  processedIds.add(webhookId);
  setTimeout(() => processedIds.delete(webhookId), 600000);
  return { replay: false };
}
```

## Event Types

| Event | Constant | Direction | Description |
|---|---|---|---|
| `integration.webhook.received` | `WEBHOOK_RECEIVED` | Incoming | Webhook received and verified |
| `integration.synced` | `SYNCED` | Internal | Sync completed via webhook trigger |
| `integration.failed` | `FAILED` | Both | Webhook processing failed |

## Provider-Specific Webhook Setup

### GitHub

```
Header: x-hub-signature-256
Format: sha256=<hex>
Secret: configurable per webhook
Events: push, pull_request, issues, create, delete, release
Setup:
  1. Repository Settings > Webhooks
  2. Add webhook: https://app.com/api/v1/integrations/webhook
  3. Content type: application/json
  4. Secret: whsec_your_secret
  5. Select events
```

### GitLab

```
Header: x-gitlab-token
Format: plain text token match
Events: Push, Merge Request, Issues, Note, Pipeline
Setup:
  1. Project > Settings > Webhooks
  2. URL: https://app.com/api/v1/integrations/webhook
  3. Secret token: whsec_your_secret
  4. Trigger events
```

### Slack

```
Events API verification token or signing secret
Header: x-slack-signature
Format: v0=<HMAC-SHA256 hex>
Verification: Slack uses its own signing format
Setup:
  1. Slack API > Event Subscriptions
  2. Request URL: https://app.com/api/v1/integrations/webhook
  3. Verify URL challenge on setup
  4. Subscribe to events
```

### Stripe

```
Header: stripe-signature
Format: t=<timestamp>,v1=<HMAC-SHA256 hex>
Setup:
  1. Developers > Webhooks
  2. Endpoint: https://app.com/api/v1/integrations/webhook
  3. Signing secret: whsec_xxx
  4. Select events to listen for
```

## Code Examples

### Register and Process Webhooks

```js
const { IntegrationManager } = require('../lib/integrations');
const manager = new IntegrationManager();

manager.registerIncomingWebhook('github', {
  path: '/webhooks/github',
  secret: process.env.GITHUB_WEBHOOK_SECRET
});

manager.registerOutgoingWebhook('slack', {
  url: 'https://hooks.slack.com/services/T00/B00/xxx',
  events: ['deployment.completed', 'build.failed']
});

const crypto = require('crypto');
const payload = { action: 'push', ref: 'refs/heads/main' };
const signature = crypto
  .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

const result = manager.processIncomingWebhook('github', payload, signature);
console.log('Webhook processed:', result.success);
```

### Outgoing Webhook via Manager

```js
const events = require('../lib/integrations/integrationEvents').EVENTS;

manager.registerOutgoingWebhook('github', {
  url: 'https://api.example.com/github-events',
  events: ['sync.completed'],
  secret: 'outgoing-secret'
});

// When sync completes, outgoing webhooks are sent automatically
const sync = manager.startSync('github', 'incremental');
manager.completeSync(sync.syncId, { rows: 100 });
```

### Webhook with Plugin SDK

```js
const { Webhook, createWebhook } = require('../lib/plugin-sdk/Webhook');

const wh = createWebhook({
  provider: 'github',
  name: 'push-events',
  path: '/webhooks/github-push',
  secret: 'whsec_xxx',
  handler: (payload, headers) => {
    console.log('Received push event:', payload.ref);
    return { received: true, event: 'push', ref: payload.ref };
  }
});

const result = wh.handle({ ref: 'refs/heads/main', commits: [] }, {});
console.log(result);
```
