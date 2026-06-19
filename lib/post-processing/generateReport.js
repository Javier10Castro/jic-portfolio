function generateReport(results) {
  var allIssues = [];
  var allSuggestions = [];
  var scores = {};

  var categories = ['seo', 'accessibility', 'performance', 'layout', 'security'];
  for (var ci = 0; ci < categories.length; ci++) {
    var cat = categories[ci];
    var data = results[cat];
    if (!data) continue;

    scores[cat] = data.score !== undefined ? data.score : 100;

    if (data.issues) {
      for (var ii = 0; ii < data.issues.length; ii++) {
        data.issues[ii].checker = cat;
        allIssues.push(data.issues[ii]);
      }
    }

    if (data.suggestions) {
      for (var si = 0; si < data.suggestions.length; si++) {
        data.suggestions[si].checker = cat;
        allSuggestions.push(data.suggestions[si]);
      }
    }
  }

  allIssues.sort(function(a, b) {
    var order = { critical: 0, major: 1, minor: 2, warning: 3 };
    return (order[a.severity] || 99) - (order[b.severity] || 99);
  });

  var totalScores = 0;
  var scoreCount = 0;
  for (var key in scores) {
    if (scores.hasOwnProperty(key)) {
      totalScores += scores[key];
      scoreCount++;
    }
  }
  var overallScore = scoreCount > 0 ? Math.round(totalScores / scoreCount) : 0;

  var report = {
    buildTime: results.buildTime || new Date().toISOString(),
    overallScore: overallScore,
    scores: scores,
    summary: {
      total: allIssues.length,
      critical: allIssues.filter(function(i) { return i.severity === 'critical'; }).length,
      major: allIssues.filter(function(i) { return i.severity === 'major'; }).length,
      minor: allIssues.filter(function(i) { return i.severity === 'minor'; }).length,
      warnings: allIssues.filter(function(i) { return i.severity === 'warning'; }).length,
    },
    issues: allIssues,
    suggestions: allSuggestions,
    passed: overallScore >= 70 && allIssues.filter(function(i) { return i.severity === 'critical'; }).length === 0,
  };

  return report;
}

module.exports = { generateReport };
