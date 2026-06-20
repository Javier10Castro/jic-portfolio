const fs = require('fs');
const path = require('path');
const { DashboardLayout } = require('../dashboard/layouts/DashboardLayout');
const { StatsCard } = require('../dashboard/components/StatsCard');
const css = fs.readFileSync(path.join(__dirname, 'cost.css'), 'utf-8');
const cpCss = fs.readFileSync(path.join(__dirname, 'controlPlane.css'), 'utf-8');

function renderCostOverview(params = {}) {
  const html = `
    <style>${cpCss}${css}</style>
    <div class="cp-container">
      <h2 style="margin:0 0 var(--spacing-md);font-size:var(--font-size-xl);font-weight:700">Cost Optimization</h2>

      <div class="cost-tabs" role="tablist">
        <button class="cost-tab active" role="tab" data-tab="overview">Overview</button>
        <button class="cost-tab" role="tab" data-tab="budgets">Budgets</button>
        <button class="cost-tab" role="tab" data-tab="forecast">Forecast</button>
        <button class="cost-tab" role="tab" data-tab="optimization">Optimization Center</button>
        <button class="cost-tab" role="tab" data-tab="quotas">Usage Explorer</button>
      </div>

      <div class="cost-tab-content active" id="tab-overview">
        <div class="cost-summary-grid" id="cost-metrics">
          ${StatsCard({ label: 'Total Cost (MTD)', value: '$—' })}
          ${StatsCard({ label: 'Projected Monthly', value: '$—' })}
          ${StatsCard({ label: 'Savings Opportunity', value: '$—' })}
          ${StatsCard({ label: 'Active Recommendations', value: '—' })}
          ${StatsCard({ label: 'Budget Alerts', value: '—' })}
          ${StatsCard({ label: 'Quota Exceeded', value: '—' })}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--spacing-md)">
          <div class="cp-widget"><div class="cp-widget-header"><h3>Provider Breakdown</h3></div><div class="cp-widget-body" id="cost-provider-breakdown"><div class="cp-empty">Loading...</div></div></div>
          <div class="cp-widget"><div class="cp-widget-header"><h3>Cost by Category</h3></div><div class="cp-widget-body" id="cost-by-category"><div class="cp-empty">Loading...</div></div></div>
          <div class="cp-widget"><div class="cp-widget-header"><h3>Recent Recommendations</h3></div><div class="cp-widget-body" id="cost-recommendations"><div class="cp-empty">Loading...</div></div></div>
          <div class="cp-widget"><div class="cp-widget-header"><h3>Budget Status</h3></div><div class="cp-widget-body" id="cost-budget-status"><div class="cp-empty">Loading...</div></div></div>
        </div>
      </div>

      <div class="cost-tab-content" id="tab-budgets">
        <div class="cp-widget"><div class="cp-widget-header"><h3>Budgets</h3></div><div class="cp-widget-body" id="cost-budgets-list"><div class="cp-empty">Loading budgets...</div></div></div>
        <div style="margin-top:var(--spacing-md)" class="cp-widget"><div class="cp-widget-header"><h3>Budget Alerts</h3></div><div class="cp-widget-body" id="cost-budget-alerts"><div class="cp-empty">Loading alerts...</div></div></div>
      </div>

      <div class="cost-tab-content" id="tab-forecast">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--spacing-md);margin-bottom:var(--spacing-md)" id="cost-forecast-metrics">
          ${StatsCard({ label: 'Avg Daily Cost', value: '$—' })}
          ${StatsCard({ label: 'Projected Monthly', value: '$—' })}
          ${StatsCard({ label: 'Projected Quarterly', value: '$—' })}
          ${StatsCard({ label: 'Projected Yearly', value: '$—' })}
        </div>
        <div class="cp-widget"><div class="cp-widget-header"><h3>Forecast Details</h3></div><div class="cp-widget-body" id="cost-forecast-detail"><div class="cp-empty">No forecast data yet</div></div></div>
      </div>

      <div class="cost-tab-content" id="tab-optimization">
        <div class="cost-summary-grid" id="cost-optimization-metrics">
          ${StatsCard({ label: 'Total Potential Savings', value: '$—' })}
          ${StatsCard({ label: 'Provider Changes', value: '—' })}
          ${StatsCard({ label: 'Model Changes', value: '—' })}
          ${StatsCard({ label: 'Cache Opportunities', value: '—' })}
        </div>
        <div class="cp-widget"><div class="cp-widget-header"><h3>Optimization Suggestions</h3></div><div class="cp-widget-body" id="cost-optimization-list"><div class="cp-empty">Loading optimization suggestions...</div></div></div>
        <div style="margin-top:var(--spacing-md)" class="cp-widget"><div class="cp-widget-header"><h3>Cost Policies</h3></div><div class="cp-widget-body" id="cost-policies-list"><div class="cp-empty">Loading policies...</div></div></div>
      </div>

      <div class="cost-tab-content" id="tab-quotas">
        <div class="cp-widget"><div class="cp-widget-header"><h3>Daily Quota Usage</h3></div><div class="cp-widget-body" id="cost-quotas-daily"><div class="cp-empty">Loading quota data...</div></div></div>
        <div style="margin-top:var(--spacing-md)" class="cp-widget"><div class="cp-widget-header"><h3>Monthly Quota Usage</h3></div><div class="cp-widget-body" id="cost-quotas-monthly"><div class="cp-empty">Loading quota data...</div></div></div>
      </div>
    </div>

    <script>
    (function(){
      var activeTab = 'overview';

      document.addEventListener('click', function(e) {
        var tab = e.target.closest('[role="tab"]');
        if (tab) {
          var tabId = tab.dataset.tab;
          document.querySelectorAll('[role="tab"]').forEach(function(t){t.classList.remove('active')});
          tab.classList.add('active');
          document.querySelectorAll('.cost-tab-content').forEach(function(tc){tc.classList.remove('active')});
          var target = document.getElementById('tab-' + tabId);
          if (target) target.classList.add('active');
          activeTab = tabId;
        }
      });

      function fmt(n) { return n !== undefined && n !== null ? '$' + Number(n).toFixed(2) : '$—'; }
      function num(n) { return n !== undefined && n !== null ? n : '—'; }

      function loadSummary() {
        fetch('/api/v1/cost/summary').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var d = json.data || {};
          var el = document.getElementById('cost-metrics');
          if (el) {
            el.innerHTML = '${StatsCard({ label: 'Total Cost (MTD)', value: '\'+fmt(d.totalCost)+\'' })}' +
              '${StatsCard({ label: 'Projected Monthly', value: '\'+fmt(d.projectedCost)+\'' })}' +
              '${StatsCard({ label: 'Savings Opportunity', value: '\'+fmt(d.savingsOpportunity)+\'' })}' +
              '${StatsCard({ label: 'Active Recommendations', value: '\'+(d.recommendations?d.recommendations.length:\'—\')+\'' })}' +
              '${StatsCard({ label: 'Budget Alerts', value: '\'+(d.alerts?d.alerts.length:\'—\')+\'' })}' +
              '${StatsCard({ label: 'Quota Exceeded', value: '\'+(d.quotaUsage&&d.quotaUsage.hasExceededQuota?\'Yes\':\'No\')+\'' })}';
          }
          var el2 = document.getElementById('cost-provider-breakdown');
          if (el2) {
            var pb = d.providerBreakdown || [];
            if (pb.length === 0) { el2.innerHTML = '<div class="cp-empty">No provider data</div>'; }
            else {
              var total = pb.reduce(function(s,b){return s+b.cost},0);
              el2.innerHTML = '<table class="cost-table"><tr><th>Provider/Model</th><th>Tokens</th><th>Cost</th><th>%</th></tr>' +
                pb.map(function(b){ return '<tr><td>'+escapeHtml(b.provider)+'/'+escapeHtml(b.model)+'</td><td>'+num(b.inputTokens+b.outputTokens)+'</td><td>'+fmt(b.cost)+'</td><td><div class="cost-bar"><div class="cost-bar-fill" style="width:'+(total>0?(b.cost/total*100):0)+'%;background:var(--color-accent)"></div></div></td></tr>' }).join('') + '</table>';
            }
          }
          var el3 = document.getElementById('cost-by-category');
          if (el3) {
            var snap = d.snapshot || {};
            var categories = [];
            if (snap.ai) categories.push({label:'AI Providers',cost:snap.ai.totalCost});
            if (snap.cluster) categories.push({label:'Cluster',cost:snap.cluster.estimatedDailyCost||0});
            if (snap.workflows) categories.push({label:'Workflows',cost:snap.workflows.totalCost});
            if (snap.deployments) categories.push({label:'Deployments',cost:snap.deployments.totalCost});
            var totalCat = categories.reduce(function(s,c){return s+c.cost},0);
            el3.innerHTML = categories.length > 0 ? categories.map(function(c){
              var pct = totalCat>0 ? Math.round(c.cost/totalCat*100) : 0;
              return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--color-border-subtle);font-size:var(--font-size-xs)"><span>'+escapeHtml(c.label)+'</span><span>'+fmt(c.cost)+' ('+pct+'%)</span></div>';
            }).join('') : '<div class="cp-empty">No cost data</div>';
          }
          var el4 = document.getElementById('cost-recommendations');
          if (el4) {
            var recs = d.recommendations || [];
            if (recs.length === 0) el4.innerHTML = '<div class="cp-empty">No active recommendations</div>';
            else el4.innerHTML = recs.slice(0,10).map(function(r){
              var imp = (r.impact||'low').toLowerCase();
              return '<div class="cp-event-row"><span class="cost-badge cost-badge-'+imp+'">'+imp+'</span><span style="flex:1;font-size:var(--font-size-xs)">'+escapeHtml(r.title||r.description||'')+'</span><span style="font-size:var(--font-size-xs);color:var(--color-text-muted)">'+fmt(r.expectedSavings)+'</span></div>';
            }).join('');
          }
          var el5 = document.getElementById('cost-budget-status');
          if (el5) {
            var bs = d.budgetStatus || {};
            var daily = bs.daily || {total:0};
            var monthly = bs.monthly || {total:0};
            el5.innerHTML = '<div style="font-size:var(--font-size-xs)"><div style="display:flex;justify-content:space-between;padding:4px 0"><span>Daily Spend</span><span>'+fmt(daily.total)+'</span></div><div style="display:flex;justify-content:space-between;padding:4px 0"><span>Monthly Spend</span><span>'+fmt(monthly.total)+'</span></div><div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid var(--color-border-subtle);font-weight:600"><span>Alerts ('+(d.alerts?d.alerts.length:0)+')</span></div></div>';
          }
        }).catch(function(){});
      }

      function loadBudgets() {
        fetch('/api/v1/cost/budgets').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var d = json.data || {};
          var budgets = d.budgets || [];
          var el = document.getElementById('cost-budgets-list');
          if (el) {
            if (budgets.length === 0) el.innerHTML = '<div class="cp-empty">No budgets configured</div>';
            else el.innerHTML = budgets.map(function(b){
              return '<div class="cp-policy-row" style="display:flex;justify-content:space-between;align-items:center"><div><div class="cp-policy-name">'+escapeHtml(b.name||b.id)+'</div><div class="cp-policy-meta">'+escapeHtml(b.scope||'')+' | '+escapeHtml(b.period||'')+' | Soft: '+fmt(b.softLimit)+' | Hard: '+fmt(b.hardLimit)+'</div></div><button class="cost-toggle'+(b.enabled?' active':'')+'" data-budget-id="'+escapeHtml(b.id)+'" data-action="toggle-budget"></button></div>';
            }).join('');
          }
          var el2 = document.getElementById('cost-budget-alerts');
          if (el2) {
            var alerts = d.alerts || [];
            if (alerts.length === 0) el2.innerHTML = '<div class="cp-empty">No alerts</div>';
            else el2.innerHTML = alerts.slice(0,20).map(function(a){
              var lvl = (a.level||'info').toLowerCase();
              return '<div class="cp-event-row"><span class="cp-severity-badge cp-severity-'+lvl+'">'+lvl+'</span><span style="flex:1;font-size:var(--font-size-xs)">'+escapeHtml(a.budgetName||'')+': '+escapeHtml(a.currentPercent||0)+'% of limit</span><span style="font-size:var(--font-size-xs);color:var(--color-text-muted)">'+fmt(a.currentSpend)+' / '+fmt(a.hardLimit)+'</span></div>';
            }).join('');
          }
        }).catch(function(){});
      }

      function loadForecast() {
        fetch('/api/v1/cost/forecast').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var d = json.data || {};
          var f = d.forecast || {};
          var el = document.getElementById('cost-forecast-metrics');
          if (el) {
            el.innerHTML = '${StatsCard({ label: 'Avg Daily Cost', value: '\'+fmt(f.daily?f.daily.average:0)+\'' })}' +
              '${StatsCard({ label: 'Projected Monthly', value: '\'+fmt(f.projected?f.projected.monthly:0)+\'' })}' +
              '${StatsCard({ label: 'Projected Quarterly', value: '\'+fmt(f.projected?f.projected.quarterly:0)+\'' })}' +
              '${StatsCard({ label: 'Projected Yearly', value: '\'+fmt(f.projected?f.projected.yearly:0)+\'' })}';
          }
          var el2 = document.getElementById('cost-forecast-detail');
          if (el2) {
            el2.innerHTML = '<div class="cost-forecast-row"><span>Month to Date</span><span>'+fmt(f.monthToDate)+'</span></div>' +
              '<div class="cost-forecast-row"><span>Daily Trend</span><span>'+(f.daily?f.daily.trend+'%':'—')+'</span></div>' +
              '<div class="cost-forecast-row"><span>Data Points</span><span>'+(f.dataPoints||0)+'</span></div>';
          }
        }).catch(function(){});
      }

      function loadOptimizations() {
        fetch('/api/v1/cost/summary').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var d = json.data || {};
          var el = document.getElementById('cost-optimization-metrics');
          if (el) {
            el.innerHTML = '${StatsCard({ label: 'Total Potential Savings', value: '\'+fmt(d.savingsOpportunity)+\'' })}' +
              '${StatsCard({ label: 'Recommendations', value: '\'+(d.recommendations?d.recommendations.length:0)+\'' })}' +
              '${StatsCard({ label: 'Alerts', value: '\'+(d.alerts?d.alerts.length:0)+\'' })}' +
              '${StatsCard({ label: 'Provider Models', value: '\'+(d.providerBreakdown?d.providerBreakdown.length:0)+\'' })}';
          }
        }).catch(function(){});
        fetch('/api/v1/cost/optimize', {method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var d = json.data || {};
          var el = document.getElementById('cost-optimization-list');
          if (!el) return;
          var recs = d.recommendations || [];
          if (recs.length === 0) el.innerHTML = '<div class="cp-empty">No optimization suggestions</div>';
          else el.innerHTML = recs.map(function(r){
            var imp = (r.impact||'low').toLowerCase();
            return '<div class="cp-event-row"><span class="cost-badge cost-badge-'+imp+'">'+imp+'</span><span style="flex:1;font-size:var(--font-size-xs)">'+escapeHtml(r.title||r.description||r.reasoning||'')+'</span><span style="font-size:var(--font-size-xs);color:var(--color-text-muted)">'+fmt(r.expectedSavings)+'</span></div>';
          }).join('');
        }).catch(function(){});
        fetch('/api/v1/cost/policies').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var pols = json.data || [];
          var el = document.getElementById('cost-policies-list');
          if (!el) return;
          if (pols.length === 0) el.innerHTML = '<div class="cp-empty">No policies configured</div>';
          else el.innerHTML = pols.map(function(p){
            return '<div class="cp-policy-row" style="display:flex;justify-content:space-between;align-items:center"><div><div class="cp-policy-name">'+escapeHtml(p.name||p.id)+'</div><div class="cp-policy-meta">'+escapeHtml(p.type||'')+' | '+escapeHtml(p.scope||'')+' | Priority: '+escapeHtml(p.priority||'')+'</div></div><button class="cost-toggle'+(p.enabled?' active':'')+'" data-policy-id="'+escapeHtml(p.id)+'" data-action="toggle-cost-policy"></button></div>';
          }).join('');
        }).catch(function(){});
      }

      function loadQuotas() {
        fetch('/api/v1/cost/quotas?period=daily').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var d = json.data || {};
          var quotas = d.quotas || [];
          var el = document.getElementById('cost-quotas-daily');
          if (el) {
            if (quotas.length===0) el.innerHTML='<div class="cp-empty">No quota data</div>';
            else el.innerHTML = '<table class="cost-table"><tr><th>Resource</th><th>Used</th><th>Limit</th><th>%</th></tr>'+quotas.map(function(q){
              var pct = q.pct || 0;
              var color = pct>=90?'#ef4444':pct>=75?'#eab308':'#22c55e';
              return '<tr><td>'+escapeHtml(q.key||'')+'</td><td>'+num(q.used)+'</td><td>'+num(q.limit)+'</td><td><div class="cost-bar"><div class="cost-bar-fill" style="width:'+Math.min(pct,100)+'%;background:'+color+'"></div></div> '+pct+'%</td></tr>';
            }).join('')+'</table>';
          }
        }).catch(function(){});
        fetch('/api/v1/cost/quotas?period=monthly').then(function(r){return r.json()}).then(function(json){
          if (!json.success) return;
          var d = json.data || {};
          var quotas = d.quotas || [];
          var el = document.getElementById('cost-quotas-monthly');
          if (el) {
            if (quotas.length===0) el.innerHTML='<div class="cp-empty">No quota data</div>';
            else el.innerHTML = '<table class="cost-table"><tr><th>Resource</th><th>Used</th><th>Limit</th><th>%</th></tr>'+quotas.map(function(q){
              var pct = q.pct || 0;
              var color = pct>=90?'#ef4444':pct>=75?'#eab308':'#22c55e';
              return '<tr><td>'+escapeHtml(q.key||'')+'</td><td>'+num(q.used)+'</td><td>'+num(q.limit)+'</td><td><div class="cost-bar"><div class="cost-bar-fill" style="width:'+Math.min(pct,100)+'%;background:'+color+'"></div></div> '+pct+'%</td></tr>';
            }).join('')+'</table>';
          }
        }).catch(function(){});
      }

      document.addEventListener('click', function(e) {
        var toggle = e.target.closest('[data-action="toggle-budget"]');
        if (toggle) {
          var id = toggle.dataset.budgetId;
          toggle.classList.toggle('active');
          fetch('/api/v1/cost/budgets', {method:'PUT',body:JSON.stringify({enabled:toggle.classList.contains('active')}),headers:{'Content-Type':'application/json'}}).catch(function(){});
        }
        var ptoggle = e.target.closest('[data-action="toggle-cost-policy"]');
        if (ptoggle) {
          var pid = ptoggle.dataset.policyId;
          ptoggle.classList.toggle('active');
          fetch('/api/v1/cost/policies', {method:'POST',body:JSON.stringify({id:pid,enabled:ptoggle.classList.contains('active')}),headers:{'Content-Type':'application/json'}}).catch(function(){});
        }
      });

      function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }

      loadSummary();
      loadBudgets();
      loadForecast();
      loadOptimizations();
      loadQuotas();
      setInterval(loadSummary, 15000);
      setInterval(loadBudgets, 30000);
      setInterval(loadForecast, 30000);
      setInterval(loadOptimizations, 30000);
      setInterval(loadQuotas, 30000);
    })();
    </script>
  `;

  return DashboardLayout({
    activePage: 'costOptimization',
    breadcrumbs: ['Cost Optimization'],
    children: html,
    userName: params.userName,
    workspaceName: params.workspaceName,
  });
}

module.exports = { renderCostOverview };
