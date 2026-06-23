(function() {
  const CodeViewer = {
    render(file) {
      if (!file) {
        return '<div class="st-code-viewer st-empty"><p>Select a file to view its contents.</p></div>';
      }
      const content = file.content || '// No content';
      const ext = (file.path || file.name || '').split('.').pop();
      return `
        <div class="st-code-viewer">
          <div class="st-code-header">
            <span class="st-code-path">${file.path || file.name || 'untitled'}</span>
            <span class="st-code-lang">${ext}</span>
          </div>
          <pre class="st-code-content"><code>${this.escapeHtml(content)}</code></pre>
        </div>
      `;
    },

    escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  };

  window.CodeViewer = CodeViewer;
})();
