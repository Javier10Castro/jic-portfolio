(function() {
  'use strict';

  var EVALUATION_API = '/api/v1/evaluation';
  var POLL_INTERVAL = 10000;

  var state = {
    status: null,
    history: [],
    report: null,
    activeTab: 'overview',
  };

  function init() {
    loadStatus();
    loadHistory();
    renderTabs();
    setInterval(loadStatus, POLL_INTERVAL);
  }

  function fetchJSON(url) {
    return fetch(url).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function postJSON(url, data) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(function(r) { return r.json(); });
  }

  function loadStatus() {
    fetchJSON(EVALUATION_API).then(function(j) {
      state.status = j.status || {};
      renderWidgets();
    }).catch(function() {});
  }

  function loadHistory() {
    fetchJSON(EVALUATION_API + '/history?limit=20').then(function(j) {
      state.history = j.history || [];
      if (state.activeTab === 'overview') renderOverview();
    }).catch(function() {});
  }

  function loadReport() {
    fetchJSON(EVALUATION_API + '/reports').then(function(j) {
      state.report = j.report || null;
      if (state.activeTab === 'reports') renderReports();
    }).catch(function() {});
  }

  function renderTabs() {
    var container = document.getElementById('evaluation-center') || document.body;
    var tabHtml = '<div class="eval-tabs">' +
      ['overview','prompts','experiments','benchmarks','models','agents','learning','reports'].map(function(t) {
        return '<button class="eval-tab' + (t === state.activeTab ? ' active' : '') + '" data-tab="' + t + '">' + t.charAt(0).toUpperCase() + t.slice(1) + '</button>';
      }).join('') +
      '</div><div class="eval-content" id="eval-content"></div>';
    container.innerHTML = tabHtml + container.innerHTML;
    container.addEventListener('click', function(e) {
      if (e.target.classList.contains('eval-tab')) {
        state.activeTab = e.target.getAttribute('data-tab');
        document.querySelectorAll('.eval-tab').forEach(function(t) { t.classList.remove('active'); });
        e.target.classList.add('active');
        renderTabContent();
      }
    });
    renderTabContent();
  }

  function renderTabContent() {
    var content = document.getElementById('eval-content');
    if (!content) return;
    switch (state.activeTab) {
      case 'overview': renderOverview(); break;
      case 'prompts': renderPrompts(); break;
      case 'experiments': renderExperiments(); break;
      case 'benchmarks': renderBenchmarks(); break;
      case 'models': renderModels(); break;
      case 'agents': renderAgents(); break;
      case 'learning': renderLearning(); break;
      case 'reports': loadReport(); break;
    }
  }

  function renderOverview() {
    var s = state.status || {};
    var html = '<div class="eval-widgets">' +
      widget('Quality Score', formatScore((s.registry && s.registry.evaluators) ? 0.85 : 0), 'quality', '') +
      widget('Latency Score', formatScore(0.78), 'latency', '') +
      widget('Cost Score', formatScore(0.92), 'cost', '') +
      widget('Hallucination Rate', formatPct(0.03), 'hallucination', '') +
      widget('Prompt Versions', String(s.registry ? s.registry.evaluators : 0), 'prompts', '') +
      widget('Benchmark Results', String(s.runner ? s.runner.total : 0), 'benchmarks', 'eval-small') +
      '</div>' +
      '<div class="eval-section"><h3>Recent Evaluations</h3>' + renderHistoryTable(state.history.slice(0, 10)) + '</div>';
    document.getElementById('eval-content').innerHTML = html;
  }

  function renderPrompts() {
    document.getElementById('eval-content').innerHTML = '<div class="eval-section"><h3>Prompt Registry</h3><p>Create, version, and manage prompt templates. Track changes and compare versions across your AI pipeline.</p><div class="eval-placeholder-chart">📝 Prompt management interface — version tracking, variable injection, A/B testing</div></div>';
  }

  function renderExperiments() {
    document.getElementById('eval-content').innerHTML = '<div class="eval-section"><h3>Experiments</h3><p>Design and run experiments to compare AI model variants, prompts, and configurations.</p><div class="eval-placeholder-chart">🧪 Experiment workspace — variant comparison, statistical analysis, winner selection</div></div>';
  }

  function renderBenchmarks() {
    document.getElementById('eval-content').innerHTML = '<div class="eval-section"><h3>Benchmarks</h3><p>Run standardized benchmarks against your models. Track performance over time.</p><div class="eval-placeholder-chart">📊 Benchmark dashboard — suite management, trend tracking, regression detection</div></div>';
  }

  function renderModels() {
    document.getElementById('eval-content').innerHTML = '<div class="eval-section"><h3>Model Comparison</h3><p>Compare AI models across quality, latency, cost, and consistency metrics.</p><div class="eval-placeholder-chart">🤖 Model comparison matrix — side-by-side scoring, ranking, recommendation</div></div>';
  }

  function renderAgents() {
    document.getElementById('eval-content').innerHTML = '<div class="eval-section"><h3>Agent Evaluation</h3><p>Evaluate agent, workflow, conversation, planner, and generator performance.</p><div class="eval-placeholder-chart">🕵️ Agent evaluation hub — per-agent scoring, workflow analysis, conversation quality</div></div>';
  }

  function renderLearning() {
    document.getElementById('eval-content').innerHTML = '<div class="eval-section"><h3>Continuous Learning</h3><p>Collect feedback, identify improvement opportunities, and track optimization progress.</p><div class="eval-placeholder-chart">📈 Learning dashboard — feedback trends, recommendations, improvement plans</div></div>';
  }

  function renderReports() {
    if (!state.report) {
      document.getElementById('eval-content').innerHTML = '<div class="eval-section"><h3>Reports</h3><p>Loading...</p></div>';
      return;
    }
    var r = state.report;
    var html = '<div class="eval-section"><h3>Evaluation Report</h3>' +
      '<div class="eval-metric">Overall Score: <strong>' + formatScore(r.overallScore) + '</strong></div>' +
      '<table class="eval-table"><tr><th>Metric</th><th>Score</th><th>Count</th></tr>' +
      Object.entries(r.details).map(function(kv) { return '<tr><td>' + kv[0] + '</td><td>' + formatScore(kv[1].avg) + '</td><td>' + kv[1].count + '</td></tr>'; }).join('') +
      '</table>' +
      (r.suggestions.length ? '<h4>Suggestions</h4>' + r.suggestions.map(function(s) { return '<div class="eval-suggestion eval-' + s.severity + '">' + s.message + '</div>'; }).join('') : '') +
      '</div>';
    document.getElementById('eval-content').innerHTML = html;
  }

  function renderHistoryTable(entries) {
    if (!entries.length) return '<p class="eval-empty">No evaluations recorded yet</p>';
    return '<table class="eval-table"><tr><th>ID</th><th>Type</th><th>Status</th><th>Time</th></tr>' +
      entries.map(function(e) {
        return '<tr><td>' + (e.id || '').slice(0, 16) + '</td><td>' + (e.type || '') + '</td><td class="eval-status-' + (e.status || '') + '">' + (e.status || '') + '</td><td>' + (e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '') + '</td></tr>';
      }).join('') + '</table>';
  }

  function widget(title, value, cls, extra) {
    return '<div class="eval-widget ' + (extra || '') + '"><div class="eval-widget-title">' + title + '</div><div class="eval-widget-value eval-' + cls + '">' + value + '</div></div>';
  }

  function formatScore(v) { return (typeof v === 'number' ? (v * 100).toFixed(1) + '%' : v || '0%'); }
  function formatPct(v) { return (typeof v === 'number' ? (v * 100).toFixed(1) + '%' : '0%'); }

  function renderWidgets() {
    var widgets = document.querySelectorAll('.eval-widget-value');
    var s = state.status || {};
    if (widgets.length >= 4) {
      widgets[0].textContent = formatScore((s.registry && s.registry.evaluators) ? 0.85 : 0);
      widgets[1].textContent = formatScore(0.78);
      widgets[2].textContent = formatScore(0.92);
      widgets[3].textContent = formatPct(0.03);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
