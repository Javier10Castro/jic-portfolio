const { getDefaultEngine } = require('../../lib/security');
const { EVENT_TYPES } = require('../../lib/security/audit/securityEvents');

function renderSecurityPage(req, res) {
  const engine = getDefaultEngine();
  const report = engine.generateSecurityReport();
  const loginStats = engine.loginHistory.getStats();
  const sessions = engine.sessionManager.listAll();
  const threats = engine.threats.getStats();
  const orgs = engine.organizations.list();
  const users = engine.listUsers();
  const mfaCount = users.filter(u => engine.mfa.getStatus(u.id)?.enabled).length;
  const recentLogins = engine.loginHistory.getRecentLogins(10);
  const failedAttempts = engine.loginHistory.getRecent(10).filter(a => !a.success);
  const securityEvents = engine.securityEvents.getHistory({}).slice(-20).reverse();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Dashboard — Control Plane</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root { --bg: #0a0a0b; --surface: #141416; --border: #27272a; --text: #fafafa; --muted: #a1a1aa; --accent: #00d4ff; --critical: #ef4444; --high: #f97316; --medium: #eab308; --low: #22c55e; --info: #3b82f6; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    .container { max-width: 1440px; margin: 0 auto; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .header h1 { font-family: 'Space Grotesk', sans-serif; font-size: 28px; background: linear-gradient(135deg, var(--accent), #00ffc8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .score-badge { display: flex; align-items: center; gap: 12px; padding: 8px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
    .score-value { font-size: 24px; font-weight: 700; }
    .risk-badge { padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .risk-low { background: rgba(34,197,94,0.15); color: var(--low); }
    .risk-medium { background: rgba(234,179,8,0.15); color: var(--medium); }
    .risk-high { background: rgba(239,68,68,0.15); color: var(--critical); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .card h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); margin-bottom: 8px; }
    .card .value { font-size: 32px; font-weight: 700; }
    .card .sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 4px; overflow-x: auto; }
    .tab { padding: 8px 20px; border: none; background: transparent; color: var(--muted); cursor: pointer; border-radius: 6px; font-size: 14px; white-space: nowrap; }
    .tab.active { background: rgba(0,212,255,0.1); color: var(--accent); }
    .tab:hover { color: var(--text); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--border); }
    td { padding: 10px 8px; border-bottom: 1px solid var(--border); font-size: 14px; }
    .severity { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
    .sev-critical { background: var(--critical); }
    .sev-high { background: var(--high); }
    .sev-medium { background: var(--medium); }
    .sev-low { background: var(--low); }
    .sev-info { background: var(--info); }
    .rec-list { list-style: none; }
    .rec-list li { padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
    .rec-list li:before { content: '→'; margin-right: 8px; color: var(--accent); }
    .org-list, .user-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { padding: 4px 12px; background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.2); border-radius: 9999px; font-size: 12px; color: var(--accent); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Security Dashboard</h1>
      <div class="score-badge">
        <span>Security Score</span>
        <span class="score-value" style="color: ${report.securityScore >= 80 ? 'var(--low)' : report.securityScore >= 50 ? 'var(--medium)' : 'var(--critical)'}">${report.securityScore}</span>
        <span class="risk-badge risk-${report.riskLevel}">${report.riskLevel}</span>
      </div>
    </div>

    <div class="grid">
      <div class="card"><h3>Active Users</h3><div class="value">${report.activeUsers}</div><div class="sub">${users.length} total registered</div></div>
      <div class="card"><h3>Active Sessions</h3><div class="value">${report.activeSessions}</div><div class="sub">${sessions.length} total active</div></div>
      <div class="card"><h3>Threat Score</h3><div class="value">${report.threats}</div><div class="sub">${threats.unresolved} unresolved</div></div>
      <div class="card"><h3>Failed Logins (24h)</h3><div class="value">${report.failedLogins}</div><div class="sub">${loginStats.total} total attempts</div></div>
      <div class="card"><h3>MFA Adoption</h3><div class="value">${report.mfaCoverage}%</div><div class="sub">${mfaCount} of ${users.length} users</div></div>
      <div class="card"><h3>Organizations</h3><div class="value">${report.organizations}</div><div class="sub">${orgs.filter(o => o.status === 'active').length} active</div></div>
    </div>

    <div class="tabs">
      <button class="tab active" data-tab="overview">Overview</button>
      <button class="tab" data-tab="users">Users</button>
      <button class="tab" data-tab="organizations">Organizations</button>
      <button class="tab" data-tab="sessions">Sessions</button>
      <button class="tab" data-tab="audit">Audit Log</button>
      <button class="tab" data-tab="threats">Threat Center</button>
    </div>

    <div id="tab-overview" class="tab-content active">
      <div class="grid" style="grid-template-columns: 1fr 1fr;">
        <div class="card">
          <h3>Recent Logins</h3>
          <table>
            <thead><tr><th>User</th><th>Method</th><th>IP</th><th>Time</th></tr></thead>
            <tbody>
              ${recentLogins.map(l => `<tr><td>${l.userId?.substring(0,12) || l.email}</td><td>${l.method}</td><td>${l.ip}</td><td>${new Date(l.timestamp).toLocaleTimeString()}</td></tr>`).join('')}
              ${recentLogins.length === 0 ? '<tr><td colspan="4" style="color:var(--muted)">No recent logins</td></tr>' : ''}
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3>Failed Attempts</h3>
          <table>
            <thead><tr><th>Email</th><th>Reason</th><th>IP</th><th>Time</th></tr></thead>
            <tbody>
              ${failedAttempts.map(a => `<tr><td>${a.email}</td><td>${a.failureReason || 'Unknown'}</td><td>${a.ip}</td><td>${new Date(a.timestamp).toLocaleTimeString()}</td></tr>`).join('')}
              ${failedAttempts.length === 0 ? '<tr><td colspan="4" style="color:var(--muted)">No failed attempts</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>Recommendations</h3>
        <ul class="rec-list">
          ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
          ${report.recommendations.length === 0 ? '<li style="color:var(--low)">No recommendations — system healthy</li>' : ''}
        </ul>
      </div>
    </div>

    <div id="tab-users" class="tab-content">
      <div class="card">
        <h3>Users (${users.length})</h3>
        <table>
          <thead><tr><th>Email</th><th>Display Name</th><th>MFA</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            ${users.map(u => `<tr><td>${u.email}</td><td>${u.displayName || '-'}</td><td>${engine.mfa.getStatus(u.id).enabled ? '<span style="color:var(--low)">✓</span>' : '<span style="color:var(--muted)">—</span>'}</td><td>${u.status}</td><td>${new Date(u.createdAt).toLocaleDateString()}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="tab-organizations" class="tab-content">
      <div class="card">
        <h3>Organizations (${orgs.length})</h3>
        <table>
          <thead><tr><th>Name</th><th>Plan</th><th>Status</th><th>Domain</th><th>Created</th></tr></thead>
          <tbody>
            ${orgs.map(o => `<tr><td>${o.name}</td><td>${o.plan}</td><td>${o.status}</td><td>${o.domain || '-'}</td><td>${new Date(o.createdAt).toLocaleDateString()}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="tab-sessions" class="tab-content">
      <div class="card">
        <h3>Active Sessions (${sessions.length})</h3>
        <table>
          <thead><tr><th>User ID</th><th>IP</th><th>Device</th><th>Created</th><th>Last Access</th><th>Expires</th></tr></thead>
          <tbody>
            ${sessions.map(s => `<tr><td>${s.userId?.substring(0,12)}</td><td>${s.ip}</td><td>${s.userAgent?.substring(0,30) || '-'}</td><td>${new Date(s.createdAt).toLocaleString()}</td><td>${new Date(s.lastAccessedAt).toLocaleString()}</td><td>${new Date(s.expiresAt).toLocaleString()}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="tab-audit" class="tab-content">
      <div class="card">
        <h3>Recent Security Events</h3>
        <table>
          <thead><tr><th>Event</th><th>Actor</th><th>Resource</th><th>Time</th></tr></thead>
          <tbody>
            ${securityEvents.map(e => `<tr><td><span class="severity sev-${e.data.severity || 'info'}"></span>${e.event}</td><td>${e.data.userId?.substring(0,12) || e.data.actor || '-'}</td><td>${e.data.resourceType || e.data.type || '-'}</td><td>${new Date(e.timestamp).toLocaleString()}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="tab-threats" class="tab-content">
      <div class="grid" style="grid-template-columns: 1fr 1fr;">
        <div class="card">
          <h3>Threat Summary</h3>
          <table>
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>Total Threats</td><td>${threats.total}</td></tr>
              <tr><td>Unresolved</td><td style="color:${threats.unresolved > 0 ? 'var(--critical)' : 'var(--low)'}">${threats.unresolved}</td></tr>
              <tr><td>Last 24h</td><td>${threats.last24h}</td></tr>
              <tr><td>Critical</td><td style="color:var(--critical)">${threats.bySeverity?.critical || 0}</td></tr>
              <tr><td>High</td><td style="color:var(--high)">${threats.bySeverity?.high || 0}</td></tr>
              <tr><td>Medium</td><td style="color:var(--medium)">${threats.bySeverity?.medium || 0}</td></tr>
              <tr><td>Low</td><td style="color:var(--low)">${threats.bySeverity?.low || 0}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3>Detected Threats</h3>
          <table>
            <thead><tr><th>Name</th><th>Severity</th><th>Resolved</th></tr></thead>
            <tbody>
              ${engine.threats.getDetectedThreats({}).map(t => `<tr><td>${t.name}</td><td><span class="severity sev-${t.severity}"></span>${t.severity}</td><td>${t.resolved ? '<span style="color:var(--low)">Yes</span>' : '<span style="color:var(--critical)">No</span>'}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
      });
    });
    setInterval(() => location.reload(), 30000);
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}

module.exports = { renderSecurityPage };
