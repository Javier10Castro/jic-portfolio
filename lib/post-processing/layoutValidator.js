function layoutScore(files) {
  var score = 100;
  var issues = [];
  var suggestions = [];

  var navStructure = null;
  var pageCount = 0;

  var htmlFiles = [];
  for (var path in files) {
    if (!files.hasOwnProperty(path)) continue;
    if (path.indexOf('.html') !== -1 && path.indexOf('/dist/') === 0) {
      htmlFiles.push({ path: path, content: files[path] });
      pageCount++;
    }
  }

  if (pageCount === 0) {
    score = 0;
    issues.push({ severity: 'critical', category: 'layout', message: 'No HTML pages found in output' });
    return { score: score, issues: issues, suggestions: suggestions, pageCount: pageCount };
  }

  for (var i = 0; i < htmlFiles.length; i++) {
    var file = htmlFiles[i];
    var html = file.content;

    if (!html.match(/class="[^"]*main-content[^"]*"/) && html.indexOf('id="main-content"') === -1) {
      score -= 5;
      issues.push({ severity: 'minor', category: 'layout', message: file.path + ' missing main content wrapper' });
    }

    var sectionRegex = /<section[^>]*>/g;
    var sections = html.match(sectionRegex);
    if (!sections || sections.length === 0) {
      score -= 5;
      issues.push({ severity: 'minor', category: 'layout', message: file.path + ' has no <section> elements' });
    }

    if (!html.match(/class="[^"]*site-footer[^"]*"/) && html.indexOf('id="footer"') === -1) {
      score -= 5;
      issues.push({ severity: 'minor', category: 'layout', message: file.path + ' missing footer' });
    }

    if (!html.match(/class="[^"]*site-header[^"]*"/) && html.indexOf('role="banner"') === -1) {
      score -= 5;
      issues.push({ severity: 'minor', category: 'layout', message: file.path + ' missing header' });
    }

    var fileNav = extractNavLinks(html);
    if (navStructure === null) {
      navStructure = fileNav;
    } else if (!arraysEqual(navStructure, fileNav)) {
      score -= 10;
      issues.push({ severity: 'major', category: 'layout', message: 'Navigation differs between ' + file.path + ' and other pages' });
    }

    if (hasEmptySections(html)) {
      score -= 3;
      suggestions.push({ category: 'layout', message: file.path + ' contains empty sections (no content between tags)' });
    }
  }

  if (pageCount < 3) {
    suggestions.push({ category: 'layout', message: 'Only ' + pageCount + ' pages — consider if all required pages are present' });
  }

  return { score: Math.max(0, score), issues: issues, suggestions: suggestions, pageCount: pageCount };
}

function extractNavLinks(html) {
  var navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/);
  if (!navMatch) return [];
  var navHtml = navMatch[1];
  var linkRegex = /<a\s[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
  var links = [];
  var match;
  while ((match = linkRegex.exec(navHtml)) !== null) {
    links.push({ href: match[1], text: match[2].trim() });
  }
  return links;
}

function arraysEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i].href !== b[i].href || a[i].text !== b[i].text) return false;
  }
  return true;
}

function hasEmptySections(html) {
  var sectionRegex = /<section[^>]*>([\s\S]*?)<\/section>/g;
  var match;
  while ((match = sectionRegex.exec(html)) !== null) {
    var inner = match[1].trim();
    if (inner.length < 10) return true;
  }
  return false;
}

function validateResponsive(html) {
  return html.indexOf('@media') !== -1;
}

module.exports = { layoutScore, validateResponsive };
