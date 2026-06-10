# sendContact Context

## 1. Architecture

API Layer:
- api/sendContact.js

Pipeline:

1. request.received
2. body.parse
3. validation
4. rateLimit
5. queue.assign
6. background.start
7. email.sent

---

## 2. Response States

### 200 - processed
Email successfully sent

### 202 - queued
Request accepted into queue (async processing)

Includes:
- queuePosition
- queueDepth

### 400 - invalid_request
Validation failed:
- invalid email format
- empty message
- invalid timestamp

### 429 - rate_limited
Rate limit exceeded

Includes:
- limitType (ip | email)
- currentUsage
- retryAfterMs (if available)
- windowResetTime

---

## 3. Observability Model

Every request includes:

- requestId
- processingStage
- timestamp
- status

Debug mode (?debug=true):

- lifecycle[]
  - step
  - status
  - ms
  - deltaMs

- queue depth visibility
- rateLimit step visibility

---

## 4. Queue System

FIFO async queue system:

Fields:
- queuePosition
- queueDepth
- processingStage
- totalRequestTimeMs
- queueWaitTimeMs
- processingTimeMs

Behavior:
- FIFO scheduling
- active depth tracking
- controlled backlog under load
- exposed via /api/health?section=queue

---

## 5. Rate Limiting

Mechanisms:

### 1. IP Sliding Window
- edgeSoftLimit: 30
- edgeHardLimit: 60
- window: 60000ms

### 2. Email Dedup Window
- 300000ms window
- prevents spam submissions

### 3. Hard Cap Protection
- returns 429 when exceeded

Monitoring:
GET /api/health?section=rate-limit

---

## 6. Lifecycle Observability

Stages:

- request.received
- body.parse
- validation
- rateLimit
- queue.assign
- background.start
- email.sent

Each stage includes:
- status
- ms timing
- deltaMs (debug mode only)

---

## 7. Timestamped Change Log

[2026-06-10T06:40:00Z] - Added lifecycle tracing system
Reason: improve async debugging and request visibility
Impact: full request traceability

[2026-06-10T07:05:00Z] - Added queue observability
Reason: monitor backlog under load
Impact: better queue diagnostics

[2026-06-10T07:10:00Z] - Added rate-limit metadata exposure
Reason: improve client retry handling
Impact: better UX under throttling

[2026-06-10T07:15:00Z] - Improved CLI observability validation
Reason: expose real rate-limit behavior under PowerShell testing
Impact: better debugging clarity for 429 responses

---

## 8. CLI Testing Observations (PowerShell)

[2026-06-10T15:54:00Z] - Observed queue scaling under burst load
Reason: validate FIFO behavior in real CLI environment
Impact: confirmed linear queue growth without request loss

[2026-06-10T15:54:30Z] - Observed rate-limit activation (429)
Reason: stress test using PowerShell Invoke-RestMethod
Impact: confirms edgeSoftLimit enforcement working correctly

[2026-06-10T15:55:00Z] - Identified Git path mismatch in documentation update workflow
Reason: incorrect assumption of docs/ path structure
Impact: improved clarity in repo structure handling