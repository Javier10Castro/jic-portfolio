const { analyzeVisualDirection } = require('./analyzeVisualDirection');
const { layoutStrategy } = require('./layoutStrategy');
const { imageryStrategy } = require('./imageryStrategy');
const { interactionStrategy } = require('./interactionStrategy');
const { brandingStrategy } = require('./brandingStrategy');
const { validateDesignStrategy } = require('./validateDesignStrategy');

function generateDesignStrategy(blueprint) {
  const visual = analyzeVisualDirection(blueprint);
  const layout = layoutStrategy(blueprint);
  const imagery = imageryStrategy(blueprint);
  const interaction = interactionStrategy(blueprint);
  const brand = brandingStrategy(blueprint);

  const strategy = {
    meta: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      source: 'design_strategy',
      blueprintVersion: blueprint.meta ? blueprint.meta.version : 'unknown',
    },
    project: {
      name: blueprint.project.name,
      type: blueprint.project.type,
    },
    visual,
    layout,
    imagery,
    interaction,
    brand,
  };

  return validateDesignStrategy(strategy);
}

module.exports = { generateDesignStrategy };
