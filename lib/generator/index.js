const { defineLayout, buildNavigation, layoutConfig } = require('./layoutEngine');
const { mapSection } = require('./componentMapper');
const { generateHtmlPage } = require('./htmlGenerator');
const { generateCss } = require('./cssGenerator');
const { injectAssets, generateScriptFile } = require('./assetInjector');
const { validateOutput } = require('./validateOutput');
const { processBuild } = require('../post-processing');

function generateWebsite(contentPack, blueprint, designStrategy) {
  var startTime = Date.now();
  var files = {};
  var componentCount = 0;

  var pages = blueprint.pages || [];
  var navItems = buildNavigation(pages);

  var renderedPages = [];

  // Process each page from the content pack
  var contentPages = contentPack.pages || [];
  for (var ci = 0; ci < contentPages.length; ci++) {
    var pageContent = contentPages[ci];
    var matchPath = pageContent.path;
    var bpPage = findBlueprintPage(pages, matchPath);

    if (!bpPage) continue;

    var layout = defineLayout(bpPage, pages, blueprint);
    var config = layoutConfig(layout, navItems, bpPage);

    // Render sections → HTML components
    var renderedSections = {};
    var sections = pageContent.sections || [];
    for (var si = 0; si < sections.length; si++) {
      var section = sections[si];
      var html = mapSection(section, bpPage.type);
      renderedSections[section.id] = html;
      componentCount++;
    }
    pageContent.renderedSections = renderedSections;

    // Generate HTML
    var html = generateHtmlPage(pageContent, config, designStrategy, renderedPages);

    // Inject scripts, finalize SEO
    html = injectAssets(html, pageContent, designStrategy);

    var fileName = pathToFileName(matchPath);
    if (fileName) {
      files[fileName] = html;
      renderedPages.push({ path: matchPath, fileName: fileName, title: pageContent.title });
    }
  }

  // Generate CSS
  var css = generateCss(designStrategy);
  files['/dist/assets/styles.css'] = css;

  // Generate script
  var script = generateScriptFile();
  files['/dist/assets/script.js'] = script;

  var buildTime = Date.now() - startTime;

  var output = {
    files: files,
    meta: {
      pagesGenerated: renderedPages.length,
      componentsRendered: componentCount,
      buildTimeMs: buildTime,
    },
    pages: renderedPages,
    _startTime: startTime,
  };

  // Validate raw output
  var validated = validateOutput(output);

  // Post-process: SEO, accessibility, performance, layout, security
  var processed = processBuild(validated);

  processed.meta.postProcessing = true;
  processed.meta.buildValid = processed.buildValid;
  processed.meta.overallScore = processed.report.overallScore;

  return processed;
}

function findBlueprintPage(pages, path) {
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].path === path) return pages[i];
  }
  return null;
}

function pathToFileName(path) {
  if (path === '/' || path === '') return '/dist/index.html';
  var clean = path.replace(/^\//, '').replace(/\/$/, '');
  var segments = clean.split('/');
  // For dynamic routes like /product/:slug, skip
  if (segments.some(function(s) { return s.indexOf(':') === 0; })) return null;
  return '/dist/' + segments[0] + '.html';
}

module.exports = { generateWebsite };
