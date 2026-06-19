function defineLayout(page, pages, blueprint) {
  var type = page.type;
  var layoutId = page.id;
  var path = page.path;

  var layouts = {
    home: { template: 'full', hero: true, sections: 'all', sidebar: false, width: 'full' },
    about: { template: 'standard', hero: false, sections: 'story_mission', sidebar: false, width: 'contained' },
    contact: { template: 'split', hero: false, sections: 'contact_only', sidebar: false, width: 'contained' },
    services: { template: 'grid', hero: false, sections: 'services_only', sidebar: false, width: 'contained' },
    ecommerce: { template: 'grid', hero: false, sections: 'products_only', sidebar: true, width: 'wide' },
    legal: { template: 'minimal', hero: false, sections: 'content_only', sidebar: false, width: 'narrow' },
    content: { template: 'standard', hero: false, sections: 'content_only', sidebar: true, width: 'contained' },
    portfolio: { template: 'grid', hero: false, sections: 'portfolio_only', sidebar: false, width: 'full' },
    landing: { template: 'full', hero: true, sections: 'landing', sidebar: false, width: 'full' },
    feature: { template: 'standard', hero: false, sections: 'feature_only', sidebar: false, width: 'contained' },
  };

  var layout = layouts[type] || layouts.legal;
  return {
    pageId: layoutId,
    pageType: type,
    path: path,
    template: layout.template,
    heroEnabled: layout.hero,
    sectionsMode: layout.sections,
    sidebar: layout.sidebar,
    width: layout.width,
  };
}

function buildNavigation(pages) {
  var navItems = [];
  for (var i = 0; i < pages.length; i++) {
    var p = pages[i];
    if (p.path === '/') {
      navItems.unshift({ label: 'Home', href: 'index.html', priority: 'critical' });
    } else if (p.path === '/privacy' || p.path === '/terms') {
      continue;
    } else if (p.path.indexOf(':slug') !== -1) {
      continue;
    } else {
      var segments = p.path.split('/').filter(Boolean);
      var fileName = segments[0] + '.html';
      navItems.push({ label: p.title, href: fileName, priority: p.priority });
    }
  }

  var unique = [];
  for (var j = 0; j < navItems.length; j++) {
    var exists = false;
    for (var k = 0; k < unique.length; k++) {
      if (unique[k].href === navItems[j].href) { exists = true; break; }
    }
    if (!exists) unique.push(navItems[j]);
  }
  return unique;
}

function layoutConfig(layout, navItems, page) {
  return {
    navItems: navItems,
    navLabel: page.title,
    containerClass: 'container-' + layout.width,
    templateClass: 'template-' + layout.template,
    hasSidebar: layout.sidebar,
    showHero: layout.heroEnabled,
    sectionsMode: layout.sectionsMode,
  };
}

module.exports = { defineLayout, buildNavigation, layoutConfig };
