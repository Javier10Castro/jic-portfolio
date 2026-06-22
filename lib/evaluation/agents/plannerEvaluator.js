class PlannerEvaluator {
  constructor() {
    this.data = new Map();
  }

  evaluatePlan(plan, goal) {
    const steps = plan.steps || [];
    const completeness = steps.length > 0
      ? steps.filter(s => s.description && s.action).length / steps.length
      : 0;
    const feasibility = Math.min(1, Math.max(0, Math.random() * 0.3 + 0.7));
    const efficiency = steps.length > 0
      ? Math.min(1, 10 / steps.length)
      : 0;
    const score = completeness * 0.35 + feasibility * 0.35 + efficiency * 0.3;
    return { score, completeness, feasibility, efficiency };
  }

  evaluateStep(step, context) {
    const clarity = step.description && step.description.length > 10 ? 1 : Math.min(1, (step.description || '').length / 10);
    const actionability = step.action ? 1 : 0;
    const dependencyCorrectness = step.dependencies
      ? step.dependencies.every(d => context.steps && context.steps.includes(d)) ? 1 : 0.5
      : 1;
    return { clarity, actionability, dependencyCorrectness };
  }

  evaluateExecution(plan, executionLog) {
    const planSteps = plan.steps || [];
    const executedSteps = executionLog.executedSteps || [];
    let matched = 0;
    for (let i = 0; i < Math.min(planSteps.length, executedSteps.length); i++) {
      if (planSteps[i].id === executedSteps[i].id) matched++;
    }
    const fidelity = planSteps.length > 0 ? matched / planSteps.length : 0;
    const deviationScore = 1 - fidelity;
    return { fidelity, deviationScore };
  }

  comparePlans(planA, planB) {
    const stepsA = planA.steps || [];
    const stepsB = planB.steps || [];
    const differences = {
      countA: stepsA.length,
      countB: stepsB.length,
      diffCount: Math.abs(stepsA.length - stepsB.length),
      onlyInA: stepsA.filter(s => !stepsB.find(b => b.id === s.id)).map(s => s.id),
      onlyInB: stepsB.filter(s => !stepsA.find(a => a.id === s.id)).map(s => s.id),
    };
    const recommendation =
      differences.onlyInA.length <= differences.onlyInB.length ? 'planA' : 'planB';
    return { differences, recommendation };
  }

  clear() {
    this.data.clear();
  }
}

module.exports = PlannerEvaluator;
