(function() {
  const FileTree = {
    render(files) {
      if (!files || files.length === 0) return '<div class="st-empty">No files generated yet.</div>';
      const tree = this.buildTree(files);
      return '<div class="st-file-tree">' + this.renderTree(tree) + '</div>';
    },

    buildTree(files) {
      const root = {};
      files.forEach(f => {
        const parts = (f.path || f.name || '').split('/');
        let current = root;
        parts.forEach((part, i) => {
          if (i === parts.length - 1) {
            current[part] = { type: 'file', ...f };
          } else {
            if (!current[part]) current[part] = { type: 'dir', children: {} };
            current = current[part].children;
          }
        });
      });
      return root;
    },

    renderTree(node, depth) {
      if (!node || typeof node !== 'object') return '';
      depth = depth || 0;
      const indent = 'padding-left:' + (depth * 16) + 'px';
      let html = '';
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (val && val.type === 'dir') {
          html += `<div class="st-tree-item st-tree-dir" style="${indent}">📁 ${key}</div>`;
          html += this.renderTree(val.children, depth + 1);
        } else if (val && val.type === 'file') {
          html += `<div class="st-tree-item st-tree-file" style="${indent}" onclick="FileTree.openFile('${val.path || val.name || key}')">📄 ${key}</div>`;
        }
      }
      return html;
    },

    openFile(path) {
      const viewer = document.getElementById('st-code-viewer');
      if (viewer && window.CodeViewer) {
        viewer.innerHTML = window.CodeViewer.render({ path, content: '// ' + path + '\n// File content would be displayed here' });
      }
    }
  };

  window.FileTree = FileTree;
})();
