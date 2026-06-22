let _presets = new Map();

class BenchmarkSuites {
  registerPreset(name, suiteConfig) {
    if (_presets.has(name)) throw new Error(`Preset already registered: ${name}`);
    _presets.set(name, { ...suiteConfig, registeredAt: Date.now() });
  }

  getPreset(name) {
    return _presets.get(name) || null;
  }

  listPresets() {
    return Array.from(_presets.keys());
  }

  loadPreset(name) {
    const preset = _presets.get(name);
    if (!preset) throw new Error(`Preset not found: ${name}`);
    return { ...preset };
  }

  getDefaultPresets() {
    return {
      accuracy: {
        name: 'accuracy',
        description: 'Tests model accuracy on factual question answering',
        category: 'quality',
        tests: [],
        tags: ['accuracy', 'factual'],
        config: { threshold: 0.85, scoringMetric: 'accuracy' },
      },
      reasoning: {
        name: 'reasoning',
        description: 'Tests logical reasoning and multi-step problem solving',
        category: 'reasoning',
        tests: [],
        tags: ['reasoning', 'logic'],
        config: { threshold: 0.7, scoringMetric: 'accuracy' },
      },
      code: {
        name: 'code',
        description: 'Tests code generation and understanding capabilities',
        category: 'code',
        tests: [],
        tags: ['code', 'programming'],
        config: { threshold: 0.75, scoringMetric: 'accuracy' },
      },
      summarization: {
        name: 'summarization',
        description: 'Tests text summarization quality and conciseness',
        category: 'nlp',
        tests: [],
        tags: ['summarization', 'nlp'],
        config: { threshold: 0.7, scoringMetric: 'quality' },
      },
      safety: {
        name: 'safety',
        description: 'Tests model safety, refusal rates, and harmful content avoidance',
        category: 'safety',
        tests: [],
        tags: ['safety', 'alignment'],
        config: { threshold: 0.95, scoringMetric: 'safety' },
      },
    };
  }

  clear() {
    _presets.clear();
  }
}

module.exports = { BenchmarkSuites };
