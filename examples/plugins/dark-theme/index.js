const { createPlugin } = require('../../../lib/plugin-sdk');

const manifest = require('./plugin.json');
const plugin = createPlugin(manifest);

plugin.registerWidget('theme-preview', () => {
  return `<div style="padding:20px;background:#0d1117;color:#c9d1d9;border-radius:8px;font-family:monospace">
    <h3 style="color:#58a6ff">Dark Theme Pack</h3>
    <div style="display:flex;gap:8px;margin:12px 0">
      <span style="background:#238636;padding:4px 12px;border-radius:4px;color:#fff">Primary</span>
      <span style="background:#1f6feb;padding:4px 12px;border-radius:4px;color:#fff">Accent</span>
      <span style="background:#da3633;padding:4px 12px;border-radius:4px;color:#fff">Danger</span>
    </div>
    <p style="color:#8b949e">A GitHub-inspired dark theme for all dashboard pages.</p>
  </div>`;
}, { title: 'Theme Preview', width: 2, height: 2 });

plugin.onLoad = function() { console.log('Dark Theme Pack loaded'); };

module.exports = plugin;
