const fs = require('fs');
const path = require('path');
const { DashboardLayout } = require('../dashboard/layouts/DashboardLayout');
const { StatsCard } = require('../dashboard/components/StatsCard');
const css = fs.readFileSync(path.join(__dirname, 'controlPlane.css'), 'utf-8');

function _safe(fn) {
  try { return fn(); } catch (e) { return null; }
}

function _getTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function _severityClass(sev) {
  const s = (sev || 'low').toLowerCase();
  if (s === 'critical') return 'cp-severity-critical';
  if (s === 'high') return 'cp-severity-high';
  if (s === 'medium') return 'cp-severity-medium';
  return 'cp-severity-low';
}

function _eventTypeClass(type) {
  if (!type) return '';
  const t = type.toLowerCase();
  if (t.includes('insight') || t.includes('intelligence')) return 'insight';
  if (t.includes('pattern')) return 'pattern';
  if (t.includes('anomaly')) return 'anomaly';
  if (t.includes('remediation') || t.includes('action')) return 'remediation';
  if (t.includes('cluster') || t.includes('worker')) return 'cluster';
  if (t.includes('system')) return 'system';
  return '';
}

function renderControlPlane(params = {}) {
  const overview = _safe(() => {
    const { getEventStore, getIntelligenceEngine } = require('../../lib/events');
    const { getRemediationEngine } = require('../../lib/remediation');
    const { getClusterManager } = require('../../lib/cluster');
    const { getWorkflowManager } = require('../../lib/workflows');
    const events = getEventStore ? getEventStore().getAll() : [];
    const intel = getIntelligenceEngine ? getIntelligenceEngine().getHealth() : {};
    const remed = getRemediationEngine ? getRemediationEngine().getHealth() : {};
    const cm = getClusterManager ? getClusterManager() : null;
    const wm = getWorkflowManager ? getWorkflowManager() : null;
    return { events, intel, remed, cm, wm };
  }) || {};

  const html = `
    <style>${css}</style>
    <div class="cp-container">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-sm)">
        <h2 style="margin:0;font-size:var(--font-size-xl);font-weight:700">Control Plane</h2>
        <span style="font-size:var(--font-size-xs);color:var(--color-text-muted)" id="cp-last-update">Live</span>
      </div>

      <div class="cp-metrics-grid">
        ${StatsCard({ label: 'Events Processed', value: overview.intel?.totalProcessed ?? '—', change: null })}
        ${StatsCard({ label: 'Active Insights', value: overview.intel?.insightCount ?? '—', change: null })}
        ${StatsCard({ label: 'Anomalies', value: overview.intel?.anomalyCount ?? '—', change: null })}
        ${StatsCard({ label: 'Patterns', value: overview.intel?.patternCount ?? '—', change: null })}
        ${StatsCard({ label: 'Remed. Actions', value: overview.remed?.totalExecuted ?? '—', change: null })}
        ${StatsCard({ label: 'Pending Approvals', value: overview.remed?.pendingApprovals ?? '—', change: null })}
        ${StatsCard({ label: 'Workers', value: overview.cm?.workers?.length ?? '—', change: null })}
        ${StatsCard({ label: 'Workflows', value: overview.wm?.workflows?.length ?? '—', change: null })}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--spacing-md)">
        <div class="cp-widget" id="cp-event-stream">
          <div class="cp-widget-header">
            <h3>Event Stream</h3>
            <div style="display:flex;gap:var(--spacing-sm);align-items:center">
              <span class="cp-status-dot cp-status-healthy" id="cp-sse-indicator"></span>
              <span style="font-size:var(--font-size-xs);color:var(--color-text-muted)" id="cp-sse-status">Connected</span>
            </div>
          </div>
          <div class="cp-widget-body" id="cp-events-list">
            <div class="cp-empty">Waiting for events...</div>
          </div>
        </div>

        <div class="cp-widget" id="cp-insights">
          <div class="cp-widget-header">
            <h3>Intelligence Insights</h3>
            <a class="cp-action-btn" data-page="observability" href="#observability">View All</a>
          </div>
          <div class="cp-widget-body" id="cp-insights-list">
            ${_renderInsights(overview.intel)}
          </div>
        </div>

        <div class="cp-widget" id="cp-anomalies">
          <div class="cp-widget-header">
            <h3>Anomaly Detection</h3>
          </div>
          <div class="cp-widget-body" id="cp-anomalies-list">
            ${_renderAnomalies(overview.intel)}
          </div>
        </div>

        <div class="cp-widget" id="cp-remediation">
          <div class="cp-widget-header">
            <h3>Remediation Actions</h3>
            <a class="cp-action-btn" data-page="controlPlane" data-action="refresh-remediation" href="#">Refresh</a>
          </div>
          <div class="cp-widget-body" id="cp-remediation-list">
            ${_renderRemediation()}
          </div>
        </div>

        <div class="cp-widget" id="cp-cluster">
          <div class="cp-widget-header">
            <h3>Cluster Health</h3>
          </div>
          <div class="cp-widget-body" id="cp-cluster-content">
            ${_renderCluster(overview.cm)}
          </div>
        </div>

        <div class="cp-widget" id="cp-workflows">
          <div class="cp-widget-header">
            <h3>Workflow Executions</h3>
            <a class="cp-action-btn" data-page="workflows" href="#workflows">View All</a>
          </div>
          <div class="cp-widget-body" id="cp-workflows-list">
            ${_renderWorkflows(overview.wm)}
          </div>
        </div>
      </div>

      <div class="cp-widget" id="cp-policies">
        <div class="cp-widget-header">
          <h3>Remediation Policies</h3>
        </div>
        <div class="cp-widget-body" id="cp-policies-list">
          ${_renderPolicies()}
        </div>
      </div>
    </div>

    <script>
    (function() {
      var eventSource = null;
      var eventsList = document.getElementById('cp-events-list');
      var sseIndicator = document.getElementById('cp-sse-indicator');
      var sseStatus = document.getElementById('cp-sse-status');

      function connectSSE() {
        if (eventSource) { eventSource.close(); }
        eventSource = new EventSource('/api/v1/control-plane/events/stream');

        eventSource.onopen = function() {
          if (sseIndicator) sseIndicator.className = 'cp-status-dot cp-status-healthy';
          if (sseStatus) sseStatus.textContent = 'Connected';
        };

        eventSource.addEventListener('event', function(e) {
          try {
            var data = JSON.parse(e.data);
            addEventToStream(data);
          } catch(err) {}
        });

        eventSource.onerror = function() {
          if (sseIndicator) sseIndicator.className = 'cp-status-dot cp-status-unhealthy';
          if (sseStatus) sseStatus.textContent = 'Disconnected';
          setTimeout(connectSSE, 5000);
        };
      }

      function addEventToStream(data) {
        if (!eventsList) return;
        var empty = eventsList.querySelector('.cp-empty');
        if (empty) eventsList.innerHTML = '';

        var severity = data.severity || 'info';
        var type = data.type || 'unknown';
        var time = data.timestamp ? new Date(data.timestamp).toLocaleTimeString('en-US', {hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '';
        var summary = '';
        if (data.payload) {
          if (data.payload.insight) summary = data.payload.insight.substring(0,80);
          else if (data.payload.message) summary = data.payload.message.substring(0,80);
          else summary = JSON.stringify(data.payload).substring(0,80);
        }

        var row = document.createElement('div');
        row.className = 'cp-event-row';
        row.innerHTML = '<span class="cp-event-time">' + time + '</span>' +
          '<span class="cp-event-type ' + _getTypeClass(type) + '">' + escapeHtml(type) + '</span>' +
          '<span class="cp-severity-badge ' + _getSeverityClass(severity) + '">' + severity + '</span>' +
          '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(summary) + '</span>';
        eventsList.insertBefore(row, eventsList.firstChild);

        var rows = eventsList.querySelectorAll('.cp-event-row');
        if (rows.length > 200) { rows[rows.length - 1].remove(); }
      }

      function _getTypeClass(type) {
        if (!type) return '';
        var t = type.toLowerCase();
        if (t.includes('insight') || t.includes('intelligence')) return 'insight';
        if (t.includes('pattern')) return 'pattern';
        if (t.includes('anomaly')) return 'anomaly';
        if (t.includes('remediation') || t.includes('action')) return 'remediation';
        if (t.includes('cluster') || t.includes('worker')) return 'cluster';
        return '';
      }

      function _getSeverityClass(sev) {
        var s = (sev || 'low').toLowerCase();
        if (s === 'critical') return 'cp-severity-critical';
        if (s === 'high') return 'cp-severity-high';
        if (s === 'medium') return 'cp-severity-medium';
        return 'cp-severity-low';
      }

      function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }

      function loadInsights() {
        fetch('/api/v1/control-plane/insights?limit=10').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var el = document.getElementById('cp-insights-list');
          if (!el) return;
          var items = json.data || [];
          if (items.length === 0) {
            el.innerHTML = '<div class="cp-empty">No insights detected</div>';
            return;
          }
          el.innerHTML = items.map(function(i) {
            var sev = (i.priority || 'low').toLowerCase();
            return '<div class="cp-event-row">' +
              '<span class="cp-event-type insight">' + escapeHtml(i.rule || 'insight') + '</span>' +
              '<span class="cp-severity-badge ' + _getSeverityClass(sev) + '">' + sev + '</span>' +
              '<span style="flex:1;font-size:var(--font-size-xs)">' + escapeHtml(i.insight || i.recommendation || '') + '</span></div>';
          }).join('');
        }).catch(function(){});
      }

      function loadAnomalies() {
        fetch('/api/v1/control-plane/anomalies?limit=10').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var el = document.getElementById('cp-anomalies-list');
          if (!el) return;
          var items = json.data || [];
          if (items.length === 0) {
            el.innerHTML = '<div class="cp-empty">No anomalies detected</div>';
            return;
          }
          el.innerHTML = items.map(function(a) {
            var sev = (a.severity || 'medium').toLowerCase();
            return '<div class="cp-event-row">' +
              '<span class="cp-event-type anomaly">' + escapeHtml(a.type || 'anomaly') + '</span>' +
              '<span class="cp-severity-badge ' + _getSeverityClass(sev) + '">' + sev + '</span>' +
              '<span style="flex:1;font-size:var(--font-size-xs)">z=' + (a.zScore ? a.zScore.toFixed(1) : 'N/A') + ' ' + escapeHtml(a.detail ? (a.detail.source || '') : '') + '</span></div>';
          }).join('');
        }).catch(function(){});
      }

      function loadRemediation() {
        fetch('/api/v1/control-plane/remediation/history?limit=10').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var el = document.getElementById('cp-remediation-list');
          if (!el) return;
          var items = json.data || [];
          if (items.length === 0) {
            el.innerHTML = '<div class="cp-empty">No remediation actions taken</div>';
            return;
          }
          el.innerHTML = items.map(function(h) {
            var statusClass = h.success ? 'cp-status-healthy' : 'cp-status-unhealthy';
            return '<div class="cp-event-row">' +
              '<span class="cp-event-type remediation">' + escapeHtml(h.action || '—') + '</span>' +
              '<span class="cp-status-dot ' + statusClass + '" style="margin-top:4px"></span>' +
              '<span style="flex:1;font-size:var(--font-size-xs)">' + escapeHtml(h.message || '') + '</span></div>';
          }).join('');
        }).catch(function(){});
      }

      function loadPolicies() {
        fetch('/api/v1/control-plane/remediation/policies').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var el = document.getElementById('cp-policies-list');
          if (!el) return;
          var items = json.data || [];
          if (items.length === 0) {
            el.innerHTML = '<div class="cp-empty">No policies configured</div>';
            return;
          }
          el.innerHTML = items.map(function(p) {
            return '<div class="cp-policy-row" style="display:flex;justify-content:space-between;align-items:center">' +
              '<div><div class="cp-policy-name">' + escapeHtml(p.name || p.id) + '</div>' +
              '<div class="cp-policy-meta">Action: ' + escapeHtml(p.action || '—') + ' | Cooldown: ' + (p.safety ? p.safety.cooldownMs/1000 + 's' : '—') + ' | Max/hr: ' + (p.safety ? p.safety.maxActionsPerHour : '—') + '</div></div>' +
              '<div style="display:flex;align-items:center;gap:8px">' +
              (p.safety && p.safety.requiresApproval ? '<span style="font-size:10px;color:var(--color-warning)">APPROVAL</span>' : '') +
              '<button class="cp-toggle' + (p.enabled ? ' active' : '') + '" data-policy-id="' + escapeHtml(p.id) + '" data-action="toggle-policy"></button></div></div>';
          }).join('');
        }).catch(function(){});
      }

      function loadCluster() {
        fetch('/api/v1/control-plane/cluster').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var el = document.getElementById('cp-cluster-content');
          if (!el) return;
          var d = json.data;
          if (!d || !d.available) {
            el.innerHTML = '<div class="cp-empty">Cluster not available</div>';
            return;
          }
          el.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm)">' +
            '<div class="cp-metric-card"><div class="cp-metric-value" style="font-size:var(--font-size-lg)">' + d.workerCount + '</div><div class="cp-metric-label">Total Workers</div></div>' +
            '<div class="cp-metric-card"><div class="cp-metric-value" style="font-size:var(--font-size-lg);color:#22c55e">' + d.healthyWorkers + '</div><div class="cp-metric-label">Healthy</div></div>' +
            '</div>' +
            (d.leaderId ? '<div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Leader: ' + escapeHtml(d.leaderId) + '</div>' : '') +
            (d.workers && d.workers.length > 0 ? '<div style="margin-top:8px">' + d.workers.slice(0,10).map(function(w) {
              var s = (w.status || 'idle').toLowerCase();
              return '<div style="display:flex;justify-content:space-between;font-size:var(--font-size-xs);padding:4px 0;border-bottom:1px solid var(--color-border-subtle)">' +
                '<span>' + escapeHtml(w.id || w.name || 'worker') + '</span>' +
                '<span><span class="cp-status-dot cp-status-' + s + '"></span>' + s + '</span></div>';
            }).join('') + '</div>' : '<div class="cp-empty">No workers</div>');
        }).catch(function(){});
      }

      function loadWorkflows() {
        fetch('/api/v1/control-plane/workflows').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var el = document.getElementById('cp-workflows-list');
          if (!el) return;
          var d = json.data;
          if (!d || !d.available) {
            el.innerHTML = '<div class="cp-empty">Workflows not available</div>';
            return;
          }
          el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:var(--spacing-sm);margin-bottom:var(--spacing-sm)">' +
            '<div class="cp-metric-card"><div class="cp-metric-value" style="font-size:var(--font-size-lg)">' + d.total + '</div><div class="cp-metric-label">Total</div></div>' +
            '<div class="cp-metric-card"><div class="cp-metric-value" style="font-size:var(--font-size-lg);color:#3b82f6">' + d.byStatus.running + '</div><div class="cp-metric-label">Running</div></div>' +
            '<div class="cp-metric-card"><div class="cp-metric-value" style="font-size:var(--font-size-lg);color:#22c55e">' + d.byStatus.completed + '</div><div class="cp-metric-label">Completed</div></div>' +
            '<div class="cp-metric-card"><div class="cp-metric-value" style="font-size:var(--font-size-lg);color:#ef4444">' + d.byStatus.failed + '</div><div class="cp-metric-label">Failed</div></div>' +
            '<div class="cp-metric-card"><div class="cp-metric-value" style="font-size:var(--font-size-lg);color:#eab308">' + d.byStatus.queued + '</div><div class="cp-metric-label">Queued</div></div>' +
            '</div>' +
            (d.recent && d.recent.length > 0 ? d.recent.map(function(wf) {
              var s = (wf.status || '').toLowerCase();
              return '<div style="display:flex;justify-content:space-between;font-size:var(--font-size-xs);padding:4px 0;border-bottom:1px solid var(--color-border-subtle)">' +
                '<span>' + escapeHtml(wf.id || wf.name || 'wf') + '</span>' +
                '<span><span class="cp-status-dot cp-status-' + s + '"></span>' + s + '</span></div>';
            }).join('') : '<div class="cp-empty">No recent workflows</div>');
        }).catch(function(){});
      }

      document.addEventListener('click', function(e) {
        var toggle = e.target.closest('[data-action="toggle-policy"]');
        if (toggle) {
          var id = toggle.dataset.policyId;
          var isActive = toggle.classList.contains('active');
          toggle.classList.toggle('active');
          fetch('/api/v1/control-plane/remediation/policies', {
            method: 'PUT',
            body: JSON.stringify({ enabled: !isActive }),
            headers: { 'Content-Type': 'application/json' }
          }).catch(function(){});
        }
        var refresh = e.target.closest('[data-action="refresh-remediation"]');
        if (refresh) { loadRemediation(); loadPolicies(); }
      });

      connectSSE();
      setInterval(loadInsights, 10000);
      setInterval(loadAnomalies, 10000);
      setInterval(loadRemediation, 15000);
      setInterval(loadPolicies, 30000);
      setInterval(loadCluster, 15000);
      setInterval(loadWorkflows, 15000);
      setTimeout(function(){ loadInsights(); loadAnomalies(); loadRemediation(); loadPolicies(); loadCluster(); loadWorkflows(); }, 500);
    })();
    </script>
  `;

  return DashboardLayout({
    activePage: 'controlPlane',
    breadcrumbs: ['Control Plane'],
    children: html,
    userName: params.userName,
    workspaceName: params.workspaceName,
  });
}

function _renderInsights(intel) {
  if (!intel || !intel.insightCount) return '<div class="cp-empty">No insights detected</div>';
  return `<div class="cp-empty">${intel.insightCount} insights recorded (view via live updates)</div>`;
}

function _renderAnomalies(intel) {
  if (!intel || !intel.anomalyCount) return '<div class="cp-empty">No anomalies detected</div>';
  return `<div class="cp-empty">${intel.anomalyCount} anomalies recorded (view via live updates)</div>`;
}

function _renderRemediation() {
  return '<div class="cp-empty">Loading remediation history...</div>';
}

function _renderCluster(cm) {
  if (!cm || !cm.workers) return '<div class="cp-empty">Cluster not available</div>';
  const healthy = cm.workers.filter(w => w.status === 'healthy').length;
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--spacing-sm)">
      <div class="cp-metric-card"><div class="cp-metric-value" style="font-size:var(--font-size-lg)">${cm.workers.length}</div><div class="cp-metric-label">Total Workers</div></div>
      <div class="cp-metric-card"><div class="cp-metric-value" style="font-size:var(--font-size-lg);color:#22c55e">${healthy}</div><div class="cp-metric-label">Healthy</div></div>
    </div>
  `;
}

function _renderWorkflows(wm) {
  if (!wm || !wm.workflows) return '<div class="cp-empty">Workflows not available</div>';
  return '<div class="cp-empty">Loading workflow data...</div>';
}

function _renderPolicies() {
  return '<div class="cp-empty">Loading policies...</div>';
}

module.exports = { renderControlPlane };
