class ImpactAnalyzer {
  analyze(simulationResult) {
    if (!simulationResult) return { affectedResources: 0, blockedActions: 0, warningsIssued: 0, costImpact: 'none', userImpact: 'none', summary: 'No data' };
    const affectedResources = simulationResult.impact?.resourcesAffected || 0;
    const blockedActions = simulationResult.matched ? (simulationResult.actions || []).filter(a => a.triggered).length : 0;
    const warningsIssued = (simulationResult.conditions || []).filter(c => c.matched).length;
    const costImpact = blockedActions > 2 ? 'high' : blockedActions > 0 ? 'medium' : 'none';
    const userImpact = affectedResources > 5 ? 'high' : affectedResources > 0 ? 'medium' : 'none';
    const summary = `${blockedActions > 0 ? `${blockedActions} action(s) blocked` : 'No actions blocked'}, ${warningsIssued} warning(s)`;
    return { affectedResources, blockedActions, warningsIssued, costImpact, userImpact, summary };
  }

  compareImpact(results) {
    if (!Array.isArray(results)) return [];
    return results.map(r => this.analyze(r));
  }

  getHighImpactChanges(results) {
    if (!Array.isArray(results)) return [];
    return results.filter(r => {
      const impact = this.analyze(r);
      return impact.costImpact === 'high' || impact.userImpact === 'high' || impact.blockedActions > 0;
    });
  }

  generateImpactReport(results) {
    if (!Array.isArray(results)) return '# Impact Report\n\nNo results to analyze.';
    const impacts = results.map(r => this.analyze(r));
    let md = '# Impact Analysis Report\n\n';
    md += `## Summary\n- Simulations analyzed: ${results.length}\n`;
    const highImpact = impacts.filter(i => i.costImpact === 'high' || i.userImpact === 'high');
    md += `- High impact changes: ${highImpact.length}\n\n`;
    md += `## Details\n\n`;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const impact = impacts[i];
      md += `### Simulation ${i + 1}: ${r.policyId || 'Unknown'}\n`;
      md += `- **Matched:** ${r.matched}\n`;
      md += `- **Affected Resources:** ${impact.affectedResources}\n`;
      md += `- **Blocked Actions:** ${impact.blockedActions}\n`;
      md += `- **Warnings:** ${impact.warningsIssued}\n`;
      md += `- **Cost Impact:** ${impact.costImpact}\n`;
      md += `- **User Impact:** ${impact.userImpact}\n\n`;
    }
    return md;
  }

  clear() {}
}

module.exports = new ImpactAnalyzer();
