function imageryStrategy(blueprint) {
  const type = blueprint.project.type;
  const components = blueprint.components || {};
  const reusable = components.reusable || [];
  const pageSpecific = components.pageSpecific || {};

  const allPageComps = Object.values(pageSpecific).flat();
  const hasGallery = allPageComps.includes('gallery');
  const hasCarousel = allPageComps.includes('carousel');
  const hasBackgroundMedia = allPageComps.includes('background_media');

  const hasPortfolioComponents = reusable.some(c => c.type === 'portfolio');
  const hasEcommerceComponents = reusable.some(c => c.type === 'ecommerce');

  let photographyStyle;
  let iconography;
  let illustrationStyle;
  let imageDensity;

  if (type === 'ecommerce') {
    photographyStyle = 'product_focused';
    iconography = 'outline_consistent';
    illustrationStyle = 'minimal_flat';
    imageDensity = 'high';
  } else if (type === 'portfolio') {
    photographyStyle = 'editorial_dramatic';
    iconography = 'minimal_creative';
    illustrationStyle = 'artistic_expressive';
    imageDensity = 'high';
  } else if (type === 'service_business') {
    photographyStyle = 'professional_team';
    iconography = 'solid_professional';
    illustrationStyle = 'corporate_clean';
    imageDensity = 'moderate';
  } else {
    photographyStyle = 'lifestyle_warm';
    iconography = 'rounded_friendly';
    illustrationStyle = 'warm_playful';
    imageDensity = 'moderate';
  }

  if (hasGallery || hasCarousel) photographyStyle = photographyStyle + '_rich';

  return {
    photographyStyle,
    iconography,
    illustrationStyle,
    imageDensity,
  };
}

module.exports = { imageryStrategy };
