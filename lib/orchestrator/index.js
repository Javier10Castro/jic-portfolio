const { analyzeBrief } = require('./analyzeBrief');
const { generatePlanIR } = require('./generatePlanIR');
const { validatePlanIR } = require('./validatePlanIR');

function orchestrateBrief(formData) {
  const analysis = analyzeBrief(formData);
  const planIR = generatePlanIR(formData);
  return planIR;
}

module.exports = { orchestrateBrief, analyzeBrief, generatePlanIR, validatePlanIR };
