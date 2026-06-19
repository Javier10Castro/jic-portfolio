function generateCss(designStrategy) {
  var tokens = buildDesignTokens(designStrategy);
  var css = '';

  css += '/* === DESIGN TOKENS === */\n';
  css += ':root {\n';
  for (var key in tokens) {
    if (tokens.hasOwnProperty(key)) {
      css += '  --' + key + ': ' + tokens[key] + ';\n';
    }
  }
  css += '}\n\n';

  css += '/* === RESET === */\n';
  css += '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}\n';
  css += 'html{scroll-behavior:' + (tokens['scroll-behavior'] || 'smooth') + '}\n';
  css += 'body{font-family:var(--font-body);color:var(--text);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}\n';
  css += 'img{max-width:100%;display:block}\n';
  css += 'a{color:var(--accent);text-decoration:none}\n';
  css += 'a:hover{color:var(--accent-hover)}\n';
  css += 'ul,ol{list-style:none}\n\n';

  css += '/* === TYPOGRAPHY === */\n';
  css += 'h1,h2,h3,h4,h5,h6{font-family:var(--font-heading);font-weight:700;line-height:1.2;color:var(--heading)}\n';
  css += 'h1{font-size:var(--h1);margin-bottom:var(--space-md)}\n';
  css += 'h2{font-size:var(--h2);margin-bottom:var(--space-sm)}\n';
  css += 'h3{font-size:var(--h3);margin-bottom:var(--space-xs)}\n';
  css += 'p{margin-bottom:var(--space-sm)}\n';
  css += '.section-title{text-align:center;margin-bottom:var(--space-xs)}\n';
  css += '.section-subtitle{text-align:center;color:var(--muted);font-size:var(--h3);margin-bottom:var(--space-md);font-weight:400}\n\n';

  css += '/* === LAYOUT === */\n';
  css += '.container-full{max-width:100%;padding:0}\n';
  css += '.container-wide{max-width:1280px;margin:0 auto;padding:0 var(--space-md)}\n';
  css += '.container-contained{max-width:1100px;margin:0 auto;padding:0 var(--space-md)}\n';
  css += '.container-narrow{max-width:800px;margin:0 auto;padding:0 var(--space-md)}\n';
  css += '.main-content{padding-top:var(--header-height);min-height:60vh}\n\n';

  css += '/* === HEADER / NAV === */\n';
  css += '.site-header{position:fixed;top:0;left:0;right:0;z-index:100;background:var(--bg);border-bottom:1px solid var(--border);height:var(--header-height)}\n';
  css += '.header-inner{display:flex;align-items:center;justify-content:space-between;height:100%}\n';
  css += '.logo{font-family:var(--font-heading);font-size:1.25rem;font-weight:700;color:var(--heading)}\n';
  css += '.nav-list{display:flex;gap:var(--space-sm)}\n';
  css += '.nav-list a{padding:0.5rem 1rem;border-radius:var(--radius);font-size:0.9rem;color:var(--text);transition:background var(--transition-speed)}\n';
  css += '.nav-list a:hover{background:var(--surface-hover)}\n';
  css += '.nav-list a.active{background:var(--accent);color:var(--bg)}\n\n';

  css += '/* === HERO === */\n';
  css += '.section-hero{padding:calc(var(--header-height) + var(--space-xl)) 0 var(--space-xl);text-align:center;background:var(--hero-bg);min-height:60vh;display:flex;align-items:center;justify-content:center}\n';
  css += '.hero-content{max-width:800px;margin:0 auto}\n';
  css += '.hero-title{font-size:var(--hero-size);line-height:1.1;margin-bottom:var(--space-sm)}\n';
  css += '.hero-subtitle{font-size:var(--h3);color:var(--muted);margin-bottom:var(--space-md)}\n';
  css += '.hero-body{font-size:1.1rem;color:var(--text);margin-bottom:var(--space-lg)}\n';
  css += '.hero-actions{display:flex;gap:var(--space-sm);justify-content:center}\n\n';

  css += '/* === BUTTONS === */\n';
  css += '.btn{display:inline-block;padding:0.75rem 2rem;border-radius:var(--radius);font-weight:600;font-size:0.95rem;cursor:pointer;transition:all var(--transition-speed);border:none;text-align:center}\n';
  css += '.btn-primary{background:var(--accent);color:var(--bg)}\n';
  css += '.btn-primary:hover{background:var(--accent-hover);transform:translateY(-1px);box-shadow:var(--shadow)}\n';
  css += '.btn-secondary{background:transparent;color:var(--accent);border:2px solid var(--accent)}\n';
  css += '.btn-secondary:hover{background:var(--accent);color:var(--bg)}\n';
  css += '.btn-lg{padding:1rem 2.5rem;font-size:1.05rem}\n\n';

  css += '/* === SECTIONS === */\n';
  css += 'section{padding:var(--space-xl) 0}\n';
  css += 'section:nth-child(even){background:var(--surface)}\n';
  css += 'section:nth-child(odd){background:var(--bg)}\n\n';

  css += '/* === ABOUT === */\n';
  css += '.section-about .about-content{max-width:800px;margin:0 auto;text-align:center}\n';
  css += '.about-body{font-size:1.05rem;line-height:1.8}\n';
  css += '.about-actions{margin-top:var(--space-md)}\n\n';

  css += '/* === SERVICES GRID === */\n';
  css += '.services-grid,.portfolio-grid,.products-grid,.pricing-grid,.testimonials-grid{display:grid;gap:var(--space-md);margin-top:var(--space-md)}\n';
  css += '.services-grid,.portfolio-grid,.products-grid{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}\n';
  css += '.pricing-grid{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}\n';
  css += '.testimonials-grid{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}\n\n';

  css += '/* === CARDS === */\n';
  css += '.service-card,.portfolio-card,.product-card,.pricing-card,.testimonial-card{padding:var(--space-md);border-radius:var(--radius);background:var(--bg);border:1px solid var(--border);transition:transform var(--transition-speed),box-shadow var(--transition-speed)}\n';
  css += '.service-card:hover,.portfolio-card:hover,.product-card:hover,.pricing-card:hover,.testimonial-card:hover{transform:translateY(-2px);box-shadow:var(--shadow)}\n';
  css += '.service-icon{font-size:2rem;margin-bottom:var(--space-xs)}\n';
  css += '.portfolio-thumb,.product-thumb{width:100%;height:200px;background:var(--surface);border-radius:var(--radius-sm);margin-bottom:var(--space-xs)}\n';
  css += '.product-price{font-weight:600;color:var(--accent)}\n';
  css += '.pricing-card.featured{border-color:var(--accent);box-shadow:var(--shadow)}\n';
  css += '.pricing-card h3{text-align:center}\n';
  css += '.price{font-size:2rem;font-weight:700;text-align:center;color:var(--heading);margin:var(--space-sm) 0}\n';
  css += '.pricing-card ul{padding:0}\n';
  css += '.pricing-card li{padding:0.5rem 0;border-bottom:1px solid var(--border);text-align:center}\n';
  css += '.pricing-card li:last-child{border:none}\n\n';

  css += '/* === TESTIMONIALS === */\n';
  css += '.testimonial-card{font-style:italic}\n';
  css += '.testimonial-card cite{display:block;margin-top:var(--space-xs);font-style:normal;font-weight:600;color:var(--heading)}\n\n';

  css += '/* === CONTACT === */\n';
  css += '.section-contact .contact-content{text-align:center;margin-bottom:var(--space-md)}\n';
  css += '.contact-form{max-width:600px;margin:0 auto}\n';
  css += '.form-group{margin-bottom:var(--space-sm)}\n';
  css += '.form-group input,.form-group textarea{width:100%;padding:0.75rem 1rem;border:1px solid var(--border);border-radius:var(--radius);font-family:var(--font-body);font-size:1rem;background:var(--bg);color:var(--text);transition:border-color var(--transition-speed)}\n';
  css += '.form-group input:focus,.form-group textarea:focus{outline:none;border-color:var(--accent)}\n\n';

  css += '/* === CTA === */\n';
  css += '.section-cta{text-align:center;background:var(--accent);color:var(--bg)}\n';
  css += '.section-cta .cta-title{color:var(--bg)}\n';
  css += '.section-cta .cta-body{color:var(--bg);opacity:0.9}\n';
  css += '.section-cta .btn-primary{background:var(--bg);color:var(--accent)}\n';
  css += '.section-cta .btn-primary:hover{background:var(--surface)}\n\n';

  css += '/* === FAQ === */\n';
  css += '.faq-list{max-width:700px;margin:0 auto}\n';
  css += '.faq-item{border:1px solid var(--border);border-radius:var(--radius);margin-bottom:var(--space-xs);overflow:hidden}\n';
  css += '.faq-item summary{padding:var(--space-sm) var(--space-md);cursor:pointer;font-weight:600;background:var(--surface)}\n';
  css += '.faq-item p{padding:var(--space-sm) var(--space-md)}\n\n';

  css += '/* === FOOTER === */\n';
  css += '.site-footer{border-top:1px solid var(--border);padding:var(--space-lg) 0;margin-top:var(--space-xl);background:var(--surface)}\n';
  css += '.footer-text{text-align:center;color:var(--muted);font-size:0.9rem}\n\n';

  css += '/* === SIDEBAR === */\n';
  css += '.content-with-sidebar{display:grid;grid-template-columns:1fr 280px;gap:var(--space-lg);align-items:start}\n';
  css += '.sidebar{border-left:1px solid var(--border);padding-left:var(--space-md)}\n';
  css += '.sidebar-inner{position:sticky;top:calc(var(--header-height) + var(--space-md))}\n';
  css += '.sidebar h3{margin-bottom:var(--space-sm)}\n';
  css += '.sidebar-links li{margin-bottom:var(--space-xs)}\n';
  css += '.sidebar-links a{color:var(--text);font-size:0.9rem}\n';
  css += '.sidebar-links a:hover{color:var(--accent)}\n\n';

  css += '/* === ANIMATIONS */\n';
  var animSpeed = tokens['transition-speed'] || '0.2s';
  var scrollBehavior = tokens['scroll-behavior'] || 'smooth';
  css += '.btn,.service-card,.portfolio-card,.product-card,.pricing-card,.testimonial-card,.nav-list a{transition:all ' + animSpeed + '}\n';

  if (tokens['hover-style'] === 'scale_highlight') {
    css += '.service-card:hover,.portfolio-card:hover,.product-card:hover{transform:scale(1.02)}\n';
  }
  if (tokens['page-transition'] === 'fade') {
    css += 'body{animation:fadeIn ' + animSpeed + '}\n';
    css += '@keyframes fadeIn{from{opacity:0}to{opacity:1}}\n';
  }
  if (tokens['hover-style'] === 'lift_shadow') {
    css += '.service-card:hover,.portfolio-card:hover{transform:translateY(-4px);box-shadow:0 12px 24px rgba(0,0,0,0.12)}\n';
  }
  if (tokens['hover-style'] === 'color_shift') {
    css += '.service-card:hover,.portfolio-card:hover{border-color:var(--accent)}\n';
  }

  css += '\n/* === RESPONSIVE === */\n';
  css += '@media(max-width:768px){\n';
  css += ':root{--h1:2rem;--h2:1.5rem;--h3:1.15rem;--hero-size:2.25rem;--space-xl:3rem;--space-lg:2rem}\n';
  css += '.content-with-sidebar{grid-template-columns:1fr}\n';
  css += '.sidebar{border-left:none;padding-left:0;border-top:1px solid var(--border);padding-top:var(--space-md);margin-top:var(--space-md)}\n';
  css += '.services-grid,.portfolio-grid,.products-grid,.pricing-grid,.testimonials-grid{grid-template-columns:1fr}\n';
  css += '.nav-list{gap:0}\n';
  css += '.nav-list a{padding:0.5rem 0.6rem;font-size:0.8rem}\n';
  css += '}\n\n';

  css += '@media(max-width:480px){\n';
  css += ':root{--h1:1.75rem;--h2:1.35rem;--hero-size:1.85rem}\n';
  css += '.hero-actions{flex-direction:column;align-items:center}\n';
  css += '}\n';

  return css;
}

function buildDesignTokens(designStrategy) {
  var visual = designStrategy.visual || {};
  var layout = designStrategy.layout || {};
  var interaction = designStrategy.interaction || {};
  var brand = designStrategy.brand || {};

  var palette = derivePalette(brand.brandTone, visual.visualPersonality);
  var typography = deriveTypography(visual.designStyle);
  var spacing = deriveSpacing(layout.spacing);

  return {
    // Colors
    'accent': palette.accent,
    'accent-hover': palette.accentHover,
    'bg': palette.bg,
    'surface': palette.surface,
    'surface-hover': palette.surfaceHover,
    'text': palette.text,
    'heading': palette.heading,
    'muted': palette.muted,
    'border': palette.border,
    'hero-bg': palette.heroBg,

    // Typography
    'font-body': typography.body,
    'font-heading': typography.heading,
    'h1': typography.h1,
    'h2': typography.h2,
    'h3': typography.h3,
    'hero-size': typography.heroSize,

    // Spacing
    'space-xs': spacing.xs,
    'space-sm': spacing.sm,
    'space-md': spacing.md,
    'space-lg': spacing.lg,
    'space-xl': spacing.xl,

    // Sizing
    'radius': '8px',
    'radius-sm': '4px',
    'header-height': '64px',

    // Interactions
    'transition-speed': deriveTransitionSpeed(interaction.transitionType),
    'scroll-behavior': deriveScrollBehavior(interaction.scrollBehavior),
    'hover-style': interaction.hoverStyle || 'scale_highlight',
    'page-transition': interaction.pageTransition || 'fade',

    // Shadow
    'shadow': '0 4px 12px rgba(0,0,0,0.08)',
  };
}

function derivePalette(brandTone, visualPersonality) {
  var palettes = {
    persuasive_professional: { accent:'#2b6cb0', accentHover:'#1a56a0', bg:'#ffffff', surface:'#f7fafc', surfaceHover:'#edf2f7', text:'#2d3748', heading:'#1a202c', muted:'#718096', border:'#e2e8f0', heroBg:'linear-gradient(135deg,#1a365d 0%,#2b6cb0 100%)' },
    creative_aspirational: { accent:'#d53f8c', accentHover:'#b83280', bg:'#ffffff', surface:'#faf5ff', surfaceHover:'#f3e8ff', text:'#2d3748', heading:'#1a202c', muted:'#805ad5', border:'#e9d8fd', heroBg:'linear-gradient(135deg,#44337a 0%,#d53f8c 100%)' },
    authoritative_approachable: { accent:'#319795', accentHover:'#2c7a7b', bg:'#ffffff', surface:'#e6fffa', surfaceHover:'#b2f5ea', text:'#2d3748', heading:'#1a202c', muted:'#4a5568', border:'#e6fffa', heroBg:'linear-gradient(135deg,#234e52 0%,#319795 100%)' },
    friendly_inviting: { accent:'#dd6b20', accentHover:'#c05621', bg:'#ffffff', surface:'#fffaf0', surfaceHover:'#feebc8', text:'#2d3748', heading:'#1a202c', muted:'#a0aec0', border:'#feebc8', heroBg:'linear-gradient(135deg,#c05621 0%,#dd6b20 100%)' },
    polished_professional: { accent:'#2b6cb0', accentHover:'#1a56a0', bg:'#ffffff', surface:'#f7fafc', surfaceHover:'#edf2f7', text:'#2d3748', heading:'#1a202c', muted:'#718096', border:'#e2e8f0', heroBg:'linear-gradient(135deg,#1a365d 0%,#2b6cb0 100%)' },
    modern_trustworthy: { accent:'#3182ce', accentHover:'#2b6cb0', bg:'#ffffff', surface:'#ebf8ff', surfaceHover:'#bee3f8', text:'#2d3748', heading:'#1a202c', muted:'#63b3ed', border:'#bee3f8', heroBg:'linear-gradient(135deg,#2c5282 0%,#3182ce 100%)' },
    professional_warm: { accent:'#d69e2e', accentHover:'#b7791f', bg:'#ffffff', surface:'#fffff0', surfaceHover:'#fefcbf', text:'#2d3748', heading:'#1a202c', muted:'#975a16', border:'#fefcbf', heroBg:'linear-gradient(135deg,#744210 0%,#d69e2e 100%)' },
    creative_showcase: { accent:'#ed64a6', accentHover:'#d53f8c', bg:'#ffffff', surface:'#fff5f7', surfaceHover:'#fed7e2', text:'#2d3748', heading:'#1a202c', muted:'#805ad5', border:'#fed7e2', heroBg:'linear-gradient(135deg,#322659 0%,#ed64a6 100%)' },
    friendly_approachable: { accent:'#38a169', accentHover:'#2f855a', bg:'#ffffff', surface:'#f0fff4', surfaceHover:'#c6f6d5', text:'#2d3748', heading:'#1a202c', muted:'#68d391', border:'#c6f6d5', heroBg:'linear-gradient(135deg,#22543d 0%,#38a169 100%)' },
  };

  var p = palettes[brandTone];
  if (p) return p;

  // Fallback: try visualPersonality
  p = palettes[visualPersonality];
  if (p) return p;

  // Default
  return palettes.polished_professional;
}

function deriveTypography(designStyle) {
  var map = {
    editorial_flow: { body:"'Inter',system-ui,sans-serif", heading:"'Playfair Display',Georgia,serif", h1:'3rem', h2:'2rem', h3:'1.25rem', heroSize:'3.75rem' },
    expressive_editorial: { body:"'Inter',system-ui,sans-serif", heading:"'Playfair Display',Georgia,serif", h1:'3rem', h2:'2rem', h3:'1.25rem', heroSize:'3.75rem' },
    corporate_refined: { body:"'Inter',system-ui,sans-serif", heading:"'Inter',system-ui,sans-serif", h1:'2.5rem', h2:'1.75rem', h3:'1.15rem', heroSize:'3rem' },
    minimal_retail: { body:"'Inter',system-ui,sans-serif", heading:"'Inter',system-ui,sans-serif", h1:'2.75rem', h2:'1.9rem', h3:'1.2rem', heroSize:'3.25rem' },
    modern_minimal: { body:"'Inter',system-ui,sans-serif", heading:"'Inter',system-ui,sans-serif", h1:'2.5rem', h2:'1.75rem', h3:'1.15rem', heroSize:'3rem' },
    clean_commercial: { body:"'Inter',system-ui,sans-serif", heading:"'Inter',system-ui,sans-serif", h1:'2.75rem', h2:'1.9rem', h3:'1.2rem', heroSize:'3.25rem' },
  };
  var t = map[designStyle];
  if (t) return t;
  return map.modern_minimal;
}

function deriveSpacing(spacing) {
  var map = {
    compact: { xs:'0.5rem', sm:'1rem', md:'2rem', lg:'3rem', xl:'5rem' },
    balanced: { xs:'0.75rem', sm:'1.5rem', md:'3rem', lg:'4rem', xl:'6rem' },
    generous: { xs:'1rem', sm:'2rem', md:'4rem', lg:'6rem', xl:'8rem' },
  };
  var s = map[spacing];
  if (s) return s;
  return map.balanced;
}

function deriveTransitionSpeed(transitionType) {
  var map = { quick_ease:'0.15s', standard_ease:'0.2s', slow_graceful:'0.35s', bouncy_quick:'0.12s' };
  return map[transitionType] || '0.2s';
}

function deriveScrollBehavior(scrollBehavior) {
  return scrollBehavior === 'parallax' ? 'smooth' : (scrollBehavior || 'smooth');
}

module.exports = { generateCss };
