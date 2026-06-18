class DesignStrategyValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'DesignStrategyValidationError';
    this.details = details;
  }
}

function validateDesignStrategy(strategy) {
  if (!strategy || typeof strategy !== 'object') {
    throw new DesignStrategyValidationError('Design strategy must be an object', { received: typeof strategy });
  }

  if (!strategy.visual || typeof strategy.visual !== 'object') {
    throw new DesignStrategyValidationError('Design strategy must contain visual object', { visual: strategy.visual });
  }

  const requiredVisual = ['visualPersonality', 'designStyle', 'sophisticationLevel'];
  for (const field of requiredVisual) {
    if (strategy.visual[field] === undefined || strategy.visual[field] === null) {
      throw new DesignStrategyValidationError(`visual.${field} is required`, { visual: strategy.visual });
    }
  }

  if (typeof strategy.visual.sophisticationLevel !== 'number' || strategy.visual.sophisticationLevel < 1 || strategy.visual.sophisticationLevel > 5) {
    throw new DesignStrategyValidationError('visual.sophisticationLevel must be a number between 1 and 5', { received: strategy.visual.sophisticationLevel });
  }

  if (!strategy.layout || typeof strategy.layout !== 'object') {
    throw new DesignStrategyValidationError('Design strategy must contain layout object', { layout: strategy.layout });
  }

  const requiredLayout = ['spacing', 'layoutStyle', 'gridType', 'containerWidth'];
  for (const field of requiredLayout) {
    if (!strategy.layout[field]) {
      throw new DesignStrategyValidationError(`layout.${field} is required`, { layout: strategy.layout });
    }
  }

  if (!strategy.imagery || typeof strategy.imagery !== 'object') {
    throw new DesignStrategyValidationError('Design strategy must contain imagery object', { imagery: strategy.imagery });
  }

  const requiredImagery = ['photographyStyle', 'iconography', 'illustrationStyle', 'imageDensity'];
  for (const field of requiredImagery) {
    if (!strategy.imagery[field]) {
      throw new DesignStrategyValidationError(`imagery.${field} is required`, { imagery: strategy.imagery });
    }
  }

  if (!strategy.interaction || typeof strategy.interaction !== 'object') {
    throw new DesignStrategyValidationError('Design strategy must contain interaction object', { interaction: strategy.interaction });
  }

  const requiredInteraction = ['animationStyle', 'transitionType', 'hoverStyle', 'scrollBehavior', 'pageTransition'];
  for (const field of requiredInteraction) {
    if (!strategy.interaction[field]) {
      throw new DesignStrategyValidationError(`interaction.${field} is required`, { interaction: strategy.interaction });
    }
  }

  if (!strategy.brand || typeof strategy.brand !== 'object') {
    throw new DesignStrategyValidationError('Design strategy must contain brand object', { brand: strategy.brand });
  }

  if (!strategy.brand.brandTone || !strategy.brand.brandValues || !strategy.brand.accessibilityPriority) {
    throw new DesignStrategyValidationError('brand.brandTone, brand.brandValues, and brand.accessibilityPriority are required', { brand: strategy.brand });
  }

  return strategy;
}

module.exports = { validateDesignStrategy, DesignStrategyValidationError };
