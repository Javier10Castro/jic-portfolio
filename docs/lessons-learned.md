# Lessons Learned

## Overview

The Lessons Learned subsystem manages organizational knowledge through a lifecycle of creation, extraction, validation, and publication.

## Components

### Lesson Manager
- **create(title, content, category)** — Creates a lesson in 'draft' status
- **update(id, updates)** — Modifies lesson properties
- **findByCategory / findByStatus** — Filter lessons
- **remove(id)** — Deletes a lesson

### Lesson Extractor
- **extract(source, sourceType, config)** — Auto-extracts lessons from text
- Recognizes patterns: "learned that...", "lesson learned...", "key takeaway..."
- Returns extracted lessons with source labels (learning, lesson, insight)

### Lesson Validator
- **validate(lessonId, lesson)** — Validates lesson completeness
- Rules:
  - Title required (min 5 chars)
  - Content required (min 20 chars)
- Returns validation result with specific issues

### Lesson Publisher
- **publish(lessonId, lesson, channel)** — Publishes a validated lesson
- Channel defaults to 'internal'
- Records publication timestamp

## Lifecycle

```
Draft → Validate → [Valid] → Publish → Published
                     [Invalid] → Revise
```

## Validation Rules

| Field | Requirement |
|-------|-------------|
| title | Non-empty, ≥5 characters |
| content | Non-empty, ≥20 characters |
