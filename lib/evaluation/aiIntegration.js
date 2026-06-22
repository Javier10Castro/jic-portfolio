class AiEvaluationIntegration {
  constructor(evaluationEngine) {
    this._engine = evaluationEngine;
    this._enabled = true;
    this._autoEvaluations = [];
  }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }
  isEnabled() { return this._enabled; }

  async evaluatePlannerOutput(plan, goal) {
    if (!this._enabled) return null;
    const pa = require('./agents/plannerEvaluator');
    const result = pa.evaluatePlan(plan, goal);
    this._record('planner', result);
    return result;
  }

  async evaluateGeneratorOutput(output, input, criteria) {
    if (!this._enabled) return null;
    const ge = require('./agents/generatorEvaluator');
    const result = ge.evaluateGeneration(output, input, criteria || {});
    this._record('generator', result);
    return result;
  }

  async evaluateContentOutput(output, input) {
    if (!this._enabled) return null;
    const qs = require('./models/qualityScoring');
    const result = {
      quality: qs.score(output, input, {}),
      relevance: qs.scoreRelevance(output, input),
      coherence: qs.scoreCoherence(output),
    };
    this._record('content', result);
    return result;
  }

  async evaluateAgentOutput(agentId, output, expected) {
    if (!this._enabled) return null;
    const ae = require('./agents/agentEvaluator');
    const result = ae.evaluateAgent(agentId, output, expected);
    this._record('agent', result);
    return result;
  }

  async evaluateWorkflowOutput(workflowId, executionLog) {
    if (!this._enabled) return null;
    const we = require('./agents/workflowEvaluator');
    const result = we.evaluateWorkflow(workflowId, executionLog);
    this._record('workflow', result);
    return result;
  }

  async evaluateConversation(messages, goal) {
    if (!this._enabled) return null;
    const ce = require('./agents/conversationEvaluator');
    const result = ce.evaluateConversation(messages);
    if (goal) {
      result.goalCompletion = ce.evaluateGoalCompletion(messages, goal);
    }
    this._record('conversation', result);
    return result;
  }

  _record(source, result) {
    const entry = { source, result, timestamp: Date.now() };
    this._autoEvaluations.push(entry);
    if (this._autoEvaluations.length > 1000) this._autoEvaluations.shift();
    if (this._engine && this._engine.events) {
      this._engine.events.emit('evaluation:ai_auto_evaluated', { source, result });
    }
  }

  getEvaluationHistory(source) {
    if (source) return this._autoEvaluations.filter(e => e.source === source);
    return this._autoEvaluations;
  }

  getStats() {
    const bySource = {};
    for (const e of this._autoEvaluations) {
      bySource[e.source] = (bySource[e.source] || 0) + 1;
    }
    return { total: this._autoEvaluations.length, bySource };
  }

  clear() {
    this._autoEvaluations = [];
  }
}

module.exports = { AiEvaluationIntegration };
