function renderBillingPage(data) {
  const { report, subscriptions, invoices, customers, plans } = data;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Billing — Control Plane</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',sans-serif; background:#0a0a0f; color:#e0e0e0; padding:24px; }
.dashboard { max-width:1400px; margin:0 auto; }
h1 { font-size:24px; font-weight:600; margin-bottom:24px; color:#fff; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-bottom:24px; }
.card { background:#14141f; border:1px solid #2a2a3a; border-radius:12px; padding:20px; }
.card h3 { font-size:13px; color:#888; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; }
.card .value { font-size:28px; font-weight:700; color:#fff; }
.card .sub { font-size:12px; color:#666; margin-top:4px; }
.tabs { display:flex; gap:4px; margin-bottom:20px; background:#14141f; border-radius:8px; padding:4px; }
.tab { padding:8px 20px; border-radius:6px; cursor:pointer; font-size:14px; color:#888; border:none; background:none; }
.tab.active { background:#2a2a3a; color:#fff; }
.tab-content { display:none; }
.tab-content.active { display:block; }
table { width:100%; border-collapse:collapse; }
th { text-align:left; padding:10px 12px; font-size:12px; color:#888; text-transform:uppercase; border-bottom:1px solid #2a2a3a; }
td { padding:10px 12px; font-size:13px; border-bottom:1px solid #1a1a2a; }
.badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:500; }
.badge.active { background:#00c85322; color:#00c853; }
.badge.trialing { background:#2979ff22; color:#2979ff; }
.badge.canceled { background:#ff174422; color:#ff1744; }
.badge.paused { background:#ffab0022; color:#ffab00; }
.badge.paid { background:#00c85322; color:#00c853; }
.badge.open { background:#2979ff22; color:#2979ff; }
.badge.draft { background:#666; }
.badge.failed { background:#ff174422; color:#ff1744; }
.badge.void { background:#888; }
.rec { background:#1a1a2a; border-left:3px solid #2979ff; padding:12px; margin:8px 0; border-radius:0 8px 8px 0; font-size:13px; }
.empty { text-align:center; padding:40px; color:#666; }
</style></head><body>
<div class="dashboard">
<h1>💰 Billing</h1>
<div class="grid">
  <div class="card"><h3>MRR</h3><div class="value">$${(report.monthlyRevenue||0).toFixed(2)}</div><div class="sub">Monthly Recurring Revenue</div></div>
  <div class="card"><h3>ARR</h3><div class="value">$${(report.annualRevenue||0).toFixed(2)}</div><div class="sub">Annual Run Rate</div></div>
  <div class="card"><h3>Active Subscriptions</h3><div class="value">${report.subscriptions||0}</div><div class="sub">${report.activeTrials||0} trialing</div></div>
  <div class="card"><h3>Customers</h3><div class="value">${report.customers||0}</div><div class="sub">Total customers</div></div>
  <div class="card"><h3>Invoices</h3><div class="value">${report.outstandingInvoices||0}</div><div class="sub">Outstanding</div></div>
  <div class="card"><h3>Failed Payments</h3><div class="value">${report.failedPayments||0}</div><div class="sub">Requires attention</div></div>
</div>
${report.recommendations && report.recommendations.length ? `<div style="margin-bottom:24px">${report.recommendations.map(r => `<div class="rec">💡 ${r}</div>`).join('')}</div>` : ''}
<div class="tabs">
  <button class="tab active" onclick="switchTab('subscriptions')">Subscriptions</button>
  <button class="tab" onclick="switchTab('invoices')">Invoices</button>
  <button class="tab" onclick="switchTab('customers')">Customers</button>
  <button class="tab" onclick="switchTab('plans')">Plans</button>
  <button class="tab" onclick="switchTab('revenue')">Revenue</button>
</div>
<div id="tab-subscriptions" class="tab-content active">
  <table><thead><tr><th>ID</th><th>Customer</th><th>Plan</th><th>Status</th><th>Interval</th><th>Created</th></tr></thead>
  <tbody>${(subscriptions||[]).map(s => `<tr><td style="font-family:monospace;font-size:12px">${s.id}</td><td>${s.customerId}</td><td>${s.planId}</td><td><span class="badge ${s.status}">${s.status}</span></td><td>${s.interval||'monthly'}</td><td>${new Date(s.createdAt).toLocaleDateString()}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No subscriptions</td></tr>'}</tbody></table>
</div>
<div id="tab-invoices" class="tab-content">
  <table><thead><tr><th>Number</th><th>Customer</th><th>Total</th><th>Status</th><th>Due</th></tr></thead>
  <tbody>${(invoices||[]).map(i => `<tr><td>${i.number||i.id}</td><td>${i.customerId}</td><td>$${(i.total||0).toFixed(2)}</td><td><span class="badge ${i.status}">${i.status}</span></td><td>${i.dueDate?new Date(i.dueDate).toLocaleDateString():'N/A'}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No invoices</td></tr>'}</tbody></table>
</div>
<div id="tab-customers" class="tab-content">
  <table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Company</th><th>Status</th></tr></thead>
  <tbody>${(customers||[]).map(c => `<tr><td style="font-family:monospace;font-size:12px">${c.id}</td><td>${c.name||'—'}</td><td>${c.email}</td><td>${c.company||'—'}</td><td><span class="badge ${c.status}">${c.status}</span></td></tr>`).join('')||'<tr><td colspan="5" class="empty">No customers</td></tr>'}</tbody></table>
</div>
<div id="tab-plans" class="tab-content">
  <table><thead><tr><th>Plan</th><th>Price (Monthly)</th><th>Price (Yearly)</th><th>Projects</th><th>Team</th></tr></thead>
  <tbody>${(plans||[]).map(p => `<tr><td><strong>${p.name}</strong></td><td>$${(p.prices&&p.prices.monthly)||0}</td><td>$${(p.prices&&p.prices.yearly)||0}</td><td>${p.projects===-1?'∞':p.projects}</td><td>${p.teamMembers===-1?'∞':p.teamMembers}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No plans</td></tr>'}</tbody></table>
</div>
<div id="tab-revenue" class="tab-content">
  <div class="grid" style="grid-template-columns:1fr 1fr">
    <div class="card"><h3>MRR Breakdown</h3><div class="value">$${(report.monthlyRevenue||0).toFixed(2)}</div><div class="sub">Monthly recurring revenue</div></div>
    <div class="card"><h3>ARR Breakdown</h3><div class="value">$${(report.annualRevenue||0).toFixed(2)}</div><div class="sub">Annualized run rate</div></div>
  </div>
</div>
</div>
<script>
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  document.querySelector(\`[onclick="switchTab('\${name}')"]\`).classList.add('active');
}
</script>
</body></html>`;
}

module.exports = { renderBillingPage };
