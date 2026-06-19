function accessibilityScore(html) {
  var score = 100;
  var issues = [];

  if (html.indexOf('alt=') === -1 && html.indexOf('<img') !== -1) {
    score -= 15;
    issues.push({ severity: 'major', category: 'accessibility', message: 'Images found without alt attributes' });
  }

  var imgRegex = /<img[^>]*>/g;
  var imgMatch;
  var imgsWithAlt = 0;
  var imgsTotal = 0;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    imgsTotal++;
    if (imgMatch[0].indexOf('alt=') !== -1 || imgMatch[0].indexOf('alt =') !== -1) {
      imgsWithAlt++;
    }
  }
  if (imgsTotal > 0 && imgsWithAlt < imgsTotal) {
    var missingAlt = imgsTotal - imgsWithAlt;
    score -= (missingAlt / imgsTotal) * 15;
    issues.push({ severity: 'major', category: 'accessibility', message: missingAlt + ' of ' + imgsTotal + ' images missing alt attributes' });
  }

  var navMatch = html.match(/<nav[^>]*>/g);
  if (navMatch) {
    for (var i = 0; i < navMatch.length; i++) {
      if (navMatch[i].indexOf('aria-label') === -1 && navMatch[i].indexOf('aria-labelledby') === -1) {
        score -= 8;
        issues.push({ severity: 'major', category: 'accessibility', message: '<nav> missing aria-label' });
        break;
      }
    }
  } else {
    score -= 20;
    issues.push({ severity: 'critical', category: 'accessibility', message: 'No <nav> element found' });
  }

  if (html.indexOf('<main') === -1) {
    score -= 10;
    issues.push({ severity: 'major', category: 'accessibility', message: 'No <main> element found' });
  }

  if (html.indexOf('<footer') === -1) {
    score -= 5;
    issues.push({ severity: 'minor', category: 'accessibility', message: 'No <footer> element found' });
  }

  var headingRegex = /<h([1-6])[^>]*>/g;
  var headingCounts = {};
  while ((imgMatch = headingRegex.exec(html)) !== null) {
    var level = imgMatch[1];
    headingCounts[level] = (headingCounts[level] || 0) + 1;
  }
  if (headingCounts['1'] === undefined || headingCounts['1'] === 0) {
    score -= 5;
    issues.push({ severity: 'minor', category: 'accessibility', message: 'No <h1> heading found' });
  }

  if (html.indexOf('lang=') === -1 && html.indexOf('<html') !== -1) {
    score -= 5;
    issues.push({ severity: 'minor', category: 'accessibility', message: '<html> tag missing lang attribute' });
  }

  return { score: Math.max(0, score), issues: issues };
}

function improve(html) {
  var result = html;

  if (result.indexOf('<html') !== -1 && result.indexOf('lang=') === -1) {
    result = result.replace('<html>', '<html lang="en">');
  }

  return result;
}

module.exports = { accessibilityScore, improve };
