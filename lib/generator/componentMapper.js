function mapSection(sectionContent, pageType) {
  var id = sectionContent.id;
  var mapper = componentMap[id] || fallbackComponent;
  return mapper(sectionContent, pageType);
}

var componentMap = {
  hero: heroComponent,
  about: aboutComponent,
  services: servicesComponent,
  portfolio: portfolioComponent,
  products: productsComponent,
  testimonials: testimonialsComponent,
  contact: contactComponent,
  footer: footerComponent,
  blog: blogComponent,
  faq: faqComponent,
  booking: bookingComponent,
  story: storyComponent,
  mission: missionComponent,
  team: teamComponent,
  values: valuesComponent,
  form: formComponent,
  info: infoComponent,
  cta: ctaComponent,
  overview: overviewComponent,
  list: listComponent,
  features: featuresComponent,
  pricing: pricingComponent,
  grid: gridComponent,
  gallery: galleryComponent,
  benefits: benefitsComponent,
  process: processComponent,
  plans: plansComponent,
  content: contentOnlyComponent,
  map: mapComponent,
  search: searchComponent,
  categories: categoriesComponent,
  items: itemsComponent,
  checkoutSection: checkoutComponent,
  payment: paymentComponent,
  summary: summaryComponent,
  profile: profileComponent,
  orders: ordersComponent,
  settings: settingsComponent,
  share: shareComponent,
  related: relatedComponent,
  description: descriptionComponent,
  testimonial: testimonialComponent,
  featured: featuredComponent,
  filter: filterComponent,
  comparison: comparisonComponent,
  calendar: calendarComponent,
  confirmation: confirmationComponent,
};

function sectionHtml(tag, content, className) {
  var cls = className ? ' class="' + className + '"' : '';
  return '      <section id="section-' + content.id + '"' + cls + '>\n' + tag + '\n      </section>';
}

function heroComponent(content) {
  var heading = esc(content.heading || '');
  var subheading = esc(content.subheading || '');
  var body = esc(content.body || '');
  var cta = esc(content.cta || '');
  var ctaHtml = cta ? '<a href="#contact" class="btn btn-primary">' + cta + '</a>' : '';
  var inner = '        <div class="hero-content">\n';
  if (heading) inner += '          <h1 class="hero-title">' + heading + '</h1>\n';
  if (subheading) inner += '          <p class="hero-subtitle">' + subheading + '</p>\n';
  if (body) inner += '          <p class="hero-body">' + body + '</p>\n';
  if (ctaHtml) inner += '          <div class="hero-actions">' + ctaHtml + '</div>\n';
  inner += '        </div>';
  return sectionHtml(inner, content, 'section-hero');
}

function aboutComponent(content) {
  var h = esc(content.heading || '');
  var body = esc(content.body || '');
  var cta = esc(content.cta || '');
  var ctaHtml = cta ? '<a href="/about" class="btn btn-secondary">' + cta + '</a>' : '';
  var inner = '        <div class="about-content">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (body) inner += '          <p class="about-body">' + body + '</p>\n';
  if (ctaHtml) inner += '          <div class="about-actions">' + ctaHtml + '</div>\n';
  inner += '        </div>';
  return sectionHtml(inner, content, 'section-about');
}

function servicesComponent(content) {
  var h = esc(content.heading || '');
  var sub = esc(content.subheading || '');
  var body = esc(content.body || '');
  var cta = esc(content.cta || '');
  var ctaHtml = cta ? '<a href="/contact" class="btn btn-primary">' + cta + '</a>' : '';
  var inner = '        <div class="services-header">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (sub) inner += '          <p class="section-subtitle">' + sub + '</p>\n';
  if (body) inner += '          <p class="services-body">' + body + '</p>\n';
  inner += '        </div>\n';
  inner += '        <div class="services-grid">\n';
  inner += '          <div class="service-card"><div class="service-icon">&#9312;</div><h3>Service 1</h3><p>Description of service one.</p></div>\n';
  inner += '          <div class="service-card"><div class="service-icon">&#9313;</div><h3>Service 2</h3><p>Description of service two.</p></div>\n';
  inner += '          <div class="service-card"><div class="service-icon">&#9314;</div><h3>Service 3</h3><p>Description of service three.</p></div>\n';
  inner += '        </div>\n';
  if (ctaHtml) inner += '        <div class="services-actions">' + ctaHtml + '</div>\n';
  return sectionHtml(inner, content, 'section-services');
}

function portfolioComponent(content) {
  var h = esc(content.heading || '');
  var sub = esc(content.subheading || '');
  var body = esc(content.body || '');
  var cta = esc(content.cta || '');
  var ctaHtml = cta ? '<a href="/portfolio" class="btn btn-secondary">' + cta + '</a>' : '';
  var inner = '        <div class="portfolio-header">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (sub) inner += '          <p class="section-subtitle">' + sub + '</p>\n';
  if (body) inner += '          <p class="portfolio-body">' + body + '</p>\n';
  inner += '        </div>\n';
  inner += '        <div class="portfolio-grid">\n';
  inner += '          <div class="portfolio-card"><div class="portfolio-thumb"></div><h3>Project 1</h3></div>\n';
  inner += '          <div class="portfolio-card"><div class="portfolio-thumb"></div><h3>Project 2</h3></div>\n';
  inner += '          <div class="portfolio-card"><div class="portfolio-thumb"></div><h3>Project 3</h3></div>\n';
  inner += '        </div>\n';
  if (ctaHtml) inner += '        <div class="portfolio-actions">' + ctaHtml + '</div>\n';
  return sectionHtml(inner, content, 'section-portfolio');
}

function productsComponent(content) {
  var h = esc(content.heading || '');
  var sub = esc(content.subheading || '');
  var body = esc(content.body || '');
  var inner = '        <div class="products-header">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (sub) inner += '          <p class="section-subtitle">' + sub + '</p>\n';
  if (body) inner += '          <p class="products-body">' + body + '</p>\n';
  inner += '        </div>\n';
  inner += '        <div class="products-grid">\n';
  inner += '          <div class="product-card"><div class="product-thumb"></div><h3>Product 1</h3><p class="product-price">$--</p></div>\n';
  inner += '          <div class="product-card"><div class="product-thumb"></div><h3>Product 2</h3><p class="product-price">$--</p></div>\n';
  inner += '          <div class="product-card"><div class="product-thumb"></div><h3>Product 3</h3><p class="product-price">$--</p></div>\n';
  inner += '        </div>\n';
  return sectionHtml(inner, content, 'section-products');
}

function testimonialsComponent(content) {
  var h = esc(content.heading || '');
  var sub = esc(content.subheading || '');
  var inner = '        <div class="testimonials-header">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (sub) inner += '          <p class="section-subtitle">' + sub + '</p>\n';
  inner += '        </div>\n';
  inner += '        <div class="testimonials-grid">\n';
  inner += '          <blockquote class="testimonial-card"><p>"Amazing experience. Highly recommended."</p><cite>— Client A</cite></blockquote>\n';
  inner += '          <blockquote class="testimonial-card"><p>"Professional, reliable, and creative."</p><cite>— Client B</cite></blockquote>\n';
  inner += '          <blockquote class="testimonial-card"><p>"Transformed our online presence."</p><cite>— Client C</cite></blockquote>\n';
  inner += '        </div>\n';
  return sectionHtml(inner, content, 'section-testimonials');
}

function contactComponent(content) {
  var h = esc(content.heading || '');
  var sub = esc(content.subheading || '');
  var body = esc(content.body || '');
  var cta = esc(content.cta || '');
  var ctaHtml = cta ? '<button type="submit" class="btn btn-primary">' + cta + '</button>' : '';
  var inner = '        <div class="contact-content">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (sub) inner += '          <p class="section-subtitle">' + sub + '</p>\n';
  if (body) inner += '          <p class="contact-body">' + body + '</p>\n';
  inner += '        </div>\n';
  inner += '        <form class="contact-form">\n';
  inner += '          <div class="form-group"><input type="text" placeholder="Your Name" required></div>\n';
  inner += '          <div class="form-group"><input type="email" placeholder="Email Address" required></div>\n';
  inner += '          <div class="form-group"><textarea placeholder="Your Message" rows="4" required></textarea></div>\n';
  if (ctaHtml) inner += '          <div class="form-group">' + ctaHtml + '</div>\n';
  inner += '        </form>\n';
  return sectionHtml(inner, content, 'section-contact');
}

function footerComponent(content) {
  var body = esc(content.body || '');
  var inner = '        <div class="footer-content">\n';
  inner += '          <p class="footer-text">' + body + '</p>\n';
  inner += '        </div>\n';
  return sectionHtml(inner, content, 'section-footer');
}

function storyComponent(content) { return textSection('story', content); }
function missionComponent(content) { return textSection('mission', content); }
function teamComponent(content) { return textSection('team', content); }
function valuesComponent(content) { return textSection('values', content); }
function overviewComponent(content) { return textSection('overview', content); }
function benefitsComponent(content) { return textSection('benefits', content); }
function processComponent(content) { return textSection('process', content); }
function descriptionComponent(content) { return textSection('description', content); }
function contentOnlyComponent(content) { return textSection('content', content); }
function infoComponent(content) { return textSection('info', content); }
function listComponent(content) { return textSection('list', content); }
function featuresComponent(content) { return textSection('features', content); }

function textSection(cls, content) {
  var h = esc(content.heading || '');
  var body = esc(content.body || '');
  var inner = '        <div class="' + cls + '-content">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (body) inner += '          <p class="' + cls + '-body">' + body + '</p>\n';
  inner += '        </div>\n';
  return sectionHtml(inner, content, 'section-' + cls);
}

function ctaComponent(content) {
  var h = esc(content.heading || '');
  var body = esc(content.body || '');
  var cta = esc(content.cta || '');
  var ctaHtml = cta ? '<a href="/contact" class="btn btn-primary btn-lg">' + cta + '</a>' : '';
  var inner = '        <div class="cta-content">\n';
  if (h) inner += '          <h2 class="cta-title">' + h + '</h2>\n';
  if (body) inner += '          <p class="cta-body">' + body + '</p>\n';
  if (ctaHtml) inner += '          <div class="cta-actions">' + ctaHtml + '</div>\n';
  inner += '        </div>\n';
  return sectionHtml(inner, content, 'section-cta');
}

function blogComponent(content) {
  var h = esc(content.heading || '');
  var sub = esc(content.subheading || '');
  var body = esc(content.body || '');
  var inner = '        <div class="blog-header">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (sub) inner += '          <p class="section-subtitle">' + sub + '</p>\n';
  if (body) inner += '          <p class="blog-body">' + body + '</p>\n';
  inner += '        </div>\n';
  return sectionHtml(inner, content, 'section-blog');
}

function faqComponent(content) {
  var h = esc(content.heading || '');
  var sub = esc(content.subheading || '');
  var inner = '        <div class="faq-header">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (sub) inner += '          <p class="section-subtitle">' + sub + '</p>\n';
  inner += '        </div>\n';
  inner += '        <div class="faq-list">\n';
  inner += '          <details class="faq-item"><summary>Question 1</summary><p>Sample answer.</p></details>\n';
  inner += '          <details class="faq-item"><summary>Question 2</summary><p>Sample answer.</p></details>\n';
  inner += '          <details class="faq-item"><summary>Question 3</summary><p>Sample answer.</p></details>\n';
  inner += '        </div>\n';
  return sectionHtml(inner, content, 'section-faq');
}

function bookingComponent(content) {
  var h = esc(content.heading || '');
  var sub = esc(content.subheading || '');
  var body = esc(content.body || '');
  var inner = '        <div class="booking-content">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (sub) inner += '          <p class="section-subtitle">' + sub + '</p>\n';
  if (body) inner += '          <p class="booking-body">' + body + '</p>\n';
  inner += '        </div>\n';
  inner += '        <div class="booking-widget"><p>Calendar widget placeholder</p></div>\n';
  return sectionHtml(inner, content, 'section-booking');
}

function formComponent(content) {
  var h = esc(content.heading || '');
  var inner = '        <div class="form-content">\n';
  if (h) inner += '          <h3 class="form-title">' + h + '</h3>\n';
  inner += '          <div class="form-group"><input type="text" placeholder="Your Name" required></div>\n';
  inner += '          <div class="form-group"><input type="email" placeholder="Email" required></div>\n';
  inner += '          <div class="form-group"><textarea placeholder="Message" rows="3"></textarea></div>\n';
  inner += '          <div class="form-group"><button type="submit" class="btn btn-primary">Send</button></div>\n';
  inner += '        </div>\n';
  return sectionHtml(inner, content, 'section-form');
}

function pricingComponent(content) {
  var h = esc(content.heading || '');
  var sub = esc(content.subheading || '');
  var inner = '        <div class="pricing-header">\n';
  if (h) inner += '          <h2 class="section-title">' + h + '</h2>\n';
  if (sub) inner += '          <p class="section-subtitle">' + sub + '</p>\n';
  inner += '        </div>\n';
  inner += '        <div class="pricing-grid">\n';
  inner += '          <div class="pricing-card"><h3>Basic</h3><p class="price">$--</p><ul><li>Feature 1</li><li>Feature 2</li></ul></div>\n';
  inner += '          <div class="pricing-card featured"><h3>Pro</h3><p class="price">$--</p><ul><li>Feature 1</li><li>Feature 2</li><li>Feature 3</li></ul></div>\n';
  inner += '          <div class="pricing-card"><h3>Enterprise</h3><p class="price">$--</p><ul><li>Feature 1</li><li>Feature 2</li><li>Feature 3</li></ul></div>\n';
  inner += '        </div>\n';
  return sectionHtml(inner, content, 'section-pricing');
}

function fallbackComponent(content) {
  return simpleSection(content.id || 'section', content);
}

function simpleSection(label, content) {
  var h = esc(content.heading || label);
  var inner = '        <div class="' + content.id + '-placeholder">\n';
  inner += '          <h2 class="section-title">' + h + '</h2>\n';
  inner += '          <div class="placeholder-block"><p>Content area for ' + esc(content.id) + '</p></div>\n';
  inner += '        </div>\n';
  return sectionHtml(inner, content, 'section-' + content.id);
}

function gridComponent(content) { return simpleSection('Grid', content); }
function galleryComponent(content) { return simpleSection('Gallery', content); }
function plansComponent(content) { return simpleSection('Plans', content); }
function comparisonComponent(content) { return simpleSection('Compare', content); }
function categoriesComponent(content) { return simpleSection('Categories', content); }
function itemsComponent(content) { return simpleSection('Items', content); }
function checkoutComponent(content) { return simpleSection('Checkout', content); }
function paymentComponent(content) { return simpleSection('Payment', content); }
function summaryComponent(content) { return simpleSection('Summary', content); }
function profileComponent(content) { return simpleSection('Profile', content); }
function ordersComponent(content) { return simpleSection('Orders', content); }
function settingsComponent(content) { return simpleSection('Settings', content); }
function shareComponent(content) { return simpleSection('Share', content); }
function relatedComponent(content) { return simpleSection('Related', content); }
function testimonialComponent(content) { return simpleSection('Testimonial', content); }
function featuredComponent(content) { return simpleSection('Featured', content); }
function filterComponent(content) { return simpleSection('Filter', content); }
function mapComponent(content) { return simpleSection('Map', content); }
function searchComponent(content) { return simpleSection('Search', content); }
function calendarComponent(content) { return simpleSection('Calendar', content); }
function confirmationComponent(content) { return simpleSection('Confirmation', content); }

function esc(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = { mapSection };
