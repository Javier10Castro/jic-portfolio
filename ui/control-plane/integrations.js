function renderIntegrationsPage(state) {
  const { integrations, providers, health, status } = state;
  const connectedIntegrations = (integrations || []).filter(i => i.status === 'connected');
  const totalProviders = (providers || []).length;
  const healthEntries = health ? Object.entries(health) : [];

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Integrations — Control Plane</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',sans-serif; background:#0a0a0f; color:#e0e0e0; padding:24px; }
.dashboard { max-width:1400px; margin:0 auto; }
h1 { font-size:24px; font-weight:600; margin-bottom:24px; color:#fff; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin-bottom:24px; }
.card { background:#14141f; border:1px solid #2a2a3a; border-radius:12px; padding:20px; }
.card h3 { font-size:13px; color:#888; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; }
.card .value { font-size:28px; font-weight:700; color:#fff; }
.card .sub { font-size:12px; color:#666; margin-top:4px; }
.tabs { display:flex; gap:4px; margin-bottom:20px; background:#14141f; border-radius:8px; padding:4px; overflow-x:auto; }
.tab { padding:8px 20px; border-radius:6px; cursor:pointer; font-size:14px; color:#888; border:none; background:none; white-space:nowrap; }
.tab.active { background:#2a2a3a; color:#fff; }
.tab-content { display:none; }
.tab-content.active { display:block; }
table { width:100%; border-collapse:collapse; }
th { text-align:left; padding:10px 12px; font-size:12px; color:#888; text-transform:uppercase; border-bottom:1px solid #2a2a3a; }
td { padding:10px 12px; font-size:13px; border-bottom:1px solid #1a1a2a; }
.badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:500; }
.badge.connected { background:#00c85322; color:#00c853; }
.badge.disconnected { background:#666; }
.badge.healthy { background:#00c85322; color:#00c853; }
.badge.unhealthy { background:#ef444422; color:#ef4444; }
.badge.unknown { background:#eab30822; color:#eab308; }
.btn { display:inline-block; padding:4px 12px; border-radius:6px; font-size:12px; cursor:pointer; border:none; color:#fff; }
.btn-primary { background:#2979ff; }
.btn-danger { background:#ef4444; }
.btn-secondary { background:#2a2a3a; color:#ccc; }
.btn:hover { opacity:0.85; }
.provider-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
.provider-card { background:#14141f; border:1px solid #2a2a3a; border-radius:12px; padding:16px; text-align:center; }
.provider-card h3 { font-size:14px; color:#fff; margin-bottom:4px; }
.provider-card .meta { font-size:11px; color:#666; margin-bottom:12px; }
.empty { text-align:center; padding:40px; color:#666; }
</style></head><body>
<div class="dashboard">
<h1>Integrations</h1>
<div class="grid">
  <div class="card"><h3>Connected</h3><div class="value">${status?.connected || connectedIntegrations.length}</div><div class="sub">Active connections</div></div>
  <div class="card"><h3>Available Providers</h3><div class="value">${status?.providers || totalProviders}</div><div class="sub">Supported providers</div></div>
  <div class="card"><h3>Healthy</h3><div class="value" style="color:#00c853">${status?.healthy || 0}</div><div class="sub">Healthy connections</div></div>
  <div class="card"><h3>Unhealthy</h3><div class="value" style="color:#ef4444">${status?.unhealthy || 0}</div><div class="sub">Unhealthy connections</div></div>
  <div class="card"><h3>Pending Syncs</h3><div class="value">${status?.pendingSyncs || 0}</div><div class="sub">Awaiting sync</div></div>
  <div class="card"><h3>Active Webhooks</h3><div class="value">${status?.activeWebhooks || 0}</div><div class="sub">Registered webhooks</div></div>
</div>
<div class="tabs">
  <button class="tab active" onclick="switchTab('connected')">Connected</button>
  <button class="tab" onclick="switchTab('marketplace')">Provider Marketplace</button>
  <button class="tab" onclick="switchTab('health')">Health</button>
</div>
<div id="tab-connected" class="tab-content active">
  <table><thead><tr><th>Provider</th><th>ID</th><th>Status</th><th>Connected At</th><th>Actions</th></tr></thead>
  <tbody>${connectedIntegrations.length > 0 ? connectedIntegrations.map(i => `<tr><td style="font-weight:500">${i.provider}</td><td style="font-family:monospace;font-size:12px">${i.provider}</td><td><span class="badge ${i.status}">${i.status}</span></td><td>${i.connectedAt ? new Date(i.connectedAt).toLocaleString() : '—'}</td><td><button class="btn btn-danger" onclick="disconnect('${i.provider}')">Disconnect</button> <button class="btn btn-primary" onclick="sync('${i.provider}')">Sync</button></td></tr>`).join('') : '<tr><td colspan="5" class="empty">No integrations connected</td></tr>'}</tbody></table>
</div>
<div id="tab-marketplace" class="tab-content">
  ${providers && providers.length > 0 ? `<div class="provider-grid">${providers.map(p => `<div class="provider-card"><h3>${p.name}</h3><div class="meta">${p.type} · ${p.authType} · v${p.version}</div><button class="btn btn-primary" onclick="connect('${p.id}')">Connect</button></div>`).join('')}</div>` : '<div class="empty">No providers registered</div>'}
</div>
<div id="tab-health" class="tab-content">
  <table><thead><tr><th>Provider</th><th>Status</th><th>Latency</th><th>Failures</th><th>Last Success</th><th>Last Failure</th></tr></thead>
  <tbody>${healthEntries.length > 0 ? healthEntries.map(([provider, h]) => `<tr><td style="font-weight:500">${provider}</td><td><span class="badge ${h.status}">${h.status}</span></td><td>${h.latency != null ? h.latency + 'ms' : '—'}</td><td>${h.failures || 0}</td><td>${h.lastSuccess ? new Date(h.lastSuccess).toLocaleString() : '—'}</td><td>${h.lastFailure ? new Date(h.lastFailure).toLocaleString() : '—'}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">No health data available</td></tr>'}</tbody></table>
</div>
</div>
<script>
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  const tab = document.getElementById('tab-'+name);
  if (tab) tab.classList.add('active');
  const btn = document.querySelector('[onclick="switchTab(\\''+name+'\\')"]');
  if (btn) btn.classList.add('active');
}
function disconnect(provider) {
  if (!confirm('Disconnect '+provider+'?')) return;
  fetch('/api/v1/integrations/disconnect', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({provider}) }).then(function(r){return r.json()}).then(function(j){ if(j.success) location.reload(); else alert(j.errors?.[0]?.message||'Failed'); }).catch(function(){alert('Request failed')});
}
function sync(provider) {
  fetch('/api/v1/integrations/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({provider}) }).then(function(r){return r.json()}).then(function(j){ if(j.success) alert('Sync started'); else alert(j.errors?.[0]?.message||'Failed'); }).catch(function(){alert('Request failed')});
}
function connect(provider) {
  const config = prompt('Configuration JSON for '+provider+':','{}');
  if (config === null) return;
  try { JSON.parse(config); } catch(e) { alert('Invalid JSON'); return; }
  fetch('/api/v1/integrations/connect', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({provider, config:JSON.parse(config)}) }).then(function(r){return r.json()}).then(function(j){ if(j.success) location.reload(); else alert(j.errors?.[0]?.message||'Failed'); }).catch(function(){alert('Request failed')});
}
</script>
</body></html>`;
}

function renderConnectedWidgets(state) {
  const { integrations, health } = state;
  const connected = (integrations || []).filter(i => i.status === 'connected');

  if (connected.length === 0) {
    return '<div style="padding:16px;text-align:center;color:#666;font-size:13px">No connected integrations</div>';
  }

  return connected.map(i => {
    const h = health ? health[i.provider] : null;
    const status = h ? h.status : 'unknown';
    const color = status === 'healthy' ? '#00c853' : status === 'unhealthy' ? '#ef4444' : '#eab308';
    const latency = h && h.latency != null ? h.latency + 'ms' : '—';
    return `<div style="background:#14141f;border:1px solid #2a2a3a;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
      <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;color:#fff">${i.provider}</div>
        <div style="font-size:11px;color:#666">${status} · ${latency}</div>
      </div>
      <div style="font-size:20px;font-weight:700;color:${color}">${i.status === 'connected' ? '✓' : '✗'}</div>
    </div>`;
  }).join('');
}

module.exports = { renderIntegrationsPage, renderConnectedWidgets };
