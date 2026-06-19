const { seoScore, optimize: optimizeSeo } = require('./seoOptimizer');
const { accessibilityScore, improve: improveA11y } = require('./accessibilityChecker');
const { performanceScore } = require('./performanceOptimizer');
const { layoutScore, validateResponsive } = require('./layoutValidator');
const { sanitize } = require('./securitySanitizer');
const { generateReport } = require('./generateReport');
const { validateBuild, PostProcessingError } = require('./validateBuild');

function processBuild(buildOutput) {
  var files = buildOutput.files || {};
  var results = {
    seo: { score: 100, issues: [], suggestions: [] },
    accessibility: { score: 100, issues: [], suggestions: [] },
    performance: { score: 100, issues: [], suggestions: [] },
    layout: { score: 100, issues: [], suggestions: [] },
    security: { score: 100, issues: [], suggestions: [] },
    buildTime: new Date().toISOString(),
  };

  var pageKeys = [];
  var cssContent = '';

  for (var path in files) {
    if (!files.hasOwnProperty(path)) continue;
    if (path.indexOf('.html') !== -1 && path.indexOf('/dist/') === 0) {
      pageKeys.push(path);
    }
    if (path.indexOf('.css') !== -1) {
      cssContent = files[path];
    }
  }

  // Run all checkers across every HTML page
  for (var pi = 0; pi < pageKeys.length; pi++) {
    var html = files[pageKeys[pi]];

    // SEO
    var seoResult = seoScore(html);
    aggregateResults(results.seo, seoResult);
    files[pageKeys[pi]] = optimizeSeo(files[pageKeys[pi]]);

    // Accessibility
    var a11yResult = accessibilityScore(html);
    aggregateResults(results.accessibility, a11yResult);
    files[pageKeys[pi]] = improveA11y(files[pageKeys[pi]]);

    // Security: re-read the possibly-modified HTML
    var secResult = sanitize(files[pageKeys[pi]]);
    files[pageKeys[pi]] = secResult.html;
    if (secResult.issues) {
      for (var si = 0; si < secResult.issues.length; si++) {
        results.security.issues.push(secResult.issues[si]);
        var sevWeight = { critical: 25, major: 10, minor: 5, warning: 2 };
        results.security.score -= (sevWeight[secResult.issues[si].severity] || 5);
      }
    }
  }

  // Performance (across all files)
  var perfResult = performanceScore(files);
  results.performance.score = perfResult.score;
  if (perfResult.issues) {
    for (var pi2 = 0; pi2 < perfResult.issues.length; pi2++) {
      results.performance.issues.push(perfResult.issues[pi2]);
    }
  }
  if (perfResult.suggestions) {
    for (var psi = 0; psi < perfResult.suggestions.length; psi++) {
      results.performance.suggestions.push(perfResult.suggestions[psi]);
    }
  }

  // Layout (across all pages)
  var layoutResult = layoutScore(files);
  results.layout.score = layoutResult.score;
  if (layoutResult.issues) {
    for (var li = 0; li < layoutResult.issues.length; li++) {
      results.layout.issues.push(layoutResult.issues[li]);
    }
  }
  if (layoutResult.suggestions) {
    for (var lsi = 0; lsi < layoutResult.suggestions.length; lsi++) {
      results.layout.suggestions.push(layoutResult.suggestions[lsi]);
    }
  }
  results.layout.pageCount = layoutResult.pageCount;

  // Generate report
  var report = generateReport(results);

  // Validate build
  var buildValid = true;
  try {
    validateBuild(report);
  } catch (e) {
    buildValid = false;
    report.buildError = e.message;
  }

  return {
    files: files,
    meta: buildOutput.meta || {},
    report: report,
    buildValid: buildValid,
    postProcessingTime: Date.now() - (buildOutput._startTime || Date.now()),
  };
}

function aggregateResults(accumulator, result) {
  if (result.score !== undefined) {
    accumulator.score = Math.min(accumulator.score, result.score);
  }
  if (result.issues) {
    for (var i = 0; i < result.issues.length; i++) {
      accumulator.issues.push(result.issues[i]);
    }
  }
  if (result.suggestions) {
    for (var j = 0; j < result.suggestions.length; j++) {
      accumulator.suggestions.push(result.suggestions[j]);
    }
  }
}

module.exports = { processBuild, PostProcessingError };
