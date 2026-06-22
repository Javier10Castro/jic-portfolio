const vscode = require('vscode');

class PlatformExtension {
  constructor(context) {
    this._context = context;
    this._apiKey = '';
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this._statusBarItem.text = '$(cloud) Platform';
    this._statusBarItem.command = 'platform.showDashboard';
    this._statusBarItem.show();
  }

  activate() {
    this._registerCommand('platform.login', () => this._login());
    this._registerCommand('platform.showDashboard', () => this._showDashboard());
    this._registerCommand('platform.deploy', () => this._deploy());
    this._registerCommand('platform.showLogs', () => this._showLogs());
    this._registerCommand('platform.showWorkflows', () => this._showWorkflows());
    this._registerCommand('platform.aiChat', () => this._aiChat());
    vscode.window.showInformationMessage('Platform extension activated');
    return this;
  }

  deactivate() { this._statusBarItem.dispose(); }

  _registerCommand(name, handler) {
    const disposable = vscode.commands.registerCommand(name, handler);
    this._context.subscriptions.push(disposable);
  }

  async _login() {
    const apiKey = await vscode.window.showInputBox({ prompt: 'Enter your Platform API key', password: true, ignoreFocusOut: true });
    if (apiKey) { this._apiKey = apiKey; vscode.window.showInformationMessage('Authenticated with Platform'); }
  }

  _showDashboard() {
    const panel = vscode.window.createWebviewPanel('platformDashboard', 'Platform Dashboard', vscode.ViewColumn.One, { enableScripts: true });
    panel.webview.html = `<!DOCTYPE html><html><head><style>body{font-family:system-ui;padding:20px;background:#1a1a2e;color:#e0e0e0}h2{color:#7c3aed}.card{background:#14141f;padding:16px;border-radius:8px;margin:8px 0}</style></head><body><h2>Platform Dashboard</h2><div class="card"><h3>Projects</h3><p>my-app (active)</p></div><div class="card"><h3>Deployments</h3><p>Last deploy: 5 min ago</p></div><div class="card"><h3>Workflows</h3><p>deploy (running)</p></div></body></html>`;
  }

  async _deploy() {
    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Deploying to Platform...' }, async () => { await new Promise(r => setTimeout(r, 2000)); vscode.window.showInformationMessage('Deployment complete!'); });
  }

  _showLogs() {
    const panel = vscode.window.createWebviewPanel('platformLogs', 'Platform Logs', vscode.ViewColumn.One, {});
    panel.webview.html = '<!DOCTYPE html><html><head><style>body{font-family:monospace;padding:10px;background:#0d0d1a;color:#00ff00} .line{padding:2px 0}</style></head><body><div class="line">[INFO] API request completed (200)</div><div class="line">[INFO] Deployment successful</div><div class="line">[WARN] Rate limit at 85%</div></body></html>';
  }

  _showWorkflows() {
    vscode.window.showQuickPick(['deploy (running)', 'build (completed)', 'review (idle)'], { placeHolder: 'Select a workflow' });
  }

  _aiChat() {
    const panel = vscode.window.createWebviewPanel('platformAiChat', 'AI Chat', vscode.ViewColumn.Two, { enableScripts: true });
    panel.webview.html = '<!DOCTYPE html><html><head><style>body{font-family:system-ui;padding:20px;background:#1a1a2e;color:#e0e0e0}.message{background:#14141f;padding:10px;border-radius:8px;margin:4px 0}input{width:100%;padding:8px;background:#0d0d1a;color:#e0e0e0;border:1px solid #333;border-radius:4px}</style></head><body><h2>AI Assistant</h2><div class="message"><b>AI:</b> Hello! How can I help you with the platform today?</div><input placeholder="Ask something..." /></body></html>';
  }
}

function activate(context) { const ext = new PlatformExtension(context); return ext.activate(); }
function deactivate() {}

module.exports = { activate, deactivate, PlatformExtension };
