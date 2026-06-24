import { create } from 'zustand';
import {
  Artifact, ArtifactType, ArtifactVersion, ApprovalStatus, Comment, DiffState,
  EditorState, FileNode, GenerationRecord, ConsoleEntry, ExportConfig,
} from '@/types/workspace';

interface WorkspaceStoreState {
  artifacts: Artifact[];
  versions: ArtifactVersion[];
  comments: Comment[];
  diff: DiffState | null;
  editor: EditorState;
  console: ConsoleEntry[];
  promptInspector: GenerationRecord | null;
  fileTree: FileNode[];
  exportConfig: ExportConfig;
  selectedPreviewElement: {
    selector: string;
    tagName: string;
    content: string;
    provider?: string;
  } | null;

  setArtifacts: (artifacts: Artifact[]) => void;
  addArtifact: (artifact: Artifact) => void;
  updateArtifact: (id: string, updates: Partial<Artifact>) => void;
  removeArtifact: (id: string) => void;
  setArtifactApproval: (id: string, status: ApprovalStatus) => void;

  addVersion: (version: ArtifactVersion) => void;
  setVersions: (versions: ArtifactVersion[]) => void;

  addComment: (comment: Comment) => void;
  resolveComment: (id: string) => void;
  setComments: (comments: Comment[]) => void;

  setDiff: (diff: DiffState | null) => void;
  setEditor: (editor: Partial<EditorState>) => void;
  setActiveEditor: (type: ArtifactType | null, file: string | null) => void;
  setEditing: (editing: boolean) => void;
  setContent: (content: string) => void;
  markSaved: () => void;

  addConsoleEntry: (entry: ConsoleEntry) => void;
  clearConsole: () => void;

  setPromptInspector: (record: GenerationRecord | null) => void;

  setFileTree: (tree: FileNode[]) => void;

  setExportConfig: (config: Partial<ExportConfig>) => void;
  resetExportConfig: () => void;

  setSelectedPreviewElement: (el: WorkspaceStoreState['selectedPreviewElement']) => void;

  getAllArtifactsForApproval: () => Artifact[];
  getRequiredArtifacts: () => Artifact[];
  areRequiredArtifactsApproved: () => boolean;
  getArtifactVersions: (artifactId: string) => ArtifactVersion[];
  getFileTree: () => FileNode[];
  searchFiles: (query: string) => FileNode[];
}

const defaultEditor: EditorState = {
  activeArtifact: null,
  activeFile: null,
  isEditing: false,
  isDirty: false,
  content: '',
  originalContent: '',
};

const defaultExport: ExportConfig = {
  project: true, blueprint: false, context: false, markdown: false,
  html: false, zip: false, json: false, pdf: false,
  openapi: false, terraform: false, deploymentReport: false,
};

const defaultFileTree: FileNode[] = [
  { name: 'pages', type: 'directory', path: '/pages', children: [] },
  { name: 'components', type: 'directory', path: '/components', children: [] },
  { name: 'styles', type: 'directory', path: '/styles', children: [] },
  { name: 'assets', type: 'directory', path: '/assets', children: [] },
  { name: 'public', type: 'directory', path: '/public', children: [] },
  { name: 'seo', type: 'directory', path: '/seo', children: [] },
  { name: 'reports', type: 'directory', path: '/reports', children: [] },
  { name: 'deployment', type: 'directory', path: '/deployment', children: [] },
];

export const useWorkspaceStore = create<WorkspaceStoreState>()((set, get) => ({
  artifacts: [],
  versions: [],
  comments: [],
  diff: null,
  editor: { ...defaultEditor },
  console: [],
  promptInspector: null,
  fileTree: defaultFileTree,
  exportConfig: { ...defaultExport },
  selectedPreviewElement: null,

  setArtifacts: (artifacts) => set({ artifacts }),
  addArtifact: (artifact) => set((s) => ({ artifacts: [...s.artifacts, artifact] })),
  updateArtifact: (id, updates) => set((s) => ({
    artifacts: s.artifacts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  })),
  removeArtifact: (id) => set((s) => ({
    artifacts: s.artifacts.filter((a) => a.id !== id),
  })),
  setArtifactApproval: (id, status) => set((s) => ({
    artifacts: s.artifacts.map((a) => (a.id === id ? { ...a, approval: status } : a)),
  })),

  addVersion: (version) => set((s) => ({ versions: [...s.versions, version] })),
  setVersions: (versions) => set({ versions }),

  addComment: (comment) => set((s) => ({ comments: [...s.comments, comment] })),
  resolveComment: (id) => set((s) => ({
    comments: s.comments.map((c) => (c.id === id ? { ...c, resolved: true, type: 'resolved' as const } : c)),
  })),
  setComments: (comments) => set({ comments }),

  setDiff: (diff) => set({ diff }),
  setEditor: (updates) => set((s) => ({ editor: { ...s.editor, ...updates } })),
  setActiveEditor: (type, file) => set((s) => {
    const existing = type ? s.artifacts.find((a) => a.type === type) : null;
    return {
      editor: {
        ...s.editor,
        activeArtifact: type,
        activeFile: file,
        isEditing: false,
        isDirty: false,
        content: existing?.content ?? '',
        originalContent: existing?.content ?? '',
      },
    };
  }),
  setEditing: (editing) => set((s) => ({ editor: { ...s.editor, isEditing: editing } })),
  setContent: (content) => set((s) => ({ editor: { ...s.editor, content, isDirty: content !== s.editor.originalContent } })),
  markSaved: () => set((s) => ({ editor: { ...s.editor, isDirty: false, originalContent: s.editor.content } })),

  addConsoleEntry: (entry) => set((s) => ({
    console: [...s.console.slice(-199), entry],
  })),
  clearConsole: () => set({ console: [] }),

  setPromptInspector: (record) => set({ promptInspector: record }),

  setFileTree: (tree) => set({ fileTree: tree }),

  setExportConfig: (config) => set((s) => ({
    exportConfig: { ...s.exportConfig, ...config },
  })),
  resetExportConfig: () => set({ exportConfig: { ...defaultExport } }),

  setSelectedPreviewElement: (el) => set({ selectedPreviewElement: el }),

  getAllArtifactsForApproval: () => get().artifacts,
  getRequiredArtifacts: () => get().artifacts.filter((a) => a.type !== 'metadata'),
  areRequiredArtifactsApproved: () => {
    const required = get().artifacts.filter((a) => a.type !== 'metadata');
    return required.length > 0 && required.every((a) => a.approval === 'approved');
  },
  getArtifactVersions: (artifactId) =>
    get().versions.filter((v) => v.artifactId === artifactId).sort((a, b) => b.version - a.version),
  getFileTree: () => get().fileTree,
  searchFiles: (query) => {
    function search(nodes: FileNode[]): FileNode[] {
      const results: FileNode[] = [];
      for (const node of nodes) {
        if (node.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(node);
        }
        if (node.children) {
          results.push(...search(node.children));
        }
      }
      return results;
    }
    return search(get().fileTree);
  },
}));
