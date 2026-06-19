function seoScore(html) {
  var score = 100;
  var issues = [];

  if (html.indexOf('<title>') === -1 || html.indexOf('</title>') === -1) {
    score -= 25;
    issues.push({ severity: 'critical', category: 'seo', message: 'Missing <title> tag' });
  } else {
    var titleMatch = html.match(/<title>([^<]*)<\/title>/);
    if (titleMatch) {
      var title = titleMatch[1].trim();
      if (title.length === 0) { score -= 20; issues.push({ severity: 'critical', category: 'seo', message: '<title> is empty' }); }
      else if (title.length > 70) { score -= 5; issues.push({ severity: 'minor', category: 'seo', message: '<title> exceeds 70 characters (' + title.length + ')' }); }
    }
  }

  var descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  if (!descMatch) {
    score -= 20;
    issues.push({ severity: 'critical', category: 'seo', message: 'Missing meta description' });
  } else {
    var desc = descMatch[1].trim();
    if (desc.length === 0) { score -= 15; issues.push({ severity: 'critical', category: 'seo', message: 'meta description is empty' }); }
    else if (desc.length > 165) { score -= 5; issues.push({ severity: 'minor', category: 'seo', message: 'meta description exceeds 165 characters (' + desc.length + ')' }); }
  }

  if (html.indexOf('name="viewport"') === -1) {
    score -= 10;
    issues.push({ severity: 'major', category: 'seo', message: 'Missing viewport meta tag' });
  }

  if (html.indexOf('name="generator"') === -1) {
    score -= 5;
    issues.push({ severity: 'minor', category: 'seo', message: 'Missing generator meta tag' });
  }

  if (html.indexOf('<meta charset') === -1) {
    score -= 10;
    issues.push({ severity: 'major', category: 'seo', message: 'Missing charset meta tag' });
  }

  return { score: Math.max(0, score), issues: issues };
}

function optimize(html) {
  var result = html;

  if (result.indexOf('name="generator"') === -1) {
    result = result.replace('</title>', '</title>\n    <meta name="generator" content="JIC Website Generator">');
  }

  return result;
}

module.exports = { seoScore, optimize };
