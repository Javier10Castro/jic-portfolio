# Technical Debt Model

## Overview

The technical debt system tracks, prioritizes, scores, and reports on technical debt across the platform.

## Components

### DebtRegistry
Stores technical debt items with type, severity, estimated hours, and category. Supports CRUD and status transitions (open → in_progress → resolved).

### DebtPrioritizer
Ranks debt items using weighted scoring:
- **Severity**: critical=100, high=50, medium=20, low=5
- **Effort**: Up to 50 points based on estimated hours
- **Status**: Open items get +10 priority bonus

### DebtScoring
Computes overall architecture health score:
- Base: 100
- Deductions: -1 per 10 estimated hours, -5 per critical item, -2 per high item
- Health levels: good (≥80), fair (50-79), poor (<50)

### DebtReporter
Generates debt summary reports with categorization by type and effort estimation.

## Debt Categories
- Code quality
- Architecture
- Testing
- Documentation
- Security
- Performance
- Dependencies
