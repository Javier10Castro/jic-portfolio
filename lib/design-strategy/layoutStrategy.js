function layoutStrategy(blueprint) {
  const type = blueprint.project.type;
  const pages = blueprint.pages || [];
  const pageCount = pages.length;
  const hasEcommercePages = pages.some(p => p.type === 'ecommerce');
  const hasPortfolioPages = pages.some(p => p.type === 'portfolio');
  const hasBlog = pages.some(p => p.type === 'content');

  let spacing;
  let layoutStyle;
  let gridType;
  let containerWidth;

  if (type === 'ecommerce') {
    spacing = 'compact';
    layoutStyle = 'product_forward';
    gridType = 'responsive_grid';
    containerWidth = 'wide';
  } else if (type === 'portfolio') {
    spacing = 'generous';
    layoutStyle = 'editorial_flow';
    gridType = 'masonry';
    containerWidth = 'full_bleed';
  } else if (type === 'service_business') {
    spacing = 'balanced';
    layoutStyle = 'conversion_focused';
    gridType = 'standard_grid';
    containerWidth = 'contained';
  } else {
    spacing = 'generous';
    layoutStyle = 'single_column';
    gridType = 'centered';
    containerWidth = 'contained';
  }

  if (hasBlog && type !== 'blog') {
    layoutStyle = layoutStyle + '_with_content';
  }

  if (pageCount > 10) {
    gridType = 'complex_grid';
  }

  return {
    spacing,
    layoutStyle,
    gridType,
    containerWidth,
  };
}

module.exports = { layoutStrategy };
