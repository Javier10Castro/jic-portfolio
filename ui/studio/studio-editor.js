(function() {
  const StudioEditor = {
    currentProjectId: null,
    files: [],

    render() {
      return `
        <div class="st-editor-layout">
          <div class="st-editor-sidebar">
            <h4>Project Files</h4>
            <div id="st-file-tree">${window.FileTree ? window.FileTree.render([]) : '<p class="st-empty">No files yet</p>'}</div>
          </div>
          <div class="st-editor-main">
            <div id="st-code-viewer">${window.CodeViewer ? window.CodeViewer.render() : '<div class="st-empty"><p>Select a file to view its contents.</p><p class="st-subtitle">Files appear after the generator stage completes.</p></div>'}</div>
          </div>
        </div>
      `;
    }
  };

  window.StudioEditor = StudioEditor;
})();
