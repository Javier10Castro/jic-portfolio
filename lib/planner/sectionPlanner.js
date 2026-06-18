function planSections(planIR, pages) {
  const planSections = planIR.structure.sections || [];
  const type = planIR.project.type;

  const sectionRegistry = [];

  for (const ps of planSections) {
    const section = buildSectionDef(ps.id, ps.required, type, planIR);
    sectionRegistry.push(section);
  }

  // Map sections to pages based on page type
  const pageSectionMap = {};
  for (const page of pages) {
    pageSectionMap[page.id] = resolvePageSections(page, sectionRegistry, type, planIR);
  }

  return { registry: sectionRegistry, pageMap: pageSectionMap };
}

function buildSectionDef(id, required, type, planIR) {
  const defs = {
    hero: {
      label: { en: 'Hero Banner', es: 'Hero Banner' },
      description: { en: 'Main headline, subtitle, and primary CTA', es: 'Titular principal, subtítulo y CTA principal' },
      components: ['headline', 'subtitle', 'cta_button', 'background_media'],
    },
    about: {
      label: { en: 'About Us', es: 'Sobre Nosotros' },
      description: { en: 'Company story, mission, and values', es: 'Historia de la empresa, misión y valores' },
      components: ['text_block', 'image', 'stats_row'],
    },
    services: {
      label: { en: 'Services', es: 'Servicios' },
      description: { en: 'Overview of services offered', es: 'Resumen de servicios ofrecidos' },
      components: ['service_card', 'icon_list', 'cta_banner'],
    },
    portfolio: {
      label: { en: 'Portfolio', es: 'Portafolio' },
      description: { en: 'Showcase of past work', es: 'Muestra de trabajos anteriores' },
      components: ['project_card', 'gallery', 'filter_bar'],
    },
    products: {
      label: { en: 'Products', es: 'Productos' },
      description: { en: 'Featured product display', es: 'Exhibición de productos destacados' },
      components: ['product_card', 'grid', 'pagination'],
    },
    testimonials: {
      label: { en: 'Testimonials', es: 'Testimonios' },
      description: { en: 'Client testimonials and reviews', es: 'Testimonios y reseñas de clientes' },
      components: ['testimonial_card', 'carousel', 'rating_stars'],
    },
    contact: {
      label: { en: 'Contact', es: 'Contacto' },
      description: { en: 'Contact form and information', es: 'Formulario de contacto e información' },
      components: ['contact_form', 'info_block', 'map', 'social_links'],
    },
    footer: {
      label: { en: 'Footer', es: 'Pie de Página' },
      description: { en: 'Site-wide footer', es: 'Pie de página del sitio' },
      components: ['logo', 'nav_links', 'social_icons', 'copyright'],
    },
    blog: {
      label: { en: 'Blog', es: 'Blog' },
      description: { en: 'Blog posts and articles', es: 'Entradas y artículos del blog' },
      components: ['post_card', 'sidebar', 'pagination'],
    },
    faq: {
      label: { en: 'FAQ', es: 'FAQ' },
      description: { en: 'Frequently asked questions', es: 'Preguntas frecuentes' },
      components: ['accordion', 'search_bar', 'category_tabs'],
    },
    booking: {
      label: { en: 'Booking', es: 'Reservas' },
      description: { en: 'Appointment booking system', es: 'Sistema de reserva de citas' },
      components: ['calendar', 'booking_form', 'confirmation'],
    },
  };

  const def = defs[id] || {
    label: { en: id, es: id },
    description: { en: '', es: '' },
    components: [],
  };

  return {
    id,
    required,
    label: def.label,
    description: def.description,
    components: def.components,
  };
}

function resolvePageSections(page, registry, type, planIR) {
  const pageTypeMap = {
    home: ['hero', 'about', 'services', 'portfolio', 'products', 'testimonials', 'contact'],
    about: ['about'],
    services: ['services'],
    contact: ['contact'],
    landing: ['hero', 'about', 'testimonials', 'contact'],
    shop: ['products'],
    cart: ['products'],
    checkout: ['products'],
    ecommerce: ['products'],
    portfolio: ['portfolio'],
    project_detail: ['portfolio'],
    service_detail: ['services'],
    pricing: ['services'],
    booking: ['booking'],
    blog: ['blog'],
    blog_post: ['blog'],
    faq: ['faq'],
    legal: [],
  };

  const sectionIds = pageTypeMap[page.type] || [];
  return sectionIds
    .map(id => registry.find(s => s.id === id))
    .filter(Boolean);
}

module.exports = { planSections };
