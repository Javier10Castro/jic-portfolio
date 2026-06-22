# Compliance Scanning

## Overview

The ComplianceEngine scans active policies against runtime data to produce compliance scores, track violations, and generate reports. Compliance scanning can be run on-demand or scheduled via the PolicyScheduler.

## Scan Lifecycle

```
run → check each policy → calculate score → generate report
```

1. **Run** — ComplianceScanner begins a scan cycle
2. **Check each policy** — For each enabled policy, evaluate against current data, detect violations
3. **Calculate score** — Aggregate results into overall compliance score
4. **Generate report** — Produce report in JSON, CSV, or Markdown format

## Compliance Score

The compliance score is calculated as:

```
score = (passedPolicies / totalPolicies) × 100
```

Where:
- `passedPolicies` — policies that evaluated without violations
- `totalPolicies` — all enabled policies

A score of 100 indicates full compliance. Scores below configurable thresholds trigger alerts and notifications via PolicyEvents.

## Violation Tracking

Each violation records:
- Policy ID and name
- Timestamp of violation
- Data snapshot at time of violation
- Severity level
- Enforcement mode at time of violation
- Action taken (denied/warned/logged)
- Related resource identifier

Violations are persisted to the audit engine and are queryable by time range, policy type, severity, and resource.

## Report Generation

Reports include:
- Overall compliance score
- Per-policy results (passed/failed/violations)
- Violation summary by severity
- Violation trend over time
- Top violated policies

### Export Formats

| Format | Content |
|---|---|
| JSON | Full compliance data, machine-readable |
| CSV | Tabular violation data, spreadsheet-ready |
| Markdown | Formatted report with tables and summaries |

## Templates

ComplianceTemplates provide pre-built report layouts:
- **Executive Summary** — High-level score and trend overview
- **Detailed Audit** — Full per-policy breakdown
- **Violation Focus** — All violations sorted by severity
- **Trend Report** — Score changes over time

## Integration with Audit Engine

Compliance scans automatically feed into the AuditEngine:
- Each scan cycle is recorded as an audit event
- Individual violations generate audit entries
- Report generation is logged
- Audit timeline provides chronological view of compliance state changes
