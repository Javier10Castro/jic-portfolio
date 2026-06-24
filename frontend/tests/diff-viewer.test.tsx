import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import DiffViewer from '@/components/studio/diff/DiffViewer';

vi.mock('@/store/workspaceStore', () => ({
  useWorkspaceStore: Object.assign(
    (selector?: any) => {
      const state = {
        artifacts: [{ id: 'art_1', type: 'code', name: 'Test.ts', content: 'line1\nline2', approval: 'draft', currentVersion: 2, createdAt: '', updatedAt: '' }],
        versions: [
          { id: 'v1', artifactId: 'art_1', version: 1, content: 'line1\nline2', author: 'ai', timestamp: '2025-01-01' },
          { id: 'v2', artifactId: 'art_1', version: 2, content: 'line1\nline2\nline3', author: 'user', timestamp: '2025-01-02' },
        ],
        setEditor: vi.fn(),
        updateArtifact: vi.fn(),
        addConsoleEntry: vi.fn(),
      };
      return typeof selector === 'function' ? selector(state) : state;
    },
    { getState: () => ({}) },
  ),
}));

describe('DiffViewer', () => {
  it('renders diff title', () => {
    render(<DiffViewer artifactId="art_1" onClose={vi.fn()} />);
    expect(screen.getByText(/Diff:/)).toBeInTheDocument();
  });

  it('shows artifact name in diff header', () => {
    render(<DiffViewer artifactId="art_1" onClose={vi.fn()} />);
    expect(screen.getByText(/Test\.ts/)).toBeInTheDocument();
  });

  it('shows version selectors', () => {
    render(<DiffViewer artifactId="art_1" onClose={vi.fn()} />);
    expect(screen.getByText('From:')).toBeInTheDocument();
    expect(screen.getByText('To:')).toBeInTheDocument();
  });

  it('shows accept and reject buttons', () => {
    render(<DiffViewer artifactId="art_1" onClose={vi.fn()} />);
    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('renders unchanged lines', () => {
    render(<DiffViewer artifactId="art_1" onClose={vi.fn()} />);
    expect(screen.getByText('line1')).toBeInTheDocument();
    expect(screen.getByText('line2')).toBeInTheDocument();
  });
});
