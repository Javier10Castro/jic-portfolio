# Release Management

## Overview

The release management system provides end-to-end release lifecycle management including semantic versioning, changelog generation, milestone tracking, tag management, hotfix workflows, and pipeline orchestration.

## Components

| Component | File | Responsibility |
|---|---|---|
| ReleaseManager | `lib/lifecycle/releaseManager.js` | Release lifecycle orchestrator — draft/released/hotfix/rolled_back |
| ReleasePipeline | `lib/lifecycle/releasePipeline.js` | Pipeline execution — define stages, execute, status |
| VersionManager | `lib/lifecycle/versionManager.js` | Semantic versioning — major/minor/patch increment |

## Semantic Versioning

| Component | Rule |
|---|---|
| **major** | Breaking changes, incompatible API modifications |
| **minor** | Backward-compatible new features, functionality additions |
| **patch** | Backward-compatible bug fixes, security patches |

The VersionManager provides automatic increment of major/minor/patch versions with validation against the current version.

## Release Lifecycle

```
Draft → Released → Hotfix → Rolled Back
```

| State | Description |
|---|---|
| `draft` | Initial state — release being prepared, changelog being written |
| `released` | Release published and deployed to production |
| `hotfix` | Emergency patch applied to a released version |
| `rolled_back` | Release reverted to a previous stable version |

## Release Notes

Each release generates structured release notes containing:
- Version identifier and release date
- Changelog entries grouped by type (features, fixes, improvements, breaking changes)
- Associated milestones and tags
- Contributors and commit references

## Milestones

Milestones track progress toward specific goals or deliverables. Each milestone can contain multiple releases and tracks completion status.

## Tags

Tags are created automatically for each release following the pattern `v{major}.{minor}.{patch}`. Tags support annotations, release notes links, and artifact references.

## Hotfix Workflow

```
Production Issue Detected
    ↓
Create Hotfix Branch (from release tag)
    ↓
Apply Fix + Bump Patch Version
    ↓
Hotfix Release (bypasses normal pipeline stages)
    ↓
Merge Back to Main Branch
    ↓
Deploy to Production
```

Hotfixes bypass normal stage gating and go through expedited validation.

## Pipeline Stages

| Stage | Description |
|---|---|
| `build` | Compile and package artifacts |
| `test` | Run automated test suites |
| `approve` | Manual or automatic approval gate |
| `deploy` | Deploy to target environment |
| `verify` | Post-deployment verification checks |
| `promote` | Promote to next environment |
