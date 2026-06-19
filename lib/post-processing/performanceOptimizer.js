function performanceScore(files) {
  var score = 100;
  var issues = [];
  var suggestions = [];
  var totalHtmlSize = 0;
  var htmlCount = 0;
  var cssSize = 0;

  for (var path in files) {
    if (!files.hasOwnProperty(path)) continue;
    var content = files[path];

    if (path.indexOf('.html') !== -1) {
      totalHtmlSize += content.length;
      htmlCount++;

      if (content.length > 20000) {
        score -= 5;
        issues.push({ severity: 'minor', category: 'performance', message: path + ' exceeds 20KB (' + content.length + ' bytes)' });
      }
    }

    if (path.indexOf('.css') !== -1) {
      cssSize = content.length;
    }
  }

  if (cssSize > 15000) {
    score -= 5;
    suggestions.push({ category: 'performance', message: 'CSS file is ' + cssSize + ' bytes — consider splitting or minifying' });
  }

  if (htmlCount > 0) {
    var avgSize = Math.round(totalHtmlSize / htmlCount);
    if (avgSize > 15000) {
      score -= 5;
      suggestions.push({ category: 'performance', message: 'Average HTML page size is ' + avgSize + ' bytes — consider reducing' });
    }
  }

  if (htmlCount <= 1) {
    score -= 10;
    suggestions.push({ category: 'performance', message: 'Only ' + htmlCount + ' HTML page generated — multi-page sites benefit from code splitting' });
  }

  return { score: Math.max(0, score), issues: issues, suggestions: suggestions };
}

function optimizeCss(css) {
  return css;
}

function inlineCriticalCss(html, css) {
  return html;
}

module.exports = { performanceScore, optimizeCss, inlineCriticalCss };
