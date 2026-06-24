import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import BlueprintEditor from '@/components/studio/editors/BlueprintEditor';
import ContentEditor from '@/components/studio/editors/ContentEditor';
import CodeEditor from '@/components/studio/editors/CodeEditor';
import { Artifact } from '@/types/workspace';

vi.mock('@/store/workspaceStore', () => ({
  useWorkspaceStore: Object.assign(
    (selector?: any) => {
      const state = {
        setContent: vi.fn(),
        setEditing: vi.fn(),
        markSaved: vi.fn(),
        updateArtifact: vi.fn(),
        addVersion: vi.fn(),
        setArtifactApproval: vi.fn(),
        addConsoleEntry: vi.fn(),
        addComment: vi.fn(),
        resolveComment: vi.fn(),
      };
      return typeof selector === 'function' ? selector(state) : state;
    },
    { getState: () => ({}) },
  ),
}));

const makeArtifact = (overrides: Partial<Artifact> = {}): Artifact => ({
  id: 'art_1', type: 'blueprint', name: 'Blueprint',
  content: '{"pages": ["home"]}', approval: 'draft', currentVersion: 1,
  createdAt: '2025-01-01', updatedAt: '2025-01-01',
  ...overrides,
});

describe('BlueprintEditor', () => {
  it('renders title when artifact exists', () => {
    render(<BlueprintEditor artifact={makeArtifact()} isEditing={false} content='{}' onContentChange={vi.fn()} />);
    expect(screen.getByText('Blueprint')).toBeInTheDocument();
  });

  it('shows empty state when no artifact', () => {
    render(<BlueprintEditor artifact={undefined} isEditing={false} content='' onContentChange={vi.fn()} />);
    expect(screen.getByText('No blueprint artifact available')).toBeInTheDocument();
  });

  it('shows textarea when editing', () => {
    render(<BlueprintEditor artifact={makeArtifact()} isEditing={true} content='{"key": "value"}' onContentChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('{"key": "value"}');
  });

  it('calls onContentChange when editing', () => {
    const onChange = vi.fn();
    render(<BlueprintEditor artifact={makeArtifact()} isEditing={true} content='{}' onContentChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '{"new": "data"}' } });
    expect(onChange).toHaveBeenCalledWith('{"new": "data"}');
  });

  it('shows copy button', () => {
    render(<BlueprintEditor artifact={makeArtifact()} isEditing={false} content='test' onContentChange={vi.fn()} />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('shows approval badge', () => {
    render(<BlueprintEditor artifact={makeArtifact({ approval: 'needs_review' })} isEditing={false} content='' onContentChange={vi.fn()} />);
    expect(screen.getByText('Needs Review')).toBeInTheDocument();
  });
});

describe('ContentEditor', () => {
  it('shows content editor title', () => {
    render(<ContentEditor artifact={makeArtifact()} isEditing={false} content='# Hello' onContentChange={vi.fn()} />);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('CodeEditor', () => {
  it('shows code editor title', () => {
    render(<CodeEditor artifact={makeArtifact()} isEditing={false} content='<div>Hi</div>' onContentChange={vi.fn()} />);
    expect(screen.getByText('Code')).toBeInTheDocument();
  });
});
