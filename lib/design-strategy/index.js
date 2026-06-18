const { generateDesignStrategy } = require('./generateDesignStrategy');
const { validateDesignStrategy } = require('./validateDesignStrategy');

function designStrategy(blueprint) {
  return generateDesignStrategy(blueprint);
}

module.exports = { designStrategy, generateDesignStrategy, validateDesignStrategy };
