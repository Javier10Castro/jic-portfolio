export type ArtifactType =
  | 'blueprint' | 'context' | 'design' | 'content' | 'pages'
  | 'assets' | 'code' | 'seo' | 'deployment' | 'metadata';

export type ApprovalStatus = 'draft' | 'needs_review' | 'approved' | 'rejected';

export interface Artifact {
  id: string;
  type: ArtifactType;
  name: string;
  content: string;
  language?: string;
  approval: ApprovalStatus;
  currentVersion: number;
  provider?: string;
  tokens?: number;
  cost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactVersion {
  id: string;
  artifactId: string;
  version: number;
  content: string;
  provider?: string;
  tokens?: number;
  cost?: number;
  author: string;
  timestamp: string;
  message?: string;
}

export interface Comment {
  id: string;
  artifactId: string;
  type: 'ai_suggestion' | 'user_note' | 'resolved';
  author: string;
  content: string;
  timestamp: string;
  resolved?: boolean;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

export interface DiffState {
  before: string;
  after: string;
  lines: DiffLine[];
  beforeVersion: number;
  afterVersion: number;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  artifactId?: string;
}

export interface EditorState {
  activeArtifact: ArtifactType | null;
  activeFile: string | null;
  isEditing: boolean;
  isDirty: boolean;
  content: string;
  originalContent: string;
}

export interface GenerationRecord {
  id: string;
  type: string;
  provider: string;
  model: string;
  systemPrompt?: string;
  userPrompt?: string;
  developerPrompt?: string;
  context?: Record<string, unknown>;
  temperature?: number;
  tokens?: number;
  latency?: number;
  timestamp: string;
}

export interface ConsoleEntry {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'sse' | 'ai_call' | 'perf';
  message: string;
  data?: unknown;
  timestamp: number;
}

export interface ExportConfig {
  project?: boolean;
  blueprint?: boolean;
  context?: boolean;
  markdown?: boolean;
  html?: boolean;
  zip?: boolean;
  json?: boolean;
  pdf?: boolean;
  openapi?: boolean;
  terraform?: boolean;
  deploymentReport?: boolean;
}

export const WORKSPACE_ARTIFACTS: ArtifactType[] = [
  'blueprint', 'context', 'design', 'content', 'pages',
  'assets', 'code', 'seo', 'deployment', 'metadata',
];

export const EDITOR_TABS: { id: ArtifactType; label: string }[] = [
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'context', label: 'Context' },
  { id: 'design', label: 'Design' },
  { id: 'content', label: 'Content' },
  { id: 'pages', label: 'Pages' },
  { id: 'assets', label: 'Assets' },
  { id: 'code', label: 'Code' },
  { id: 'seo', label: 'SEO' },
  { id: 'deployment', label: 'Deployment' },
];

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  draft: 'Draft',
  needs_review: 'Needs Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const APPROVAL_COLORS: Record<ApprovalStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  needs_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
