var GovernanceCenter = {
  currentTab: 'overview',
  data: { policies: [], compliance: {}, approvals: [], audit: [], simulations: [] },

  init: function() { this.render(); this.loadData(); },

  loadData: async function() {
    try {
      var base = '/api/v1';
      var results = await Promise.all([
        fetch(base + '/governance').then(function(r) { return r.ok ? r.json() : { data: {} }; }),
        fetch(base + '/governance/policies').then(function(r) { return r.ok ? r.json() : { data: [] }; }),
        fetch(base + '/governance/compliance').then(function(r) { return r.ok ? r.json() : { data: {} }; }),
        fetch(base + '/governance/approvals').then(function(r) { return r.ok ? r.json() : { data: [] }; }),
        fetch(base + '/governance/audit').then(function(r) { return r.ok ? r.json() : { data: [] }; })
      ]);
      this.data.overview = results[0].data || {};
      this.data.policies = results[1].data || [];
      this.data.compliance = results[2].data || {};
      this.data.approvals = results[3].data || [];
      this.data.audit = results[4].data || [];
      this.render();
    } catch (e) {
      console.error('GovernanceCenter loadData error', e);
    }
  },

  render: function() {
    var container = document.getElementById('governance-center') || this.createContainer();
    container.innerHTML = this.renderTabs() + '<div class="gov-content">' + this.renderContent() + '</div>';
  },

  renderTabs: function() {
    var tabs = ['overview', 'policies', 'compliance', 'approvals', 'audit', 'simulation', 'reports'];
    var html = '<div class="gov-tabs">';
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var label = t.charAt(0).toUpperCase() + t.slice(1);
      var active = t === this.currentTab ? ' active' : '';
      html += '<button class="gov-tab' + active + '" onclick="GovernanceCenter.switchTab(\'' + t + '\')">' + label + '</button>';
    }
    html += '</div>';
    return html;
  },

  renderContent: function() {
    switch (this.currentTab) {
      case 'overview': return this.renderOverview();
      case 'policies': return this.renderPolicies();
      case 'compliance': return this.renderCompliance();
      case 'approvals': return this.renderApprovals();
      case 'audit': return this.renderAudit();
      case 'simulation': return this.renderSimulation();
      case 'reports': return this.renderReports();
      default: return '<div class="gov-empty">Select a tab</div>';
    }
  },

  renderOverview: function() {
    var d = this.data.overview || {};
    return '<div class="gov-widgets">' +
      '<div class="gov-widget"><div class="gov-widget-icon">&#9881;</div><div class="gov-widget-value">' + (d.activePolicies || 0) + '</div><div class="gov-widget-label">Active Policies</div></div>' +
      '<div class="gov-widget"><div class="gov-widget-icon">&#10003;</div><div class="gov-widget-value">' + (d.complianceScore || 0) + '%</div><div class="gov-widget-label">Compliance Score</div></div>' +
      '<div class="gov-widget"><div class="gov-widget-icon">&#9997;</div><div class="gov-widget-value">' + (d.pendingApprovals || 0) + '</div><div class="gov-widget-label">Pending Approvals</div></div>' +
      '<div class="gov-widget"><div class="gov-widget-icon">&#9888;</div><div class="gov-widget-value">' + (d.violations || 0) + '</div><div class="gov-widget-label">Violations</div></div>' +
      '</div>';
  },

  renderPolicies: function() {
    var items = this.data.policies;
    if (!items || items.length === 0) return '<div class="gov-empty">No policies defined</div>';
    var html = '<table class="gov-table"><thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Severity</th><th>Enforcement</th><th>Enabled</th><th>Version</th><th>Actions</th></tr></thead><tbody>';
    for (var i = 0; i < items.length; i++) {
      var p = items[i];
      var badge = 'gov-badge ' + (p.severity || 'low');
      html += '<tr><td>' + (p.id || '') + '</td><td>' + (p.name || '') + '</td><td>' + (p.type || '') + '</td><td><span class="' + badge + '">' + (p.severity || 'low') + '</span></td><td>' + (p.enforcement || '') + '</td><td>' + (p.enabled !== false ? 'Yes' : 'No') + '</td><td>' + (p.version || 1) + '</td><td><button class="gov-btn secondary" onclick="GovernanceCenter.viewPolicy(\'' + (p.id || '') + '\')">View</button></td></tr>';
    }
    html += '</tbody></table>';
    return html;
  },

  renderCompliance: function() {
    var c = this.data.compliance || {};
    var score = c.score || 0;
    var violations = c.violations || [];
    var scans = c.scans || [];
    var html = '<div class="gov-score-bar"><div class="gov-score-fill" style="width:' + score + '%"></div><span>' + score + '%</span></div>';
    html += '<h3>Violations</h3>';
    if (violations.length === 0) {
      html += '<div class="gov-empty">No violations</div>';
    } else {
      html += '<table class="gov-table"><thead><tr><th>Policy</th><th>Message</th><th>Severity</th></tr></thead><tbody>';
      for (var i = 0; i < violations.length; i++) {
        var v = violations[i];
        html += '<tr><td>' + (v.policyId || '') + '</td><td>' + (v.message || '') + '</td><td><span class="gov-badge ' + (v.severity || 'low') + '">' + (v.severity || 'low') + '</span></td></tr>';
      }
      html += '</tbody></table>';
    }
    html += '<h3>Scan History</h3>';
    if (scans.length === 0) {
      html += '<div class="gov-empty">No scans run</div>';
    } else {
      html += '<table class="gov-table"><thead><tr><th>Date</th><th>Status</th><th>Findings</th></tr></thead><tbody>';
      for (var j = 0; j < scans.length; j++) {
        var s = scans[j];
        html += '<tr><td>' + new Date(s.timestamp || Date.now()).toLocaleString() + '</td><td>' + (s.status || '') + '</td><td>' + ((s.findings && s.findings.length) || 0) + '</td></tr>';
      }
      html += '</tbody></table>';
    }
    html += '<button class="gov-btn primary" onclick="GovernanceCenter.runComplianceScan()">Run Scan</button>';
    return html;
  },

  renderApprovals: function() {
    var items = this.data.approvals;
    if (!items || items.length === 0) return '<div class="gov-empty">No pending approvals</div>';
    var html = '<table class="gov-table"><thead><tr><th>ID</th><th>Policy</th><th>Status</th><th>Requested By</th><th>Actions</th></tr></thead><tbody>';
    for (var i = 0; i < items.length; i++) {
      var a = items[i];
      html += '<tr><td>' + (a.id || '') + '</td><td>' + (a.policyId || '') + '</td><td><span class="gov-badge ' + (a.status || 'pending') + '">' + (a.status || 'pending') + '</span></td><td>' + (a.requestedBy || '') + '</td><td>' +
        '<button class="gov-btn primary" onclick="GovernanceCenter.approveRequest(\'' + (a.id || '') + '\')">Approve</button> ' +
        '<button class="gov-btn danger" onclick="GovernanceCenter.rejectRequest(\'' + (a.id || '') + '\')">Reject</button></td></tr>';
    }
    html += '</tbody></table>';
    return html;
  },

  renderAudit: function() {
    var items = this.data.audit;
    if (!items || items.length === 0) return '<div class="gov-empty">No audit entries</div>';
    var html = '<div class="gov-timeline">';
    for (var i = 0; i < items.length; i++) {
      var e = items[i];
      var indicator = 'gov-status-indicator';
      if (e.action === 'blocked' || e.severity === 'critical') indicator += ' red';
      else if (e.action === 'warned' || e.severity === 'high') indicator += ' yellow';
      else indicator += ' green';
      html += '<div class="gov-timeline-item"><span class="' + indicator + '"></span><div class="gov-timeline-content"><strong>' + (e.action || '') + '</strong> ' + (e.type || '') + '<br><small>' + new Date(e.timestamp || Date.now()).toLocaleString() + '</small></div></div>';
    }
    html += '</div>';
    return html;
  },

  renderSimulation: function() {
    return '<div class="gov-form"><h3>Policy Simulation</h3>' +
      '<label>Policy ID: <input type="text" id="sim-policy-id" class="gov-input" /></label>' +
      '<label>Test Data (JSON): <textarea id="sim-data" class="gov-input" rows="5"></textarea></label>' +
      '<button class="gov-btn primary" onclick="GovernanceCenter.runSimulation()">Run Simulation</button>' +
      '<div id="sim-results"></div></div>';
  },

  renderReports: function() {
    return '<div class="gov-empty">Reports module</div>';
  },

  switchTab: function(tab) {
    this.currentTab = tab;
    this.render();
  },

  approveRequest: async function(id) {
    try {
      var r = await fetch('/api/v1/governance/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: id }) });
      if (r.ok) this.loadData();
    } catch (e) { console.error(e); }
  },

  rejectRequest: async function(id) {
    try {
      var r = await fetch('/api/v1/governance/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: id, rejected: true }) });
      if (r.ok) this.loadData();
    } catch (e) { console.error(e); }
  },

  runSimulation: async function() {
    var policyId = document.getElementById('sim-policy-id') ? document.getElementById('sim-policy-id').value : '';
    var dataRaw = document.getElementById('sim-data') ? document.getElementById('sim-data').value : '{}';
    var data = {};
    try { data = JSON.parse(dataRaw); } catch (e) { data = {}; }
    try {
      var r = await fetch('/api/v1/governance/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ policyId: policyId, data: data }) });
      var result = await r.json();
      var el = document.getElementById('sim-results');
      if (el) el.innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
    } catch (e) { console.error(e); }
  },

  runComplianceScan: async function() {
    try {
      await fetch('/api/v1/governance/compliance/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      this.loadData();
    } catch (e) { console.error(e); }
  },

  viewPolicy: function(id) {
    this.currentTab = 'policies';
    this.render();
  },

  createContainer: function() {
    var div = document.createElement('div');
    div.id = 'governance-center';
    div.className = 'governance-center';
    document.body.appendChild(div);
    return div;
  }
};
