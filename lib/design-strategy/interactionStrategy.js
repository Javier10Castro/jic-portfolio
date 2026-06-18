function interactionStrategy(blueprint) {
  const type = blueprint.project.type;
  const pages = blueprint.pages || [];
  const components = blueprint.components || {};
  const reusable = components.reusable || [];

  const hasEcommerce = pages.some(p => p.type === 'ecommerce') || reusable.some(c => c.type === 'ecommerce');
  const hasPortfolio = pages.some(p => p.type === 'portfolio') || reusable.some(c => c.type === 'portfolio');
  const hasBooking = pages.some(p => p.type === 'booking') || reusable.some(c => c.type === 'booking');

  let animationStyle;
  let transitionType;
  let hoverStyle;
  let scrollBehavior;
  let pageTransition;

  if (type === 'ecommerce') {
    animationStyle = 'functional_minimal';
    transitionType = 'quick_ease';
    hoverStyle = 'scale_highlight';
    scrollBehavior = 'smooth';
    pageTransition = 'fade';
  } else if (type === 'portfolio') {
    animationStyle = 'expressive_showcase';
    transitionType = 'slow_graceful';
    hoverStyle = 'reveal_overlay';
    scrollBehavior = 'parallax';
    pageTransition = 'slide';
  } else if (type === 'service_business') {
    animationStyle = 'professional_subtle';
    transitionType = 'standard_ease';
    hoverStyle = 'color_shift';
    scrollBehavior = 'smooth';
    pageTransition = 'fade';
  } else {
    animationStyle = 'playful_light';
    transitionType = 'bouncy_quick';
    hoverStyle = 'lift_shadow';
    scrollBehavior = 'smooth';
    pageTransition = 'fade';
  }

  if (hasBooking && type !== 'booking') {
    animationStyle = 'functional_minimal';
    transitionType = 'quick_ease';
  }

  return {
    animationStyle,
    transitionType,
    hoverStyle,
    scrollBehavior,
    pageTransition,
  };
}

module.exports = { interactionStrategy };
