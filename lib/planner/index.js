const { generateBlueprint } = require('./generateBlueprint');
const { validateBlueprint } = require('./validateBlueprint');

function planProject(planIR) {
  return generateBlueprint(planIR);
}

module.exports = { planProject, generateBlueprint, validateBlueprint };
