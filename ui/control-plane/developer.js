function renderDeveloperPage(state) {
  const { sdks, analytics, schemas, events, clients, portal } = state || {};
  const sdkList = sdks || ['JavaScript', 'TypeScript', 'Python', 'Go', 'Java', 'C#', 'PHP'];
  const apiCalls = analytics?.totalCalls || 0;
  const topEndpoints = analytics?.topEndpoints || [];
  const clientCount = clients || 0;
  const commandCount = 15;
  const schemaCount = schemas || 6;
  const portalSections = portal?.sections || [];

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Developer Center — Control Plane</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',sans-serif; background:#0a0a0f; color:#e0e0e0; padding:24px; }
.dashboard { max-width:1400px; margin:0 auto; }
h1 { font-size:24px; font-weight:600; margin-bottom:24px; color:#fff; }
h1 span { color:#7c3aed; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin-bottom:24px; }
.card { background:#14141f; border:1px solid #2a2a3a; border-radius:12px; padding:20px; }
.card h3 { font-size:13px; color:#888; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; }
.card .value { font-size:28px; font-weight:700; color:#fff; }
.card .value.accent { color:#7c3aed; }
.card .sub { font-size:12px; color:#666; margin-top:4px; }
.tabs { display:flex; gap:4px; margin-bottom:20px; background:#14141f; border-radius:8px; padding:4px; overflow-x:auto; }
.tab { padding:8px 20px; border-radius:6px; cursor:pointer; font-size:14px; color:#888; border:none; background:none; white-space:nowrap; }
.tab.active { background:#2a2a3a; color:#fff; }
.tab-content { display:none; }
.tab-content.active { display:block; }
.sdk-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
.sdk-card { background:#14141f; border:1px solid #2a2a3a; border-radius:12px; padding:20px; text-align:center; }
.sdk-card .lang-icon { width:48px; height:48px; border-radius:8px; background:#2a2a3a; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; font-size:20px; font-weight:700; color:#7c3aed; }
.sdk-card h3 { font-size:16px; color:#fff; margin-bottom:4px; }
.sdk-card .pkg { font-size:11px; color:#666; margin-bottom:12px; font-family:monospace; }
.sdk-card .btn { display:inline-block; padding:6px 16px; border-radius:6px; font-size:12px; cursor:pointer; border:none; color:#fff; margin:2px; }
.sdk-card .btn-primary { background:#7c3aed; }
.sdk-card .btn-secondary { background:#2a2a3a; color:#ccc; }
.sdk-card .btn:hover { opacity:0.85; }
table { width:100%; border-collapse:collapse; }
th { text-align:left; padding:10px 12px; font-size:12px; color:#888; text-transform:uppercase; border-bottom:1px solid #2a2a3a; }
td { padding:10px 12px; font-size:13px; border-bottom:1px solid #1a1a2a; }
.code-block { background:#0d0d1a; border:1px solid #2a2a3a; border-radius:8px; padding:16px; font-family:monospace; font-size:13px; color:#e0e0e0; overflow-x:auto; margin-bottom:16px; }
.code-block .comment { color:#666; }
.code-block .keyword { color:#7c3aed; }
.code-block .string { color:#00c853; }
.endpoint-tester { background:#14141f; border:1px solid #2a2a3a; border-radius:12px; padding:20px; }
.endpoint-tester input, .endpoint-tester select { background:#0d0d1a; border:1px solid #2a2a3a; border-radius:6px; padding:8px 12px; color:#e0e0e0; font-size:13px; margin:4px 0; width:100%; }
.endpoint-tester button { padding:8px 20px; border-radius:6px; font-size:13px; cursor:pointer; border:none; color:#fff; background:#7c3aed; }
.endpoint-tester button:hover { opacity:0.85; }
.spec-options { display:flex; gap:16px; flex-wrap:wrap; }
.spec-card { background:#14141f; border:1px solid #2a2a3a; border-radius:12px; padding:20px; flex:1; min-width:200px; text-align:center; }
.spec-card h3 { color:#fff; margin-bottom:8px; }
.spec-card .btn { display:inline-block; padding:8px 20px; border-radius:6px; font-size:13px; cursor:pointer; border:none; color:#fff; background:#7c3aed; text-decoration:none; }
.empty { text-align:center; padding:40px; color:#666; }
</style></head><body>
<div class="dashboard">
<h1>Developer Center</h1>
<div class="grid">
  <div class="card"><h3>SDKs Available</h3><div class="value accent">${sdkList.length}</div><div class="sub">Supported languages</div></div>
  <div class="card"><h3>API Calls Today</h3><div class="value">${apiCalls}</div><div class="sub">Total requests</div></div>
  <div class="card"><h3>Top Endpoints</h3><div class="value">${topEndpoints.length || '—'}</div><div class="sub">Most requested</div></div>
  <div class="card"><h3>Client Generations</h3><div class="value">${clientCount}</div><div class="sub">Generated clients</div></div>
  <div class="card"><h3>CLI Commands</h3><div class="value">${commandCount}</div><div class="sub">Available commands</div></div>
  <div class="card"><h3>Schemas</h3><div class="value">${schemaCount}</div><div class="sub">API schemas</div></div>
</div>
<div class="tabs">
  <button class="tab active" onclick="switchTab('sdks')">SDKs</button>
  <button class="tab" onclick="switchTab('explorer')">API Explorer</button>
  <button class="tab" onclick="switchTab('openapi')">OpenAPI</button>
  <button class="tab" onclick="switchTab('terraform')">Terraform</button>
</div>
<div id="tab-sdks" class="tab-content active">
  <div class="sdk-grid">
    ${sdkList.map(lang => {
      const icons = { JavaScript: 'JS', TypeScript: 'TS', Python: 'Py', Go: 'Go', Java: 'JV', 'C#': 'C#', PHP: 'HP' };
      const pkgs = { JavaScript: '@platform/sdk-js', TypeScript: '@platform/sdk-ts', Python: 'platform-sdk', Go: 'github.com/platform/sdk-go', Java: 'com.platform:sdk', 'C#': 'Platform.Sdk', PHP: 'platform/sdk-php' };
      const icon = icons[lang] || lang.substring(0,2);
      const pkg = pkgs[lang] || 'platform-sdk-' + lang.toLowerCase();
      return `<div class="sdk-card"><div class="lang-icon">${icon}</div><h3>${lang}</h3><div class="pkg">${pkg}</div><button class="btn btn-primary">Download</button><button class="btn btn-secondary">SDK Docs</button></div>`;
    }).join('')}
  </div>
</div>
<div id="tab-explorer" class="tab-content">
  <div class="endpoint-tester">
    <h3 style="color:#fff;margin-bottom:12px">API Endpoint Tester</h3>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <select id="explorer-method" style="width:120px"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select>
      <input id="explorer-path" placeholder="/api/v1/developer/status" value="/api/v1/developer/status">
    </div>
    <input id="explorer-body" placeholder='Request body (JSON) — optional'>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button onclick="sendRequest()">Send Request</button>
      <button onclick="document.getElementById('explorer-response').textContent=''" style="background:#2a2a3a">Clear</button>
    </div>
    <pre id="explorer-response" class="code-block" style="margin-top:12px;min-height:60px">Response will appear here...</pre>
  </div>
</div>
<div id="tab-openapi" class="tab-content">
  <h3 style="color:#fff;margin-bottom:16px">OpenAPI 3.1 Specification</h3>
  <div class="spec-options">
    <div class="spec-card"><h3>JSON Format</h3><p style="font-size:12px;color:#666;margin-bottom:12px">Full OpenAPI 3.1 spec in JSON</p><a class="btn" href="/api/v1/developer/openapi" download>Download JSON</a></div>
    <div class="spec-card"><h3>YAML Format</h3><p style="font-size:12px;color:#666;margin-bottom:12px">Human-readable YAML format</p><a class="btn" href="/api/v1/developer/openapi?format=yaml" download>Download YAML</a></div>
    <div class="spec-card"><h3>Swagger UI</h3><p style="font-size:12px;color:#666;margin-bottom:12px">Interactive API documentation</p><a class="btn" href="/docs/openapi.html" target="_blank">Open Swagger UI</a></div>
    <div class="spec-card"><h3>Redoc</h3><p style="font-size:12px;color:#666;margin-bottom:12px">Clean API reference rendering</p><a class="btn" href="/docs/redoc.html" target="_blank">Open Redoc</a></div>
  </div>
  <h3 style="color:#fff;margin:20px 0 12px">Example Request</h3>
  <div class="code-block"><span class="comment"># List all available endpoints</span>
<span class="keyword">curl</span> -X GET https://api.platform.io/api/v1/developer \
  -H <span class="string">"Authorization: Bearer YOUR_API_KEY"</span></div>
</div>
<div id="tab-terraform" class="tab-content">
  <h3 style="color:#fff;margin-bottom:16px">Terraform Provider Configuration</h3>
  <div class="code-block"><span class="keyword">terraform</span> {
  required_providers {
    platform = {
      source  = <span class="string">"platform/terraform-provider-platform"</span>
      version = <span class="string">"~> 4.5.0"</span>
    }
  }
}

<span class="keyword">provider</span> <span class="string">"platform"</span> {
  api_key = var.platform_api_key
  region  = <span class="string">"us-east"</span>
}

<span class="keyword">resource</span> <span class="string">"platform_project"</span> <span class="string">"my_app"</span> {
  name        = <span class="string">"My App"</span>
  description = <span class="string">"Production application"</span>
  region      = <span class="string">"us-east"</span>
}</div>
  <div class="spec-options">
    <div class="spec-card"><h3>Provider Docs</h3><p style="font-size:12px;color:#666;margin-bottom:12px">Full Terraform provider documentation</p><a class="btn" href="/docs/terraform-provider.md" target="_blank">View Docs</a></div>
    <div class="spec-card"><h3>Examples</h3><p style="font-size:12px;color:#666;margin-bottom:12px">Example Terraform configurations</p><a class="btn" href="/api/v1/developer/terraform" target="_blank">Download Examples</a></div>
  </div>
</div>
</div>
<script>
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(function(t){t.classList.remove('active')});
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active')});
  var tab = document.getElementById('tab-'+name);
  if (tab) tab.classList.add('active');
  var btns = document.querySelectorAll('[onclick*="switchTab(\\''+name+'\\')"]');
  btns.forEach(function(b){b.classList.add('active')});
}
function sendRequest() {
  var method = document.getElementById('explorer-method').value;
  var path = document.getElementById('explorer-path').value;
  var body = document.getElementById('explorer-body').value;
  var respEl = document.getElementById('explorer-response');
  respEl.textContent = 'Sending request...';
  var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
  if (body && method !== 'GET') opts.body = body;
  fetch(path, opts).then(function(r){ return r.json() }).then(function(j){ respEl.textContent = JSON.stringify(j, null, 2) }).catch(function(e){ respEl.textContent = 'Error: '+e.message });
}
</script>
</body></html>`;
}

function renderDeveloperWidgets(state) {
  const { sdks, analytics } = state || {};
  const sdkList = sdks || ['JavaScript', 'TypeScript', 'Python', 'Go'];
  const stats = analytics || {};

  const sdkWidgets = sdkList.slice(0, 4).map(lang => {
    const icons = { JavaScript: 'JS', TypeScript: 'TS', Python: 'Py', Go: 'Go' };
    return `<div style="background:#14141f;border:1px solid #2a2a3a;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
      <div style="width:32px;height:32px;border-radius:6px;background:#2a2a3a;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#7c3aed;flex-shrink:0">${icons[lang] || lang.substring(0,2)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;color:#fff">${lang} SDK</div>
        <div style="font-size:11px;color:#666">v4.5.0</div>
      </div>
      <div style="font-size:11px;color:#7c3aed">Download</div>
    </div>`;
  }).join('');

  const usageHtml = stats.totalCalls != null ? `<div style="background:#14141f;border:1px solid #2a2a3a;border-radius:8px;padding:12px;margin-bottom:8px">
    <div style="font-size:13px;font-weight:500;color:#fff;margin-bottom:8px">API Usage</div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#666"><span>Total Calls</span><span style="color:#fff;font-weight:600">${stats.totalCalls}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-top:4px"><span>Error Rate</span><span style="color:#ef4444;font-weight:600">${stats.errorRate || 0}%</span></div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-top:4px"><span>Avg Latency</span><span style="color:#00c853;font-weight:600">${stats.avgLatencyMs || 0}ms</span></div>
  </div>` : '<div style="padding:16px;text-align:center;color:#666;font-size:13px">No usage data</div>';

  return `<div style="margin-bottom:16px">${sdkWidgets}</div><div>${usageHtml}</div>`;
}

module.exports = { renderDeveloperPage, renderDeveloperWidgets };
