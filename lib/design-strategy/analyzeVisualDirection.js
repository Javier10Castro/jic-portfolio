function analyzeVisualDirection(blueprint) {
  const type = blueprint.project.type;
  const sections = (blueprint.sections && blueprint.sections.registry) || [];
  const components = blueprint.components || {};
  const reusable = components.reusable || [];

  const sectionCount = sections.length;
  const hasEcommerceComponents = reusable.some(c => c.type === 'ecommerce');
  const hasPortfolioComponents = reusable.some(c => c.type === 'portfolio');
  const hasBookingComponents = reusable.some(c => c.type === 'booking');

  let visualPersonality;
  let designStyle;
  let sophisticationLevel;

  if (type === 'ecommerce') {
    if (hasEcommerceComponents && hasBookingComponents) {
      visualPersonality = 'modern_trustworthy';
      designStyle = 'clean_commercial';
      sophisticationLevel = 3;
    } else {
      visualPersonality = 'polished_professional';
      designStyle = 'minimal_retail';
      sophisticationLevel = 3;
    }
  } else if (type === 'portfolio') {
    visualPersonality = 'creative_showcase';
    designStyle = 'expressive_editorial';
    sophisticationLevel = 4;
  } else if (type === 'service_business') {
    visualPersonality = 'professional_warm';
    designStyle = 'corporate_refined';
    sophisticationLevel = 3;
  } else {
    visualPersonality = 'friendly_approachable';
    designStyle = 'modern_minimal';
    sophisticationLevel = 2;
  }

  if (sectionCount > 10) sophisticationLevel = Math.min(sophisticationLevel + 1, 5);

  return {
    visualPersonality,
    designStyle,
    sophisticationLevel,
  };
}

module.exports = { analyzeVisualDirection };
