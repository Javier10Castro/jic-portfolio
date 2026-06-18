function planNavigation(pages, planIR) {
  const type = planIR.project.type;
  const features = planIR.features;

  const primary = [];
  const footer = [];
  const utility = [];

  const addNav = (target, label, path, order) => {
    target.push({ label, path, order });
  };

  // Primary navigation
  addNav(primary, 'Home', '/', 10);

  if (type === 'ecommerce') {
    addNav(primary, 'Shop', '/shop', 20);
    addNav(primary, 'About', '/about', 30);
    addNav(primary, 'Contact', '/contact', 80);
  } else if (type === 'portfolio') {
    addNav(primary, 'Portfolio', '/portfolio', 20);
    addNav(primary, 'About', '/about', 30);
    addNav(primary, 'Contact', '/contact', 80);
  } else if (type === 'service_business') {
    addNav(primary, 'Services', '/services', 20);
    addNav(primary, 'About', '/about', 30);
    if (features.booking_system) addNav(primary, 'Book Now', '/booking', 70);
    addNav(primary, 'Contact', '/contact', 80);
  } else {
    addNav(primary, 'About', '/about', 20);
    addNav(primary, 'Services', '/services', 30);
    if (features.booking_system) addNav(primary, 'Book Now', '/booking', 70);
    addNav(primary, 'Contact', '/contact', 80);
  }

  if (features.blog) addNav(primary, 'Blog', '/blog', 60);
  if (features.faq) addNav(primary, 'FAQ', '/faq', 65);

  // Footer navigation
  addNav(footer, 'Home', '/', 10);
  addNav(footer, 'About', '/about', 20);
  addNav(footer, 'Services', '/services', 30);
  if (type === 'ecommerce') addNav(footer, 'Shop', '/shop', 25);
  if (type === 'portfolio') addNav(footer, 'Portfolio', '/portfolio', 25);
  addNav(footer, 'Contact', '/contact', 80);
  addNav(footer, 'Privacy Policy', '/privacy', 90);
  addNav(footer, 'Terms of Service', '/terms', 95);

  // Utility navigation
  if (planIR.project.name) {
    addNav(utility, planIR.project.name, '/', 10);
  }
  if (type === 'ecommerce') {
    addNav(utility, 'Cart', '/cart', 20);
    addNav(utility, 'My Account', '/account', 30);
  }

  // Sort by order
  const sortNav = (arr) => arr.sort((a, b) => a.order - b.order);

  return {
    primary: sortNav(primary),
    footer: sortNav(footer),
    utility: sortNav(utility),
  };
}

module.exports = { planNavigation };
