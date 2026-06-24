import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ArtifactVersion } from '@/types/workspace';

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

describe('Version history', () => {
  it('adds versions sequentially', () => {
    const store = useWorkspaceStore.getState();
    store.addVersion({ id: 'v1', artifactId: 'a1', version: 1, content: 'v1', author: 'ai', timestamp: '2025-01-01' });
    store.addVersion({ id: 'v2', artifactId: 'a1', version: 2, content: 'v2', author: 'user', timestamp: '2025-01-02' });
    expect(useWorkspaceStore.getState().versions).toHaveLength(2);
  });

  it('returns versions sorted descending by version', () => {
    const store = useWorkspaceStore.getState();
    store.addVersion({ id: 'v1', artifactId: 'a1', version: 1, content: 'v1', author: 'u', timestamp: '2025-01-01' });
    store.addVersion({ id: 'v2', artifactId: 'a1', version: 3, content: 'v3', author: 'u', timestamp: '2025-01-03' });
    store.addVersion({ id: 'v3', artifactId: 'a1', version: 2, content: 'v2', author: 'u', timestamp: '2025-01-02' });
    const versions = useWorkspaceStore.getState().getArtifactVersions('a1');
    expect(versions[0].version).toBe(3);
    expect(versions[1].version).toBe(2);
    expect(versions[2].version).toBe(1);
  });

  it('filters versions by artifact ID', () => {
    const store = useWorkspaceStore.getState();
    store.addVersion({ id: 'v1', artifactId: 'a1', version: 1, content: 'a1v1', author: 'u', timestamp: '2025-01-01' });
    store.addVersion({ id: 'v2', artifactId: 'a2', version: 1, content: 'a2v1', author: 'u', timestamp: '2025-01-01' });
    expect(useWorkspaceStore.getState().getArtifactVersions('a1')).toHaveLength(1);
    expect(useWorkspaceStore.getState().getArtifactVersions('a1')[0].content).toBe('a1v1');
  });

  it('restore creates a new version with incremented version', () => {
    const store = useWorkspaceStore.getState();
    store.addArtifact({
      id: 'a1', type: 'code', name: 'Test', content: 'current',
      approval: 'draft', currentVersion: 2, createdAt: '', updatedAt: '',
    });
    store.addVersion({ id: 'v1', artifactId: 'a1', version: 1, content: 'original', author: 'ai', timestamp: '2025-01-01' });

    const restored = {
      id: 'v3', artifactId: 'a1', version: 3, content: 'original',
      timestamp: '2025-01-03', author: 'user',
      message: 'Restored from v1',
    };
    store.addVersion(restored);
    store.updateArtifact('a1', { content: 'original', currentVersion: 3 });

    const artifact = useWorkspaceStore.getState().artifacts.find((a) => a.id === 'a1');
    expect(artifact?.currentVersion).toBe(3);
    expect(artifact?.content).toBe('original');
    expect(useWorkspaceStore.getState().versions).toHaveLength(2);
  });
});
