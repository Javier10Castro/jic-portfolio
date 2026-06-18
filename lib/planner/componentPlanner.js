function planComponents(pages, planIR) {
  const type = planIR.project.type;
  const features = planIR.features;

  const global = [
    { id: 'site_header', type: 'header', scope: 'global', required: true },
    { id: 'site_footer', type: 'footer', scope: 'global', required: true },
    { id: 'seo_meta', type: 'seo', scope: 'global', required: true },
    { id: 'analytics_tracking', type: 'analytics', scope: 'global', required: true },
  ];

  if (features.live_chat) {
    global.push({ id: 'live_chat_widget', type: 'chat', scope: 'global', required: false });
  }

  if (features.newsletter) {
    global.push({ id: 'newsletter_signup', type: 'form', scope: 'global', required: false });
  }

  const reusable = [
    { id: 'cta_button', type: 'ui', variants: ['primary', 'secondary', 'outline'], description: 'Call-to-action button' },
    { id: 'social_links', type: 'ui', variants: ['icon', 'bar'], description: 'Social media link collection' },
    { id: 'contact_form', type: 'form', variants: ['simple', 'full'], description: 'Contact form with validation' },
    { id: 'testimonial_card', type: 'content', variants: ['text', 'video'], description: 'Testimonial display card' },
    { id: 'service_card', type: 'content', variants: ['icon', 'image'], description: 'Service summary card' },
    { id: 'section_heading', type: 'ui', variants: ['center', 'left'], description: 'Section title and subtitle' },
  ];

  if (type === 'ecommerce') {
    reusable.push(
      { id: 'product_card', type: 'ecommerce', variants: ['grid', 'list'], description: 'Product display card' },
      { id: 'add_to_cart', type: 'ecommerce', variants: ['button', 'form'], description: 'Add to cart control' },
      { id: 'price_display', type: 'ecommerce', variants: ['single', 'range', 'sale'], description: 'Price display' },
      { id: 'rating_stars', type: 'ecommerce', variants: ['interactive', 'static'], description: 'Star rating display' },
    );
  }

  if (type === 'portfolio') {
    reusable.push(
      { id: 'project_card', type: 'portfolio', variants: ['grid', 'featured'], description: 'Project summary card' },
      { id: 'gallery', type: 'portfolio', variants: ['grid', 'masonry', 'slider'], description: 'Image gallery' },
      { id: 'filter_bar', type: 'portfolio', variants: ['tags', 'dropdown'], description: 'Content filter control' },
    );
  }

  if (type === 'service_business') {
    reusable.push(
      { id: 'pricing_table', type: 'business', variants: ['cards', 'rows'], description: 'Pricing plan display' },
      { id: 'process_step', type: 'business', variants: ['horizontal', 'vertical'], description: 'Step-by-step process' },
    );
  }

  if (features.booking_system) {
    reusable.push(
      { id: 'booking_calendar', type: 'booking', variants: ['month', 'week'], description: 'Availability calendar' },
      { id: 'booking_form', type: 'booking', variants: ['modal', 'inline'], description: 'Appointment booking form' },
    );
  }

  if (features.blog) {
    reusable.push(
      { id: 'blog_card', type: 'content', variants: ['list', 'grid'], description: 'Blog post preview card' },
      { id: 'share_buttons', type: 'social', variants: ['sticky', 'inline'], description: 'Content sharing buttons' },
    );
  }

  // Page-specific components
  const pageSpecific = {};
  for (const page of pages) {
    const comps = [];
    for (const sectionId of (page.sections || [])) {
      const sectionCompMap = {
        hero: ['headline', 'subtitle', 'cta_button', 'background_media'],
        about: ['text_block', 'image', 'stats_row', 'team_grid'],
        services: ['service_card', 'icon_list', 'cta_banner'],
        portfolio: ['project_card', 'gallery', 'filter_bar'],
        products: ['product_card', 'grid', 'pagination'],
        testimonials: ['testimonial_card', 'carousel', 'rating_stars'],
        contact: ['contact_form', 'info_block', 'map', 'social_links'],
        footer: ['logo', 'nav_links', 'social_icons', 'copyright'],
        blog: ['blog_card', 'sidebar', 'pagination'],
        faq: ['accordion', 'search_bar', 'category_tabs'],
        booking: ['calendar', 'booking_form', 'confirmation'],
      };
      const mapped = sectionCompMap[sectionId] || [];
      comps.push(...mapped);
    }
    pageSpecific[page.id] = [...new Set(comps)];
  }

  return { global, reusable, pageSpecific };
}

module.exports = { planComponents };
