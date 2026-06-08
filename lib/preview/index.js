const PAGE_SECTION_MAP = [
  { keywords: ['inicio', 'home', 'index', 'portada', 'start'], section: 'hero' },
  { keywords: ['quienes', 'about', 'nosotros', 'historia', 'empresa'], section: 'about' },
  { keywords: ['servicios', 'services', 'productos', 'products', 'soluciones', 'menu', 'menú'], section: 'features' },
  { keywords: ['portafolio', 'portfolio', 'proyectos', 'projects', 'casos', 'work', 'gallery', 'galería', 'galeria'], section: 'gallery' },
  { keywords: ['contacto', 'contact', 'cotizar', 'quote'], section: 'contact' },
  { keywords: ['blog', 'noticias', 'news', 'recursos', 'resources'], section: 'blog' },
  { keywords: ['testimonios', 'testimonials', 'clientes', 'clients'], section: 'testimonials' },
  { keywords: ['faq', 'preguntas', 'faqs'], section: 'faq' },
];

function classifyPage(page) {
  const lower = page.toLowerCase();
  for (const entry of PAGE_SECTION_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry.section;
  }
  return 'content';
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateLayout(projectPlan, designSystem) {
  const identity = (projectPlan.project || {}).identity || {};
  const structure = (projectPlan.project || {}).structure || {};
  const pages = structure.pages || [];
  const businessName = identity.business_name || identity.main_goal || 'My Project';
  const tagline = identity.tagline || null;
  const story = identity.story || null;
  const pageSections = pages.map(p => classifyPage(p));
  const hasContact = pageSections.includes('contact');

  const sortedSections = [];
  const priority = ['hero', 'about', 'features', 'gallery', 'testimonials', 'blog', 'faq', 'contact', 'content'];

  for (const type of priority) {
    if (type === 'hero' || pageSections.includes(type)) {
      sortedSections.push(type);
    }
  }

  if (!sortedSections.includes('hero')) sortedSections.unshift('hero');

  const header = {
    brand: businessName,
    links: pages.slice(0, 4).map(p => ({ label: p, href: '#' })),
  };

  const hero = {
    title: businessName,
    subtitle: tagline || identity.mission || identity.main_goal || 'Built with Agent Pack v1',
    cta: structure.main_conversion || 'Get Started',
  };

  const sections = sortedSections.map(type => buildSection(type, identity, structure, designSystem));

  return { header, hero, sections, totalPages: pages.length, hasContact };
}

function buildSection(type, identity, structure, ds) {
  const base = {
    type,
    title: sectionTitle(type, identity),
    subtitle: sectionSubtitle(type, identity),
  };

  switch (type) {
    case 'hero':
      return {
        ...base,
        type: 'hero',
        content: identity.story || identity.mission || identity.main_goal || '',
        items: [],
      };
    case 'about':
      return {
        ...base,
        content: identity.story || identity.mission || identity.vision || 'About section content.',
        items: (identity.values || []).slice(0, 4).map(v => ({ label: v })),
      };
    case 'features':
      return {
        ...base,
        content: (identity.personality || []).slice(0, 3).join(', ') || 'Core services and solutions.',
        items: [
          { label: 'Service 01', desc: 'Tailored to your business needs.' },
          { label: 'Service 02', desc: 'Built with modern best practices.' },
          { label: 'Service 03', desc: 'Focused on measurable results.' },
        ],
      };
    case 'gallery':
      return {
        ...base,
        content: 'Showcasing selected work and projects.',
        items: [
          { label: 'Project Alpha', desc: 'Brand identity & web presence' },
          { label: 'Project Beta', desc: 'E-commerce platform' },
          { label: 'Project Gamma', desc: 'SaaS dashboard' },
        ],
      };
    case 'contact':
      return {
        ...base,
        content: 'Get in touch to start your project.',
        items: [
          { label: 'Name', type: 'input' },
          { label: 'Email', type: 'input' },
          { label: 'Message', type: 'textarea' },
        ],
      };
    case 'testimonials':
      return {
        ...base,
        content: 'What clients say.',
        items: [
          { label: 'Client A', desc: 'Exceptional quality and service.' },
          { label: 'Client B', desc: 'Transformed our online presence.' },
        ],
      };
    case 'blog':
      return {
        ...base,
        content: 'Latest insights and articles.',
        items: [
          { label: 'Article Title 01' },
          { label: 'Article Title 02' },
        ],
      };
    case 'faq':
      return {
        ...base,
        content: 'Frequently asked questions.',
        items: [
          { label: 'Question 01', desc: 'Answer to the first question.' },
          { label: 'Question 02', desc: 'Answer to the second question.' },
        ],
      };
    default:
      return {
        ...base,
        content: 'Content section.',
        items: [],
      };
  }
}

function sectionTitle(type, identity) {
  const titles = {
    hero: identity.business_name || 'Welcome',
    about: identity.mission || 'About Us',
    features: 'Services',
    gallery: 'Portfolio',
    contact: 'Contact',
    testimonials: 'Testimonials',
    blog: 'Blog',
    faq: 'FAQ',
  };
  return titles[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function sectionSubtitle(type, identity) {
  const subtitles = {
    about: identity.tagline || identity.vision || 'Our story',
    features: 'What we offer',
    gallery: 'Recent work',
    contact: 'Let\'s talk',
    testimonials: 'Client feedback',
    blog: 'Latest posts',
    faq: 'Common questions',
  };
  return subtitles[type] || null;
}

function generateHtmlPreview(layout, designSystem) {
  const sem = designSystem.tokens.semantic;
  const primary = designSystem.tokens.colors.primary || sem.primary;
  const businessName = layout.header.brand;

  const navLinks = layout.header.links.map(l =>
    `<a href="#">${escapeHtml(l.label)}</a>`
  ).join('');

  const sections = layout.sections.filter(s => s.type !== 'hero').map(s => {
    switch (s.type) {
      case 'about':
        return `<section class="preview-section about-section">
          <div class="preview-container">
            <h2>${escapeHtml(s.title)}</h2>
            ${s.subtitle ? `<p class="preview-sub">${escapeHtml(s.subtitle)}</p>` : ''}
            <p class="preview-text">${escapeHtml(s.content)}</p>
            ${s.items.length ? `<div class="preview-tag-list">${s.items.map(i => `<span class="preview-tag">${escapeHtml(i.label)}</span>`).join('')}</div>` : ''}
          </div>
        </section>`;
      case 'features':
        return `<section class="preview-section features-section">
          <div class="preview-container">
            <h2>${escapeHtml(s.title)}</h2>
            ${s.subtitle ? `<p class="preview-sub">${escapeHtml(s.subtitle)}</p>` : ''}
            <div class="preview-grid">${s.items.map(i => `
              <div class="preview-card">
                <h3>${escapeHtml(i.label)}</h3>
                <p>${escapeHtml(i.desc)}</p>
              </div>`).join('')}
            </div>
          </div>
        </section>`;
      case 'gallery':
        return `<section class="preview-section gallery-section">
          <div class="preview-container">
            <h2>${escapeHtml(s.title)}</h2>
            ${s.subtitle ? `<p class="preview-sub">${escapeHtml(s.subtitle)}</p>` : ''}
            <div class="preview-grid">${s.items.map(i => `
              <div class="preview-card preview-card-img">
                <div class="preview-img-placeholder"></div>
                <h3>${escapeHtml(i.label)}</h3>
                ${i.desc ? `<p>${escapeHtml(i.desc)}</p>` : ''}
              </div>`).join('')}
            </div>
          </div>
        </section>`;
      case 'contact':
        return `<section class="preview-section contact-section">
          <div class="preview-container">
            <h2>${escapeHtml(s.title)}</h2>
            ${s.subtitle ? `<p class="preview-sub">${escapeHtml(s.subtitle)}</p>` : ''}
            <div class="preview-form">${s.items.map(i => `
              <div class="preview-field">
                <label>${escapeHtml(i.label)}</label>
                ${i.type === 'textarea'
                  ? `<div class="preview-input preview-textarea"></div>`
                  : `<div class="preview-input"></div>`}
              </div>`).join('')}
              <div class="preview-btn">${layout.hero.cta}</div>
            </div>
          </div>
        </section>`;
      case 'testimonials':
        return `<section class="preview-section testimonials-section">
          <div class="preview-container">
            <h2>${escapeHtml(s.title)}</h2>
            ${s.subtitle ? `<p class="preview-sub">${escapeHtml(s.subtitle)}</p>` : ''}
            <div class="preview-grid">${s.items.map(i => `
              <div class="preview-card preview-card-testimonial">
                <p>"${escapeHtml(i.desc)}"</p>
                <h4>— ${escapeHtml(i.label)}</h4>
              </div>`).join('')}
            </div>
          </div>
        </section>`;
      case 'faq':
        return `<section class="preview-section faq-section">
          <div class="preview-container">
            <h2>${escapeHtml(s.title)}</h2>
            ${s.subtitle ? `<p class="preview-sub">${escapeHtml(s.subtitle)}</p>` : ''}
            <div class="preview-faq-list">${s.items.map((i, idx) => `
              <details class="preview-faq-item"${idx === 0 ? ' open' : ''}>
                <summary>${escapeHtml(i.label)}</summary>
                <p>${escapeHtml(i.desc)}</p>
              </details>`).join('')}
            </div>
          </div>
        </section>`;
      default:
        return `<section class="preview-section">
          <div class="preview-container">
            <h2>${escapeHtml(s.title)}</h2>
            ${s.subtitle ? `<p class="preview-sub">${escapeHtml(s.subtitle)}</p>` : ''}
            <p class="preview-text">${escapeHtml(s.content)}</p>
          </div>
        </section>`;
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preview — ${escapeHtml(businessName)}</title>
<link rel="stylesheet" href="assets/css/style.css">
<style>
  .preview-section{padding:4rem 2rem}
  .preview-section:nth-child(even){background:var(--color-surface)}
  .preview-container{max-width:1000px;margin:0 auto}
  .preview-sub{color:var(--color-text);opacity:.7;margin-bottom:1.5rem;font-size:1.1rem}
  .preview-text{line-height:1.8;opacity:.85;margin-bottom:1.5rem}
  .preview-tag-list{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem}
  .preview-tag{background:var(--color-primary);color:var(--color-text-on-primary);padding:.3rem .8rem;border-radius:20px;font-size:.8rem;font-weight:600}
  .preview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;margin-top:1.5rem}
  .preview-card{background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:1.5rem;transition:border-color .2s}
  .preview-card:hover{border-color:var(--color-primary)}
  .preview-card h3{color:var(--color-primary);margin-bottom:.5rem}
  .preview-card p{font-size:.9rem;opacity:.8;line-height:1.6}
  .preview-card-testimonial p{font-style:italic;opacity:.9}
  .preview-card-testimonial h4{color:var(--color-primary);margin-top:.75rem;font-size:.9rem}
  .preview-card-img .preview-img-placeholder{width:100%;height:140px;background:var(--color-border);border-radius:4px;margin-bottom:.75rem}
  .preview-form{max-width:480px;margin:1.5rem auto 0;display:flex;flex-direction:column;gap:1rem}
  .preview-field label{font-size:.85rem;font-weight:600;display:block;margin-bottom:.3rem;color:var(--color-text)}
  .preview-input{height:40px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px}
  .preview-textarea{height:100px}
  .preview-btn{display:inline-block;padding:.85rem 2rem;background:var(--color-primary);color:var(--color-text-on-primary);border-radius:6px;font-weight:700;font-size:.9rem;text-align:center;cursor:pointer;border:none;align-self:flex-start}
  .preview-btn:hover{background:var(--color-hover)}
  .preview-faq-list{max-width:640px;margin:1.5rem auto 0}
  .preview-faq-item{border:1px solid var(--color-border);border-radius:6px;margin-bottom:.5rem;overflow:hidden}
  .preview-faq-item summary{padding:1rem;cursor:pointer;font-weight:600;color:var(--color-primary);background:var(--color-surface)}
  .preview-faq-item p{padding:0 1rem 1rem;opacity:.8;line-height:1.6}
  @media(max-width:600px){.preview-section{padding:3rem 1.5rem}.preview-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<nav class="navbar">
  <div class="nav-brand">${escapeHtml(businessName)}</div>
  <div class="nav-links">${navLinks}</div>
</nav>
<section class="hero">
  <h1>${escapeHtml(layout.hero.title)}</h1>
  <p class="hero-sub">${escapeHtml(layout.hero.subtitle)}</p>
  <a href="#" class="btn">${escapeHtml(layout.hero.cta)}</a>
</section>
${sections}
<footer class="footer">
  <p>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)} — Preview from Visual Preview Engine v1</p>
</footer>
</body>
</html>`;
}

function generateCssPreview(designSystem) {
  const ds = designSystem;
  const m = ds.mapping;
  return `/* Preview Engine — Design System CSS */
@import url('theme.css');

*{margin:0;padding:0;box-sizing:border-box}
body{
  background:var(--color-bg);
  color:var(--color-text);
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  line-height:1.6;min-height:100vh
}
a{color:var(--color-primary);text-decoration:none;transition:color .2s}
a:hover{color:var(--color-hover)}

.navbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:1rem 2rem;background:var(--color-surface);
  border-bottom:1px solid var(--color-border);position:sticky;top:0;z-index:100
}
.nav-brand{font-weight:700;font-size:1.1rem;color:var(--color-primary)}
.nav-links{display:flex;gap:1.5rem}
.nav-links a{font-size:.9rem;font-weight:500;color:var(--color-text)}
.nav-links a:hover{color:var(--color-primary)}

.hero{
  text-align:center;padding:6rem 2rem 4rem;background:var(--color-surface)
}
.hero h1{font-size:clamp(2rem,5vw,3.5rem);color:var(--color-primary);margin-bottom:1rem;font-weight:800}
.hero-sub{font-size:1.1rem;color:var(--color-text);max-width:560px;margin:0 auto 2rem;opacity:.8}
.btn{
  display:inline-block;padding:.85rem 2rem;
  background:var(--color-primary);color:var(--color-text-on-primary);
  border-radius:6px;font-weight:700;font-size:.9rem;
  transition:all .25s;border:none;cursor:pointer;text-decoration:none
}
.btn:hover{background:var(--color-hover);transform:translateY(-2px)}

.footer{
  text-align:center;padding:2rem;border-top:1px solid var(--color-border);
  font-size:.85rem;color:var(--color-text);opacity:.6;margin-top:4rem
}

@media(max-width:600px){
  .navbar{flex-direction:column;gap:.75rem;padding:.75rem 1rem}
  .nav-links{flex-wrap:wrap;justify-content:center}
  .hero{padding:4rem 1.5rem 3rem}
}
`;
}

function generateWarnings(projectPlan, designSystem) {
  const warnings = [];
  const tokens = designSystem.tokens;
  const sem = tokens.semantic;
  const colors = tokens.colors;
  const identity = (projectPlan.project || {}).identity || {};
  const structure = (projectPlan.project || {}).structure || {};
  const pages = structure.pages || [];

  if (!colors.primary) {
    warnings.push({ severity: 'high', message: 'Missing primary color — UI will use fallback text color.' });
  }

  if (!sem.background || !sem.text) {
    warnings.push({ severity: 'high', message: 'Missing semantic background/text tokens.' });
  }

  if (sem.background && sem.text) {
    const cr = contrastRatio(sem.background, sem.text);
    if (cr < 3) {
      warnings.push({ severity: 'high', message: `Extremely low contrast between background and text (${cr.toFixed(1)}:1).` });
    } else if (cr < 4.5) {
      warnings.push({ severity: 'medium', message: `Low contrast between background and text (${cr.toFixed(1)}:1). Does not meet WCAG AA.` });
    }
  }

  if (sem.primary && sem.background) {
    const cr = contrastRatio(sem.primary, sem.background);
    if (cr < 2) {
      warnings.push({ severity: 'medium', message: `Primary color has very low contrast on background (${cr.toFixed(1)}:1).` });
    }
  }

  if (!pages.length) {
    warnings.push({ severity: 'medium', message: 'No pages defined in project plan — using default sections.' });
  }

  if (pages.length === 0) {
    warnings.push({ severity: 'low', message: 'Empty pages array — preview will show placeholder sections.' });
  }

  const palette = tokens.palette || [];
  if (palette.length > 6) {
    warnings.push({ severity: 'low', message: `Palette has ${palette.length} colors (recommended max: 6).` });
  }

  if (!identity.business_name && !identity.main_goal) {
    warnings.push({ severity: 'low', message: 'No business name or main goal defined — using fallback title.' });
  }

  if (!tokens.theme) {
    warnings.push({ severity: 'medium', message: 'Theme not detected — preview uses semantic defaults.' });
  }

  return warnings;
}

function contrastRatio(hex1, hex2) {
  function luminance(hex) {
    const h = hex.replace('#', '');
    const rgb = { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
    const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
  }
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generatePreview(projectPlan, designSystem) {
  if (!projectPlan || !designSystem) {
    throw new Error('projectPlan and designSystem are required');
  }

  const layout = generateLayout(projectPlan, designSystem);
  const htmlPreview = generateHtmlPreview(layout, designSystem);
  const cssPreview = generateCssPreview(designSystem);
  const warnings = generateWarnings(projectPlan, designSystem);

  return { layout, htmlPreview, cssPreview, warnings };
}

module.exports = { generatePreview };
