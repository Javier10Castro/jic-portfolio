function generateHtmlPage(pageContent, layoutConfig, designStrategy, allPagesHtml) {
  var navHtml = buildNav(layoutConfig.navItems, layoutConfig.navLabel);
  var footerHtml = buildFooter(pageContent);
  var seo = pageContent.seo || {};
  var lang = 'en';
  var pageTitle = seo.title || pageContent.title;
  var description = seo.description || '';

  var headMeta = '';
  headMeta += '    <meta charset="UTF-8">\n';
  headMeta += '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  headMeta += '    <meta name="description" content="' + escAttr(description) + '">\n';
  headMeta += '    <meta name="generator" content="JIC Website Generator">\n';
  headMeta += '    <title>' + escHtml(pageTitle) + '</title>\n';
  headMeta += '    <link rel="stylesheet" href="assets/styles.css">\n';
  headMeta += '    <link rel="preconnect" href="https://fonts.googleapis.com">\n';
  headMeta += '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n';

  var fonts = getFontLinks(designStrategy);
  if (fonts) headMeta += '    ' + fonts + '\n';

  var heroHtml = '';
  if (layoutConfig.showHero) {
    heroHtml = buildHeroSection(pageContent);
  }

  var contentHtml = buildContentSections(pageContent, layoutConfig);

  var sidebarHtml = '';
  if (layoutConfig.hasSidebar) {
    sidebarHtml = '    <aside class="sidebar">\n      <div class="sidebar-inner">\n        <h3>Quick Links</h3>\n        <ul class="sidebar-links">\n' +
      layoutConfig.navItems.map(function(item) {
        return '          <li><a href="' + escAttr(item.href) + '">' + escHtml(item.label) + '</a></li>\n';
      }).join('') +
      '        </ul>\n      </div>\n    </aside>\n';
  }

  var html = '<!DOCTYPE html>\n';
  html += '<html lang="' + lang + '">\n';
  html += '<head>\n';
  html += headMeta;
  html += '  </head>\n';
  html += '<body class="page-' + escAttr(pageContent.path.replace(/\//g, '-').replace(/^-/, '') || 'home') + '">\n';
  html += '\n';
  html += navHtml;
  html += '\n';
  html += '  <main class="main-content ' + layoutConfig.containerClass + ' ' + layoutConfig.templateClass + '">\n';
  if (heroHtml) html += heroHtml;
  if (layoutConfig.hasSidebar) html += '  <div class="content-with-sidebar">\n';
  if (contentHtml) html += contentHtml;
  if (sidebarHtml) html += sidebarHtml;
  if (layoutConfig.hasSidebar) html += '  </div>\n';
  html += '  </main>\n';
  html += '\n';
  html += footerHtml;
  html += '\n';
  html += '  <script src="assets/script.js"></script>\n';
  html += '</body>\n';
  html += '</html>\n';

  return html;
}

function buildNav(navItems, currentLabel) {
  var html = '  <header class="site-header">\n';
  html += '    <div class="header-inner container-contained">\n';
  html += '      <a href="index.html" class="logo">' + escHtml(currentLabel) + '</a>\n';
  html += '      <nav class="main-nav" aria-label="Main navigation">\n';
  html += '        <ul class="nav-list">\n';
  for (var i = 0; i < navItems.length; i++) {
    var item = navItems[i];
    var active = item.label === currentLabel ? ' class="active"' : '';
    html += '          <li><a href="' + escAttr(item.href) + '"' + active + '>' + escHtml(item.label) + '</a></li>\n';
  }
  html += '        </ul>\n';
  html += '      </nav>\n';
  html += '    </div>\n';
  html += '  </header>\n';
  return html;
}

function buildHeroSection(pageContent) {
  var heroSection = pageContent.sections.filter(function(s) { return s.id === 'hero'; })[0];
  if (!heroSection) return '';
  // Hero is already rendered as a section by componentMapper, so we don't duplicate
  return '';
}

function buildContentSections(pageContent, layoutConfig) {
  var html = '';
  var sections = pageContent.sections || [];

  // Filter sections based on layout config mode
  var filtered = filterSections(sections, layoutConfig.sectionsMode);

  for (var i = 0; i < filtered.length; i++) {
    var s = filtered[i];
    // Check if this section's component is already included (via componentMapper's HTML)
    // We use the section's rendered content stored in a renderedContent map
    if (pageContent.renderedSections && pageContent.renderedSections[s.id]) {
      html += pageContent.renderedSections[s.id] + '\n';
    }
  }
  return html;
}

function filterSections(sections, mode) {
  if (mode === 'all') return sections;
  if (mode === 'landing') return sections.filter(function(s) {
    return ['hero', 'features', 'testimonials', 'pricing', 'cta', 'contact'].indexOf(s.id) !== -1;
  });
  if (mode === 'contact_only') return sections.filter(function(s) { return s.id === 'contact' || s.id === 'form' || s.id === 'info'; });
  if (mode === 'services_only') return sections.filter(function(s) { return s.id === 'services' || s.id === 'overview' || s.id === 'list' || s.id === 'cta'; });
  if (mode === 'products_only') return sections.filter(function(s) { return s.id === 'products' || s.id === 'categories' || s.id === 'items' || s.id === 'featured'; });
  if (mode === 'portfolio_only') return sections.filter(function(s) { return s.id === 'portfolio' || s.id === 'grid' || s.id === 'filter' || s.id === 'featured'; });
  if (mode === 'story_mission') return sections;
  if (mode === 'content_only') return sections.filter(function(s) { return s.id === 'content' || s.id === 'overview'; });
  if (mode === 'feature_only') return sections.filter(function(s) { return s.id === 'booking' || s.id === 'calendar' || s.id === 'confirmation' || s.id === 'form'; });
  return sections;
}

function buildFooter(pageContent) {
  var footerSection = pageContent.sections.filter(function(s) { return s.id === 'footer'; })[0];
  var text = footerSection && footerSection.body ? footerSection.body : 'All rights reserved.';
  var html = '  <footer class="site-footer">\n';
  html += '    <div class="footer-inner container-contained">\n';
  html += '      <p class="footer-text">' + escHtml(text) + '</p>\n';
  html += '    </div>\n';
  html += '  </footer>\n';
  return html;
}

function getFontLinks(designStrategy) {
  var style = (designStrategy.visual && designStrategy.visual.designStyle) || '';
  var headingFamily = 'Inter';
  var bodyFamily = 'Inter';

  if (style.indexOf('editorial') !== -1) {
    headingFamily = 'Playfair+Display';
    return '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=' + headingFamily + ':wght@400;600;700&display=swap" rel="stylesheet">';
  }
  if (style.indexOf('corporate') !== -1) {
    return '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">';
  }
  return '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">';
}

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = { generateHtmlPage };
