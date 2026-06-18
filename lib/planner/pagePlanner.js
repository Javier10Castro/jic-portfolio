function planPages(planIR) {
  const type = planIR.project.type;
  const features = planIR.features;
  const priorityPages = planIR.structure.priorityPages || [];

  const pages = [];

  const addPage = (id, title, path, type, priority, sections) => {
    pages.push({ id, title, path, type, priority, sections, children: [] });
  };

  // Core pages — landing_page uses a single-page layout, skip duplicate home
  if (type !== 'landing_page') {
    addPage('home', 'Home', '/', 'home', 'critical', ['hero', 'about', 'services', 'portfolio', 'products', 'testimonials', 'contact']);
  }
  addPage('about', 'About', '/about', 'about', 'high', ['story', 'mission', 'team', 'values']);
  addPage('contact', 'Contact', '/contact', 'contact', 'critical', ['form', 'info', 'map']);

  const serviceTitle = planIR.project.type === 'service_business' ? 'Services' : 'What We Do';
  addPage('services', serviceTitle, '/services', 'services', 'high', ['overview', 'list', 'cta']);

  addPage('privacy', 'Privacy Policy', '/privacy', 'legal', 'low', ['content']);
  addPage('terms', 'Terms of Service', '/terms', 'legal', 'low', ['content']);

  const lang = 'en';

  // Type-specific pages
  if (type === 'ecommerce') {
    addPage('shop', 'Shop', '/shop', 'ecommerce', 'critical', ['products', 'categories', 'featured']);
    addPage('cart', 'Cart', '/cart', 'ecommerce', 'critical', ['items', 'checkout']);
    addPage('checkout', 'Checkout', '/checkout', 'ecommerce', 'critical', ['form', 'payment', 'summary']);
    addPage('product_detail', 'Product Detail', '/product/:slug', 'ecommerce', 'high', ['gallery', 'info', 'related']);
    addPage('account', 'My Account', '/account', 'ecommerce', 'medium', ['profile', 'orders', 'settings']);
  }

  if (type === 'portfolio') {
    addPage('portfolio', 'Portfolio', '/portfolio', 'portfolio', 'critical', ['grid', 'filter', 'featured']);
    addPage('project_detail', 'Project Detail', '/project/:slug', 'portfolio', 'high', ['gallery', 'description', 'testimonial']);
  }

  if (type === 'service_business') {
    addPage('service_detail', 'Service Detail', '/service/:slug', 'services', 'high', ['overview', 'benefits', 'process', 'cta']);
    addPage('pricing', 'Pricing', '/pricing', 'services', 'medium', ['plans', 'comparison', 'cta']);
  }

  if (features.booking_system) {
    addPage('booking', 'Book Now', '/booking', 'feature', 'high', ['calendar', 'form', 'confirmation']);
  }

  if (features.blog) {
    addPage('blog', 'Blog', '/blog', 'content', 'medium', ['list', 'featured']);
    addPage('blog_post', 'Blog Post', '/blog/:slug', 'content', 'medium', ['content', 'share', 'related']);
  }

  if (features.faq) {
    addPage('faq', 'FAQ', '/faq', 'content', 'medium', ['list', 'search']);
  }

  if (type === 'landing_page') {
    addPage('landing', 'Landing', '/', 'landing', 'critical', ['hero', 'features', 'testimonials', 'pricing', 'cta']);
  }

  // Elevate priority for user-specified priority pages
  for (const pp of priorityPages) {
    const match = pages.find(p => p.title.toLowerCase().includes(pp.toLowerCase()) || pp.toLowerCase().includes(p.title.toLowerCase()));
    if (match && match.priority !== 'critical') {
      match.priority = 'critical';
    }
  }

  return pages;
}

module.exports = { planPages };
