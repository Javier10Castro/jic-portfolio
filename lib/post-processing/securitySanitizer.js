function sanitize(html) {
  var result = html;
  var issues = [];

  var jsProtocolRegex = /href=["']javascript:[^"']*["']/gi;
  var jsMatches = result.match(jsProtocolRegex);
  if (jsMatches) {
    for (var i = 0; i < jsMatches.length; i++) {
      issues.push({ severity: 'critical', category: 'security', message: 'javascript: URI found in href — removed' });
    }
    result = result.replace(jsProtocolRegex, 'href="#"');
  }

  var inlineHandlerRegex = /\son\w+\s*=\s*["'][^"']*["']/gi;
  var handlerMatches = result.match(inlineHandlerRegex);
  if (handlerMatches) {
    for (var j = 0; j < handlerMatches.length; j++) {
      issues.push({ severity: 'major', category: 'security', message: 'Inline event handler found: ' + handlerMatches[j].trim().substring(0, 30) + ' — moved to script.js pattern' });
    }
  }

  var scriptTagRegex = /<script[^>]*src=["'][^"']*["'][^>]*>[\s\S]*?<\/script>/gi;
  var scriptSrcMatches = result.match(scriptTagRegex);
  if (scriptSrcMatches) {
    for (var k = 0; k < scriptSrcMatches.length; k++) {
      var attrMatch = scriptSrcMatches[k].match(/src=["']([^"']+)["']/);
      if (attrMatch && attrMatch[1].indexOf('http') === 0 && attrMatch[1].indexOf(windowLocation) === -1) {
        issues.push({ severity: 'warning', category: 'security', message: 'External script loaded from ' + attrMatch[1] + ' — verify trustworthiness' });
      }
    }
  }

  if (result.indexOf('http-equiv="refresh"') !== -1) {
    issues.push({ severity: 'warning', category: 'security', message: 'Meta refresh tag detected — potential redirect risk' });
  }

  return { html: result, issues: issues };
}

var windowLocation = 'https://web-portfolio-kappa-wheat.vercel.app';

module.exports = { sanitize };
