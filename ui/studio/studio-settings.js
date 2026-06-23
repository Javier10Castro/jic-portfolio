(function() {
  const StudioSettings = {
    render() {
      return `
        <div class="st-settings">
          <h3>Studio Settings</h3>
          <div class="st-settings-section">
            <h4>Default Options</h4>
            <div class="st-form-group">
              <label><input type="checkbox" id="st-auto-deploy" checked /> Auto-deploy on build completion</label>
            </div>
            <div class="st-form-group">
              <label><input type="checkbox" id="st-run-evaluation" checked /> Run evaluation after generation</label>
            </div>
            <div class="st-form-group">
              <label>Notification preference</label>
              <select id="st-notif-pref" class="st-select">
                <option value="all">All notifications</option>
                <option value="errors">Errors only</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
          <div class="st-settings-section">
            <h4>Workspace</h4>
            <div class="st-form-group">
              <label>Default output directory</label>
              <input class="st-input" value="./studio-output" />
            </div>
          </div>
          <div class="st-form-actions">
            <button class="st-btn st-btn-primary" onclick="StudioSettings.save()">Save Settings</button>
          </div>
          <div id="st-settings-result"></div>
        </div>
      `;
    },

    save() {
      const el = document.getElementById('st-settings-result');
      if (el) el.innerHTML = '<div class="st-success">Settings saved (local).</div>';
    }
  };

  window.StudioSettings = StudioSettings;
})();
