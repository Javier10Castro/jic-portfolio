const ArchitectureCenter = (function() {
  const tabs = ['overview', 'solution-design', 'patterns', 'quality-attributes', 'decision-records', 'dependency-graph', 'analysis', 'exports'];
  let currentTab = 'overview';

  function init() {
    render();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', render);
    }
  }

  function switchTab(tab) {
    currentTab = tab;
    render();
  }

  function render() {
    const container = document.getElementById('architecture-center') || createContainer();
    container.innerHTML = renderHeader() + renderTabs() + renderContent();
  }

  function renderHeader() {
    return '<div class="ac-header"><h1>Architecture Center</h1><button class="ac-btn ac-btn-secondary" onclick="ArchitectureCenter.refresh()">Refresh</button></div>';
  }

  function renderTabs() {
    return '<nav class="ac-tabs">' + tabs.map(t =>
      '<button class="ac-tab' + (currentTab === t ? ' active' : '') + '" onclick="ArchitectureCenter.switchTab(\'' + t + '\')">' +
      t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') +
      '</button>'
    ).join('') + '</nav>';
  }

  function renderContent() {
    const panels = {
      overview: renderOverview,
      'solution-design': renderSolutionDesign,
      patterns: renderPatterns,
      'quality-attributes': renderQualityAttributes,
      'decision-records': renderDecisionRecords,
      'dependency-graph': renderDependencyGraph,
      analysis: renderAnalysis,
      exports: renderExports,
    };
    return (panels[currentTab] || panels.overview)();
  }

  function renderOverview() {
    return '<div class="ac-widgets">'
      + widgetArchitectureScore()
      + widgetPatternUsage()
      + widgetRiskMatrix()
      + widgetTradeoffAnalysis()
      + widgetDecisionTimeline()
      + widgetQualityRadar()
      + widgetTopologyGraph()
      + widgetGeneratedBlueprint()
      + '</div>';
  }

  function widgetArchitectureScore() {
    return '<div class="ac-widget ac-widget-score"><div class="ac-widget-header"><h3>Architecture Score</h3><span class="ac-badge ac-badge-good">86/100</span></div>'
      + '<div class="ac-score-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a2e" stroke-width="8"/><circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" stroke-width="8" stroke-dasharray="251" stroke-dashoffset="35" stroke-linecap="round" transform="rotate(-90 50 50)"/></svg><span class="ac-score-value">86%</span></div>'
      + '<div class="ac-score-details"><div><span>Maintainability</span><span>92</span></div><div><span>Scalability</span><span>88</span></div><div><span>Security</span><span>79</span></div><div><span>Performance</span><span>84</span></div></div></div>';
  }

  function widgetPatternUsage() {
    return '<div class="ac-widget ac-widget-patterns"><div class="ac-widget-header"><h3>Pattern Usage</h3><span class="ac-badge">12 active</span></div>'
      + '<div class="ac-pattern-list"><div class="ac-pattern-item"><span class="ac-pattern-bar" style="width:90%"></span><span>Event Sourcing</span><span class="ac-pattern-count">24</span></div>'
      + '<div class="ac-pattern-item"><span class="ac-pattern-bar" style="width:75%"></span><span>CQRS</span><span class="ac-pattern-count">18</span></div>'
      + '<div class="ac-pattern-item"><span class="ac-pattern-bar" style="width:60%"></span><span>Saga</span><span class="ac-pattern-count">14</span></div>'
      + '<div class="ac-pattern-item"><span class="ac-pattern-bar" style="width:45%"></span><span>Strangler Fig</span><span class="ac-pattern-count">9</span></div>'
      + '<div class="ac-pattern-item"><span class="ac-pattern-bar" style="width:30%"></span><span>Circuit Breaker</span><span class="ac-pattern-count">6</span></div></div></div>';
  }

  function widgetRiskMatrix() {
    return '<div class="ac-widget ac-widget-risk"><div class="ac-widget-header"><h3>Risk Matrix</h3></div>'
      + '<div class="ac-risk-grid"><div class="ac-risk-cell ac-risk-critical">Critical<span>3</span></div>'
      + '<div class="ac-risk-cell ac-risk-high">High<span>7</span></div>'
      + '<div class="ac-risk-cell ac-risk-medium">Medium<span>12</span></div>'
      + '<div class="ac-risk-cell ac-risk-low">Low<span>24</span></div></div>'
      + '<div class="ac-risk-meta"><span>Top: Single Point of Failure</span><span>Status: Monitoring</span></div></div>';
  }

  function widgetTradeoffAnalysis() {
    return '<div class="ac-widget ac-widget-tradeoff"><div class="ac-widget-header"><h3>Tradeoff Analysis</h3></div>'
      + '<div class="ac-tradeoff-list"><div class="ac-tradeoff-item"><div><strong>Consistency vs Availability</strong><span class="ac-tradeoff-desc">Preferring eventual consistency for better uptime</span></div><span class="ac-tradeoff-decision">AP</span></div>'
      + '<div class="ac-tradeoff-item"><div><strong>Latency vs Freshness</strong><span class="ac-tradeoff-desc">Cache TTL set to 30s for read endpoints</span></div><span class="ac-tradeoff-decision">Cached</span></div>'
      + '<div class="ac-tradeoff-item"><div><strong>Cost vs Redundancy</strong><span class="ac-tradeoff-desc">Multi-region active-passive deployment</span></div><span class="ac-tradeoff-decision">Active-Passive</span></div></div></div>';
  }

  function widgetDecisionTimeline() {
    return '<div class="ac-widget ac-widget-timeline"><div class="ac-widget-header"><h3>Decision Timeline</h3></div>'
      + '<div class="ac-timeline"><div class="ac-timeline-item"><div class="ac-timeline-dot"></div><div class="ac-timeline-content"><span class="ac-timeline-date">2026-06-15</span><strong>ADR-042</strong><p>Migrate message broker to Kafka</p></div></div>'
      + '<div class="ac-timeline-item"><div class="ac-timeline-dot"></div><div class="ac-timeline-content"><span class="ac-timeline-date">2026-06-01</span><strong>ADR-041</strong><p>Adopt GraphQL for public APIs</p></div></div>'
      + '<div class="ac-timeline-item"><div class="ac-timeline-dot"></div><div class="ac-timeline-content"><span class="ac-timeline-date">2026-05-20</span><strong>ADR-040</strong><p>Replace monolith with micro-frontends</p></div></div></div></div>';
  }

  function widgetQualityRadar() {
    return '<div class="ac-widget ac-widget-radar"><div class="ac-widget-header"><h3>Quality Radar</h3></div>'
      + '<div class="ac-radar-chart"><svg viewBox="0 0 200 200"><polygon points="100,20 160,60 180,130 140,180 60,180 20,130 40,60" fill="#0f3460" opacity="0.3" stroke="#22c55e" stroke-width="1"/>'
      + '<polygon points="100,30 150,65 165,125 130,170 70,170 35,125 50,65" fill="none" stroke="#22c55e" stroke-width="2"/>'
      + '<circle cx="100" cy="20" r="2" fill="#22c55e"/><circle cx="160" cy="60" r="2" fill="#22c55e"/>'
      + '<circle cx="180" cy="130" r="2" fill="#22c55e"/><circle cx="140" cy="180" r="2" fill="#22c55e"/>'
      + '<circle cx="60" cy="180" r="2" fill="#22c55e"/><circle cx="20" cy="130" r="2" fill="#22c55e"/>'
      + '<circle cx="40" cy="60" r="2" fill="#22c55e"/></svg></div>'
      + '<div class="ac-radar-labels"><span>Reliability</span><span>Scalability</span><span>Security</span><span>Cost</span><span>Performance</span><span>Maintain</span><span>Usability</span></div></div>';
  }

  function widgetTopologyGraph() {
    return '<div class="ac-widget ac-widget-topology"><div class="ac-widget-header"><h3>Topology Graph</h3></div>'
      + '<div class="ac-topology"><div class="ac-topology-layer"><span class="ac-topology-label">Gateway</span><div class="ac-topology-node ac-topology-gateway">API Gateway</div></div>'
      + '<div class="ac-topology-layer"><span class="ac-topology-label">Services</span><div class="ac-topology-nodes"><span class="ac-topology-node">Auth</span><span class="ac-topology-node">Users</span><span class="ac-topology-node">Orders</span><span class="ac-topology-node">Inventory</span></div></div>'
      + '<div class="ac-topology-layer"><span class="ac-topology-label">Data</span><div class="ac-topology-nodes"><span class="ac-topology-node">Postgres</span><span class="ac-topology-node">Redis</span><span class="ac-topology-node">Kafka</span></div></div></div></div>';
  }

  function widgetGeneratedBlueprint() {
    return '<div class="ac-widget ac-widget-blueprint"><div class="ac-widget-header"><h3>Generated Blueprint</h3><span class="ac-badge">v2.4.1</span></div>'
      + '<div class="ac-blueprint"><div class="ac-blueprint-section"><span class="ac-blueprint-title">system.yaml</span><code>version: "2.4"<br>services:<br>&nbsp;&nbsp;api-gateway:<br>&nbsp;&nbsp;&nbsp;&nbsp;replicas: 3<br>&nbsp;&nbsp;&nbsp;&nbsp;rate-limit: 1000/s</code></div>'
      + '<div class="ac-blueprint-section"><span class="ac-blueprint-title">deploy.sh</span><code>#!/bin/bash<br>kubectl apply -f system.yaml<br>./run-health-checks.sh</code></div></div>'
      + '<button class="ac-btn ac-btn-primary">Download Blueprint</button></div>';
  }

  function renderSolutionDesign() {
    return '<div class="ac-panel"><h2>Solution Design</h2><p>Architecture design canvas for creating and visualizing solution blueprints.</p>'
      + '<div class="ac-widgets">'
      + '<div class="ac-widget"><div class="ac-widget-header"><h3>Canvas</h3></div><div class="ac-canvas-placeholder">Drag and drop components to design your architecture</div></div>'
      + '<div class="ac-widget"><div class="ac-widget-header"><h3>Component Palette</h3></div><div class="ac-palette"><span class="ac-palette-item">Service</span><span class="ac-palette-item">Database</span><span class="ac-palette-item">Queue</span><span class="ac-palette-item">Gateway</span><span class="ac-palette-item">Cache</span><span class="ac-palette-item">Function</span></div></div>'
      + '</div></div>';
  }

  function renderPatterns() {
    return '<div class="ac-panel"><h2>Architecture Patterns</h2><p>Catalog of reusable architecture patterns and their applications.</p>'
      + '<div class="ac-widgets">'
      + '<div class="ac-widget"><div class="ac-widget-header"><h3>Pattern Library</h3></div><div class="ac-pattern-catalog"><div class="ac-pattern-card"><strong>Event Sourcing</strong><p>Store state changes as event log</p><span class="ac-badge">12 uses</span></div><div class="ac-pattern-card"><strong>CQRS</strong><p>Separate read/write models</p><span class="ac-badge">8 uses</span></div><div class="ac-pattern-card"><strong>Saga</strong><p>Distributed transaction coordination</p><span class="ac-badge">5 uses</span></div></div></div>'
      + '</div></div>';
  }

  function renderQualityAttributes() {
    return '<div class="ac-panel"><h2>Quality Attributes</h2><p>Non-functional requirements tracking and evaluation.</p>'
      + '<div class="ac-widgets">'
      + '<div class="ac-widget"><div class="ac-widget-header"><h3>Attribute Overview</h3></div><div class="ac-attr-list"><div class="ac-attr-item"><span>Availability</span><div class="ac-attr-bar"><div style="width:99.5%"></div></div><span>99.5%</span></div><div class="ac-attr-item"><span>Latency p99</span><div class="ac-attr-bar"><div style="width:85%"></div></div><span>45ms</span></div><div class="ac-attr-item"><span>Throughput</span><div class="ac-attr-bar"><div style="width:70%"></div></div><span>2400 req/s</span></div><div class="ac-attr-item"><span>Error Rate</span><div class="ac-attr-bar"><div style="width:5%;background:#22c55e"></div></div><span>0.05%</span></div></div></div>'
      + '</div></div>';
  }

  function renderDecisionRecords() {
    return '<div class="ac-panel"><h2>Architecture Decision Records</h2><p>Documented architectural decisions with rationale and consequences.</p>'
      + '<div class="ac-widgets">'
      + '<div class="ac-widget"><div class="ac-widget-header"><h3>Recent ADRs</h3></div><div class="ac-adr-list"><div class="ac-adr-item"><span class="ac-adr-id">ADR-042</span><span>Migrate to Kafka for event streaming</span><span class="ac-adr-status accepted">Accepted</span></div><div class="ac-adr-item"><span class="ac-adr-id">ADR-041</span><span>Adopt GraphQL for public API layer</span><span class="ac-adr-status accepted">Accepted</span></div><div class="ac-adr-item"><span class="ac-adr-id">ADR-040</span><span>Micro-frontend architecture for UI</span><span class="ac-adr-status proposed">Proposed</span></div></div></div>'
      + '</div></div>';
  }

  function renderDependencyGraph() {
    return '<div class="ac-panel"><h2>Dependency Graph</h2><p>Visual dependency map across all system components.</p>'
      + '<div class="ac-widgets">'
      + '<div class="ac-widget"><div class="ac-widget-header"><h3>Graph View</h3></div><div class="ac-dep-graph"><div class="ac-dep-node ac-dep-node-core">Core API</div><div class="ac-dep-arrow">→</div><div class="ac-dep-node">Auth</div><div class="ac-dep-arrow">→</div><div class="ac-dep-node">User DB</div><div class="ac-dep-node ac-dep-node-core">Web App</div><div class="ac-dep-arrow">→</div><div class="ac-dep-node">Gateway</div><div class="ac-dep-arrow">→</div><div class="ac-dep-node">Cache</div></div></div>'
      + '</div></div>';
  }

  function renderAnalysis() {
    return '<div class="ac-panel"><h2>Architecture Analysis</h2><p>Static analysis and architecture conformance checks.</p>'
      + '<div class="ac-widgets">'
      + '<div class="ac-widget"><div class="ac-widget-header"><h3>Conformance Report</h3></div><div class="ac-analysis-stats"><div class="ac-analysis-stat"><span>Rules Checked</span><span class="ac-analysis-value">47</span></div><div class="ac-analysis-stat"><span>Passed</span><span class="ac-analysis-value ac-passed">42</span></div><div class="ac-analysis-stat"><span>Violations</span><span class="ac-analysis-value ac-violations">5</span></div><div class="ac-analysis-stat"><span>Warnings</span><span class="ac-analysis-value ac-warnings">12</span></div></div></div>'
      + '<div class="ac-widget"><div class="ac-widget-header"><h3>Violations</h3></div><div class="ac-violation-list"><div class="ac-violation-item">Circular dependency: A → B → C → A</div><div class="ac-violation-item">Layer breach: UI imports data layer</div><div class="ac-violation-item">Excessive coupling: module-x (42 deps)</div></div></div>'
      + '</div></div>';
  }

  function renderExports() {
    return '<div class="ac-panel"><h2>Exports</h2><p>Export architecture documentation and blueprints.</p>'
      + '<div class="ac-widgets">'
      + '<div class="ac-widget"><div class="ac-widget-header"><h3>Export Formats</h3></div><div class="ac-export-list"><div class="ac-export-item"><span>Architecture Overview (PDF)</span><span class="ac-badge">Ready</span><button class="ac-btn ac-btn-small">Download</button></div><div class="ac-export-item"><span>ADR Collection (Markdown)</span><span class="ac-badge">Ready</span><button class="ac-btn ac-btn-small">Download</button></div><div class="ac-export-item"><span>Dependency Graph (SVG)</span><span class="ac-badge">Ready</span><button class="ac-btn ac-btn-small">Download</button></div><div class="ac-export-item"><span>Full Blueprint (YAML)</span><span class="ac-badge">Generating</span><button class="ac-btn ac-btn-small" disabled>Generating</button></div></div></div>'
      + '</div></div>';
  }

  function createContainer() {
    const el = document.createElement('div');
    el.id = 'architecture-center';
    el.className = 'architecture-center';
    document.body.appendChild(el);
    return el;
  }

  return { init, render, switchTab, refresh: render };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ArchitectureCenter };
}

ArchitectureCenter.init();
