# Validation Persistence Verification — Production

## Test Date

2026-06-11

## Test Description

Verify that validation reject responses from `POST /api/sendBrief` persist to Neon `request_logs` and are retrievable via `GET /api/logs?id=<requestId>`.

## Method

1. Submit an invalid request (invalid email format) to `/api/sendBrief`
2. Capture the `requestId` from the 400 response
3. Query `/api/logs?id=<requestId>` to confirm retrieval
4. Query Neon `request_logs` table directly to confirm row presence

## Request

```
POST /api/sendBrief
Content-Type: application/json

{
  "name": "Test User",
  "email": "not-an-email",
  "prompt": "test prompt",
  "submittedAt": <timestamp>
}
```

## API Response (400)

```json
{
  "requestId": "85b2cccc-5c21-4c44-aeb2-c2e592d48819",
  "success": false,
  "error": "INVALID_REQUEST"
}
```

## Logs API Verification

```
GET /api/logs?id=85b2cccc-5c21-4c44-aeb2-c2e592d48819
```

Status: 200

```json
{
  "requestId": "85b2cccc-5c21-4c44-aeb2-c2e592d48819",
  "status": "rejected",
  "errorReason": "validation",
  "validationStage": "validateEmail",
  "validationField": "email",
  "validationReason": "invalid_format",
  "receivedAt": 1781216462531,
  "createdAt": "2026-06-11T22:21:02.579Z"
}
```

## Neon Verification

```sql
SELECT request_id, status, validation_stage, validation_field, validation_reason
FROM request_logs
WHERE request_id = '85b2cccc-5c21-4c44-aeb2-c2e592d48819';
```

Result:

| column | value |
|---|---|
| request_id | 85b2cccc-5c21-4c44-aeb2-c2e592d48819 |
| status | rejected |
| validation_stage | validateEmail |
| validation_field | email |
| validation_reason | invalid_format |

## Cross-instance verification

Confirmed that the `/api/logs` Vercel Function (separate instance from `sendBrief`) retrieves the record via Neon as shared source of truth. The record was also retrievable after the in-memory registry TTL expired, confirming durable persistence.

## Previously persisted entries (pre-fix)

Two additional validation reject entries were found in Neon, created before the `persistImmediate()` fix was deployed. Their persistence was probabilistic — dependent on Vercel instance lifecycle timing.

| request_id | validation_stage | created_at |
|---|---|---|
| e0e2fea1-4167-47da-833d-f452b2ce9534 | validateEmail | 2026-06-11T22:16:08 |
| cb16d15c-ae82-45d1-b662-fad3c0173291 | validateEmail | 2026-06-11T22:06:38 |

## Conclusion

Validation diagnostics persistence is working deterministically in production. All 3 data sources confirm:

| Source | Result |
|---|---|
| `POST /api/sendBrief` (400 response) | Returns `requestId` |
| `GET /api/logs?id=<requestId>` | Returns 200 with full validation fields |
| Neon `request_logs` SELECT | Row present with `validation_stage`, `validation_field`, `validation_reason` |

The fix (commit `42efb28`) ensures the `persistImmediate()` call blocks the error response until Neon confirms the INSERT, eliminating the probabilistic race condition.
