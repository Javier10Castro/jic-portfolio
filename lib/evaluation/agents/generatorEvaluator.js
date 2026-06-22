class GeneratorEvaluator {
  constructor() {
    this.data = new Map();
  }

  evaluateGeneration(output, input, criteria) {
    const quality = Math.min(1, Math.max(0, Math.random() * 0.3 + 0.7));
    const relevance = input ? (output.toLowerCase().includes(input.toLowerCase().slice(0, 10)) ? 0.9 : 0.5) : 0.7;
    const creativity = Math.min(1, Math.max(0, Math.random() * 0.4 + 0.4));
    const safety = Math.random() > 0.1 ? 1 : 0.3;
    const overall = (quality + relevance + creativity + safety) / 4;
    return { quality, relevance, creativity, safety, overall };
  }

  evaluateCode(code, requirements) {
    const correctness = requirements
      ? requirements.filter(r => code.includes(r)).length / requirements.length
      : 0.5;
    const efficiency = code.length < 500 ? 1 : Math.max(0, 1 - (code.length - 500) / 2000);
    const style = /^(function|const|let|class|import|export)/m.test(code) ? 0.8 : 0.5;
    const security = !code.includes('eval(') && !code.includes('innerHTML') ? 1 : 0.3;
    return { correctness, efficiency, style, security };
  }

  evaluateText(text, criteria) {
    const grammar = /[.!?]\s+[A-Z]/.test(text) ? 0.9 : 0.6;
    const coherence = text.split(' ').length > 10 ? 0.8 : 0.5;
    const style = criteria.style ? (text.includes(criteria.style) ? 0.9 : 0.4) : 0.7;
    const tone = criteria.tone ? (text.toLowerCase().includes(criteria.tone.toLowerCase()) ? 0.85 : 0.5) : 0.7;
    return { grammar, coherence, style, tone };
  }

  evaluateStructure(structure, schema) {
    const expectedKeys = Object.keys(schema);
    const actualKeys = Object.keys(structure);
    const matched = expectedKeys.filter(k => actualKeys.includes(k));
    const validity = matched.length / expectedKeys.length;
    const completeness =
      expectedKeys.filter(k => {
        const t = structure[k];
        return t !== undefined && t !== null;
      }).length / expectedKeys.length;
    return { validity, completeness };
  }

  clear() {
    this.data.clear();
  }
}

module.exports = GeneratorEvaluator;
