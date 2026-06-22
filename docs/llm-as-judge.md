# LLM as Judge — Automated Evaluation — Phase 9.6.0

## Overview

The LLM-as-a-Judge system uses AI models to evaluate AI outputs. It supports customizable rubrics with weighted criteria, multiple judge prompt types (quality, accuracy, safety, helpfulness, pair comparison), score normalization across scales, hallucination detection, and detailed reasoning for each score.

## Judge Evaluation Flow

```
1. INPUT ──►  System receives: prompt, AI output, optional expected/ground-truth output
                    │
2. RUBRIC ──►  Load rubric with weighted criteria and scoring scales
                    │
3. JUDGE  ──►  Judge engine constructs evaluation prompt with rubric
                    │
4. SCORE  ──►  LLM returns scores per criterion with natural language reasoning
                    │
5. NORMALIZE ──►  Normalize scores to 0–1 range across different scales
                    │
6. AGGREGATE ──►  Weighted aggregation into overall score
```

## Judge Prompt Types

| Type | ID | Description | Output Schema |
|---|---|---|---|
| Quality | `judge-quality` | Evaluate relevance, coherence, completeness, clarity | `{ relevance, coherence, completeness, clarity, reasoning }` |
| Accuracy | `judge-accuracy` | Factual correctness compared to ground truth | `{ accuracy, citationScore, errorCount, reasoning }` |
| Safety | `judge-safety` | Content safety, bias, toxicity, harmlessness | `{ safetyScore, violations[], riskLevel, reasoning }` |
| Helpfulness | `judge-helpfulness` | How well the output addresses the user's need | `{ helpfulness, actionability, relevance, reasoning }` |
| Pair Comparison | `judge-pairwise` | Compare two outputs — which is better and why | `{ winner, score, reasoning, differences[] }` |

## Rubric Design

Rubrics define how evaluation criteria are weighted and scored:

```json
{
  "id": "rubric-quality-v1",
  "name": "Quality Assessment Rubric",
  "criteria": [
    {
      "name": "relevance",
      "weight": 0.30,
      "description": "How relevant is the response to the query?",
      "scale": {
        "type": "likert_5",
        "labels": ["Irrelevant", "Somewhat relevant", "Relevant", "Very relevant", "Perfectly relevant"]
      }
    },
    {
      "name": "coherence",
      "weight": 0.25,
      "description": "Is the response logically structured?",
      "scale": {
        "type": "likert_5",
        "labels": ["Incoherent", "Confusing", "Adequate", "Clear", "Exceptionally clear"]
      }
    },
    {
      "name": "completeness",
      "weight": 0.25,
      "description": "Does the response fully address the query?",
      "scale": {
        "type": "percentage",
        "min": 0,
        "max": 100
      }
    },
    {
      "name": "clarity",
      "weight": 0.20,
      "description": "Is the language clear and unambiguous?",
      "scale": {
        "type": "likert_7",
        "labels": ["Very unclear", "Unclear", "Somewhat unclear", "Neutral", "Somewhat clear", "Clear", "Very clear"]
      }
    }
  ],
  "scoring": {
    "method": "weighted_average",
    "normalize": true
  }
}
```

### Scale Types

| Scale Type | Range | Normalization |
|---|---|---|
| `likert_3` | 1–3 | `(score - 1) / 2` |
| `likert_5` | 1–5 | `(score - 1) / 4` |
| `likert_7` | 1–7 | `(score - 1) / 6` |
| `percentage` | 0–100 | `score / 100` |
| `binary` | 0 or 1 | `score` |
| `custom` | configurable | Custom mapping function |

## Score Normalization

| Method | Formula | Use Case |
|---|---|---|
| Cross-Scale | `(raw - min) / (max - min)` | Normalize different scale types to 0–1 |
| Z-Score | `(raw - mean) / stddev` | Identify outliers relative to distribution |
| Percentile | `rank / count` | Rank-based positioning |
| Aggregate | `Σ(score * weight) / Σ(weight)` | Weighted combination across criteria |

### Normalization Example

```js
const { JudgeEngine } = require('./lib/evaluation/judge');

const judge = new JudgeEngine();

const result = judge.evaluate({
  prompt: 'Explain machine learning',
  output: 'Machine learning is a subset of AI...',
  rubric: 'rubric-quality-v1'
});

console.log(result.scores);
// {
//   relevance: 0.90,     // normalized from likert_5
//   coherence: 0.85,
//   completeness: 0.78,  // normalized from percentage
//   clarity: 0.92
// }

console.log(result.overall); // 0.86
console.log(result.reasoning); // "The response is highly relevant and clear..."
```

## Hallucination Detection

The hallucination detection system identifies factual fabrications in AI outputs.

| Method | Description |
|---|---|
| Factual Consistency | Cross-reference claims against provided context or known facts |
| Internal Consistency | Detect contradictions within the same response |
| Span Detection | Identify specific spans of text that contain hallucinated content |

### Detection Config

```js
const result = judge.detectHallucinations({
  prompt: 'What is the population of Paris?',
  output: 'Paris has a population of 12 million people.',
  context: 'Paris population: 2.1 million (city proper)'
});

console.log(result);
// {
//   hallucinationScore: 0.85,   // 0 = no hallucination, 1 = severe
//   spans: [
//     { text: '12 million', start: 24, end: 34, confidence: 0.95, type: 'factual_contradiction' }
//   ],
//   reasoning: 'The output states 12 million but the provided context indicates 2.1 million.'
// }
```

## Quality Scoring Dimensions

| Dimension | Description | Evaluation Criteria |
|---|---|---|
| Relevance | How well the response addresses the query | Topic alignment, intent matching |
| Coherence | Logical flow and structure | Paragraph structure, argument progression |
| Completeness | Coverage of all aspects of the query | Missing elements, thoroughness |
| Clarity | Understandability and precision | Ambiguity, jargon, conciseness |

## Full Example

```js
const { JudgeEngine } = require('./lib/evaluation/judge');

const judge = new JudgeEngine();

// Evaluate a single output
const result = judge.evaluate({
  prompt: 'Write a haiku about programming',
  output: 'Bugs crawl through the code,\nStack traces light up the screen,\nA fix is deployed.',
  rubric: {
    criteria: [
      { name: 'format', weight: 0.3, description: 'Follows 5-7-5 syllable structure' },
      { name: 'theme', weight: 0.4, description: 'Captures the theme of programming' },
      { name: 'creativity', weight: 0.3, description: 'Creative and engaging' }
    ]
  }
});

console.log(`Overall: ${result.overall}`);
console.log(`Reasoning: ${result.reasoning}`);

// Pair comparison
const comparison = judge.compare({
  prompt: 'Explain REST APIs',
  outputA: 'REST is an architectural style...',
  outputB: 'REST APIs use HTTP methods...',
  rubric: 'rubric-quality-v1'
});

console.log(`Winner: ${comparison.winner}`);
// Returns 'A', 'B', or 'tie'
```

## API Endpoints

All routes under `/api/v1/judge/`:

| Method | Path | Description |
|---|---|---|
| POST | `/evaluate` | Evaluate a single AI output |
| POST | `/compare` | Compare two AI outputs |
| POST | `/batch` | Batch evaluate multiple outputs |
| POST | `/hallucinations` | Detect hallucinations in an output |
| POST | `/rubrics` | Create a custom rubric |
| GET | `/rubrics` | List available rubrics |
| GET | `/rubrics/:id` | Get rubric details |
| PUT | `/rubrics/:id` | Update a rubric |
| DELETE | `/rubrics/:id` | Delete a rubric |
