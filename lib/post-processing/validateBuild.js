class PostProcessingError extends Error {
  constructor(message, report) {
    super(message);
    this.name = 'PostProcessingError';
    this.report = report;
  }
}

function validateBuild(report) {
  if (!report || typeof report !== 'object') {
    throw new PostProcessingError('Build report is required', report);
  }

  var criticalIssues = report.issues ? report.issues.filter(function(i) { return i.severity === 'critical'; }) : [];

  if (criticalIssues.length > 0) {
    var descriptions = criticalIssues.map(function(i) { return i.category + ': ' + i.message; }).join('; ');
    throw new PostProcessingError('Build has ' + criticalIssues.length + ' critical issue(s): ' + descriptions, report);
  }

  if (report.overallScore !== undefined && report.overallScore < 50) {
    throw new PostProcessingError('Build overall score (' + report.overallScore + ') is below minimum threshold (50)', report);
  }

  return true;
}

module.exports = { validateBuild, PostProcessingError };
