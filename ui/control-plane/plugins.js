function renderPluginsPage(data) {
  const { plugins, marketplace, categories, status } = data;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Plugins — Control Plane</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',sans-serif; background:#0a0a0f; color:#e0e0e0; padding:24px; }
.dashboard { max-width:1400px; margin:0 auto; }
h1 { font-size:24px; font-weight:600; margin-bottom:24px; color:#fff; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:24px; }
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
.badge.enabled { background:#00c85322; color:#00c853; }
.badge.disabled { background:#666; }
.badge.marketplace { background:#2979ff22; color:#2979ff; }
.empty { text-align:center; padding:40px; color:#666; }
.plugin-icon { width:32px; height:32px; border-radius:6px; background:#2a2a3a; display:flex; align-items:center; justify-content:center; font-size:14px; }
</style></head><body>
<div class="dashboard">
<h1>🧩 Plugins</h1>
<div class="grid">
  <div class="card"><h3>Installed</h3><div class="value">${status?.installed || plugins?.length || 0}</div><div class="sub">Total plugins</div></div>
  <div class="card"><h3>Enabled</h3><div class="value">${status?.enabled || 0}</div><div class="sub">Active plugins</div></div>
  <div class="card"><h3>Marketplace</h3><div class="value">${status?.marketplace || marketplace?.length || 0}</div><div class="sub">Available listings</div></div>
  <div class="card"><h3>Hook Registrations</h3><div class="value">${status?.hooks || 0}</div><div class="sub">Active hook handlers</div></div>
</div>
<div class="tabs">
  <button class="tab active" onclick="switchTab('installed')">Installed</button>
  <button class="tab" onclick="switchTab('marketplace')">Marketplace</button>
  <button class="tab" onclick="switchTab('categories')">Categories</button>
</div>
<div id="tab-installed" class="tab-content active">
  <table><thead><tr><th>ID</th><th>Name</th><th>Version</th><th>Status</th><th>Type</th><th>Author</th></tr></thead>
  <tbody>${(plugins||[]).map(p => `<tr><td style="font-family:monospace;font-size:12px">${p.id}</td><td>${p.manifest?.name||p.name}</td><td>${p.manifest?.version||'—'}</td><td><span class="badge ${p.enabled?'enabled':'disabled'}">${p.enabled?'Enabled':'Disabled'}</span></td><td>${p.manifest?.type||'plugin'}</td><td>${p.manifest?.author||'—'}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No plugins installed</td></tr>'}</tbody></table>
</div>
<div id="tab-marketplace" class="tab-content">
  <table><thead><tr><th>Name</th><th>Author</th><th>Version</th><th>Downloads</th><th>Rating</th><th>Verified</th></tr></thead>
  <tbody>${(marketplace||[]).map(m => `<tr><td>${m.name}</td><td>${m.author||'—'}</td><td>${m.version}</td><td>${m.downloads||0}</td><td>${m.rating||'—'}</td><td>${m.verified?'✅':'—'}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No marketplace listings</td></tr>'}</tbody></table>
</div>
<div id="tab-categories" class="tab-content">
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
  ${(categories||[]).map(c => `<div class="card"><h3>${c.name}</h3><div class="value">${c.count}</div><div class="sub">plugins</div></div>`).join('')||'<div class="empty">No categories</div>'}
  </div>
</div>
</div>
<script>
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  const tab = document.getElementById('tab-'+name);
  if (tab) tab.classList.add('active');
  const btn = document.querySelector(\`[onclick="switchTab('\${name}')"]\`);
  if (btn) btn.classList.add('active');
}
</script>
</body></html>`;
}

module.exports = { renderPluginsPage };
