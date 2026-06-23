(function() {
  const PreviewFrame = {
    render(url) {
      if (!url) {
        return '<div class="st-empty">Deploy the application to get a preview URL.</div>';
      }
      return `
        <div class="st-preview-frame">
          <div class="st-preview-toolbar">
            <span>Preview</span>
            <a href="${url}" target="_blank" class="st-btn st-btn-sm" rel="noopener">Open in Tab</a>
          </div>
          <iframe src="${url}" class="st-preview-iframe" sandbox="allow-scripts allow-same-origin" title="Preview"></iframe>
        </div>
      `;
    }
  };

  window.PreviewFrame = PreviewFrame;
})();
