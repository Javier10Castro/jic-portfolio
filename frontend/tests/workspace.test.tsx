import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Artifact } from '@/types/workspace';

const makeArtifact = (overrides: Partial<Artifact> = {}): Artifact => ({
  id: 'art_1', type: 'blueprint', name: 'Blueprint',
  content: '{}', approval: 'draft', currentVersion: 1,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  useWorkspaceStore.setState({
    artifacts: [], versions: [], comments: [], diff: null,
    editor: { activeArtifact: null, activeFile: null, isEditing: false, isDirty: false, content: '', originalContent: '' },
    console: [], promptInspector: null, fileTree: [], exportConfig: {
      project: true, blueprint: false, context: false, markdown: false,
      html: false, zip: false, json: false, pdf: false,
      openapi: false, terraform: false, deploymentReport: false,
    },
    selectedPreviewElement: null,
  });
});

describe('WorkspaceStore', () => {
  it('adds an artifact', () => {
    useWorkspaceStore.getState().addArtifact(makeArtifact());
    expect(useWorkspaceStore.getState().artifacts).toHaveLength(1);
  });

  it('updates an artifact', () => {
    useWorkspaceStore.getState().addArtifact(makeArtifact());
    useWorkspaceStore.getState().updateArtifact('art_1', { name: 'Updated' });
    expect(useWorkspaceStore.getState().artifacts[0].name).toBe('Updated');
  });

  it('sets artifact approval', () => {
    useWorkspaceStore.getState().addArtifact(makeArtifact());
    useWorkspaceStore.getState().setArtifactApproval('art_1', 'approved');
    expect(useWorkspaceStore.getState().artifacts[0].approval).toBe('approved');
  });

  it('adds version', () => {
    useWorkspaceStore.getState().addVersion({
      id: 'v1', artifactId: 'art_1', version: 2, content: 'updated',
      author: 'user', timestamp: new Date().toISOString(),
    });
    expect(useWorkspaceStore.getState().versions).toHaveLength(1);
  });

  it('getArtifactVersions returns sorted', () => {
    useWorkspaceStore.getState().addVersion({ id: 'v1', artifactId: 'art_1', version: 2, content: 'v2', author: 'u', timestamp: '2025-01-01' });
    useWorkspaceStore.getState().addVersion({ id: 'v2', artifactId: 'art_1', version: 1, content: 'v1', author: 'u', timestamp: '2024-01-01' });
    const versions = useWorkspaceStore.getState().getArtifactVersions('art_1');
    expect(versions).toHaveLength(2);
    expect(versions[0].version).toBe(2);
  });

  it('adds comment', () => {
    useWorkspaceStore.getState().addComment({ id: 'c1', artifactId: 'art_1', type: 'user_note', author: 'You', content: 'Looks good', timestamp: new Date().toISOString() });
    expect(useWorkspaceStore.getState().comments).toHaveLength(1);
  });

  it('resolves comment', () => {
    useWorkspaceStore.getState().addComment({ id: 'c1', artifactId: 'art_1', type: 'user_note', author: 'You', content: 'Fix this', timestamp: new Date().toISOString() });
    useWorkspaceStore.getState().resolveComment('c1');
    expect(useWorkspaceStore.getState().comments[0].resolved).toBe(true);
  });

  it('areRequiredArtifactsApproved returns true when all approved', () => {
    useWorkspaceStore.getState().addArtifact(makeArtifact({ id: 'a1', approval: 'approved' }));
    useWorkspaceStore.getState().addArtifact(makeArtifact({ id: 'a2', type: 'code', approval: 'approved' }));
    expect(useWorkspaceStore.getState().areRequiredArtifactsApproved()).toBe(true);
  });

  it('areRequiredArtifactsApproved returns false when not all approved', () => {
    useWorkspaceStore.getState().addArtifact(makeArtifact({ id: 'a1', approval: 'approved' }));
    useWorkspaceStore.getState().addArtifact(makeArtifact({ id: 'a2', type: 'code', approval: 'draft' }));
    expect(useWorkspaceStore.getState().areRequiredArtifactsApproved()).toBe(false);
  });

  it('sets editor state', () => {
    useWorkspaceStore.getState().setActiveEditor('code', '/pages/index.tsx');
    expect(useWorkspaceStore.getState().editor.activeArtifact).toBe('code');
    expect(useWorkspaceStore.getState().editor.activeFile).toBe('/pages/index.tsx');
  });

  it('marks dirty on content change', () => {
    useWorkspaceStore.getState().setContent('new content');
    expect(useWorkspaceStore.getState().editor.isDirty).toBe(true);
  });

  it('markSaved clears dirty', () => {
    useWorkspaceStore.getState().setContent('new content');
    useWorkspaceStore.getState().markSaved();
    expect(useWorkspaceStore.getState().editor.isDirty).toBe(false);
  });

  it('adds console entry', () => {
    useWorkspaceStore.getState().addConsoleEntry({ id: 'ce1', type: 'log', message: 'test', timestamp: Date.now() });
    expect(useWorkspaceStore.getState().console).toHaveLength(1);
  });

  it('sets export config', () => {
    useWorkspaceStore.getState().setExportConfig({ html: true, pdf: true });
    expect(useWorkspaceStore.getState().exportConfig.html).toBe(true);
    expect(useWorkspaceStore.getState().exportConfig.pdf).toBe(true);
  });

  it('resets export config', () => {
    useWorkspaceStore.getState().setExportConfig({ html: true, pdf: true });
    useWorkspaceStore.getState().resetExportConfig();
    expect(useWorkspaceStore.getState().exportConfig.html).toBe(false);
  });

  it('sets selected preview element', () => {
    useWorkspaceStore.getState().setSelectedPreviewElement({ selector: '#main', tagName: 'div', content: 'Hello', provider: 'claude' });
    expect(useWorkspaceStore.getState().selectedPreviewElement?.selector).toBe('#main');
    expect(useWorkspaceStore.getState().selectedPreviewElement?.provider).toBe('claude');
  });

  it('removes artifact', () => {
    useWorkspaceStore.getState().addArtifact(makeArtifact({ id: 'a1' }));
    useWorkspaceStore.getState().addArtifact(makeArtifact({ id: 'a2' }));
    useWorkspaceStore.getState().removeArtifact('a1');
    expect(useWorkspaceStore.getState().artifacts).toHaveLength(1);
    expect(useWorkspaceStore.getState().artifacts[0].id).toBe('a2');
  });
});
