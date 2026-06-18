const { planPages } = require('./pagePlanner');
const { planSections } = require('./sectionPlanner');
const { planNavigation } = require('./navigationPlanner');
const { planComponents } = require('./componentPlanner');
const { validateBlueprint } = require('./validateBlueprint');

function generateBlueprint(planIR) {
  const pages = planPages(planIR);
  const sections = planSections(planIR, pages);
  const navigation = planNavigation(pages, planIR);
  const components = planComponents(pages, planIR);

  const blueprint = {
    meta: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      source: 'project_planner',
      planIRVersion: planIR.meta ? planIR.meta.version : 'unknown',
    },
    project: {
      name: planIR.project.name,
      tagline: planIR.project.tagline,
      type: planIR.project.type,
    },
    pages,
    navigation,
    sections,
    components,
    userFlow: buildUserFlow(pages, planIR),
    hierarchy: buildHierarchy(pages),
    priorities: buildPriorities(pages),
    constraints: planIR.constraints || {},
  };

  return validateBlueprint(blueprint);
}

function buildUserFlow(pages, planIR) {
  const type = planIR.project.type;
  const userFlow = planIR.structure.userFlow || '';

  const entryPoints = ['/'];
  const conversionPoints = ['/contact', '/booking', '/cart', '/checkout'];

  let primaryPath = [];

  if (type === 'ecommerce') {
    primaryPath = ['/home', '/shop', '/product/:slug', '/cart', '/checkout'];
  } else if (type === 'portfolio') {
    primaryPath = ['/home', '/portfolio', '/project/:slug', '/contact'];
  } else if (type === 'service_business') {
    primaryPath = ['/home', '/services', '/service/:slug', '/booking', '/contact'];
  } else {
    primaryPath = ['/home', '/services', '/about', '/contact'];
  }

  const secondaryPaths = [
    ['/home', '/about'],
    ['/home', '/blog', '/blog/:slug'],
    ['/home', '/faq'],
  ];

  return {
    entryPoints,
    primaryPath,
    secondaryPaths,
    conversionPoints,
    customFlow: userFlow || null,
  };
}

function buildHierarchy(pages) {
  const tree = { id: 'root', label: 'Site Root', path: '/', children: [] };

  const criticalPages = pages.filter(p => p.priority === 'critical');
  for (const cp of criticalPages) {
    if (cp.path === '/') {
      tree.label = cp.title;
      tree.id = cp.id;
    }
  }

  const childPages = pages.filter(p => p.path !== '/' && p.path !== '');
  for (const cp of childPages) {
    const segments = cp.path.split('/').filter(Boolean);
    if (segments.length === 1) {
      tree.children.push({ id: cp.id, label: cp.title, path: cp.path, type: cp.type, priority: cp.priority, children: [] });
    }
  }

  for (const cp of childPages) {
    const segments = cp.path.split('/').filter(Boolean);
    if (segments.length > 1) {
      const parent = tree.children.find(c => c.id === segments[0] || c.path === '/' + segments[0]);
      if (parent) {
        parent.children.push({ id: cp.id, label: cp.title, path: cp.path, type: cp.type, priority: cp.priority, children: [] });
      }
    }
  }

  return { root: tree.id, tree };
}

function buildPriorities(pages) {
  const groups = { critical: [], high: [], medium: [], low: [] };

  for (const page of pages) {
    if (groups[page.priority]) {
      groups[page.priority].push({ id: page.id, title: page.title, path: page.path });
    }
  }

  return groups;
}

module.exports = { generateBlueprint };
