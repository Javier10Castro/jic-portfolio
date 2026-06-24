import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import PromptInspector from '@/components/studio/prompt/PromptInspector';
import { GenerationRecord } from '@/types/workspace';

const makeRecord = (overrides: Partial<GenerationRecord> = {}): GenerationRecord => ({
  id: 'g1', type: 'generation', provider: 'claude', model: 'claude-3-opus',
  systemPrompt: 'You are a helpful assistant.',
  userPrompt: 'Build a landing page',
  developerPrompt: 'Use React and Tailwind.',
  context: { framework: 'nextjs' },
  temperature: 0.7, tokens: 1500, latency: 3200,
  timestamp: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('PromptInspector', () => {
  it('renders record type and provider', () => {
    render(<PromptInspector record={makeRecord()} onClose={vi.fn()} />);
    expect(screen.getByText(/generation/)).toBeInTheDocument();
    const matches = screen.getAllByText(/claude-3-opus/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows system prompt section', () => {
    render(<PromptInspector record={makeRecord()} onClose={vi.fn()} />);
    expect(screen.getByText('System Prompt')).toBeInTheDocument();
    expect(screen.getByText('You are a helpful assistant.')).toBeInTheDocument();
  });

  it('shows developer prompt section', () => {
    render(<PromptInspector record={makeRecord({ developerPrompt: 'Use React.' })} onClose={vi.fn()} />);
    expect(screen.getByText('Developer Prompt')).toBeInTheDocument();
    expect(screen.getByText('Use React.')).toBeInTheDocument();
  });

  it('shows user prompt section', () => {
    render(<PromptInspector record={makeRecord()} onClose={vi.fn()} />);
    expect(screen.getByText('User Prompt')).toBeInTheDocument();
    expect(screen.getByText('Build a landing page')).toBeInTheDocument();
  });

  it('shows context section', () => {
    render(<PromptInspector record={makeRecord()} onClose={vi.fn()} />);
    expect(screen.getByText('Context')).toBeInTheDocument();
  });

  it('shows temperature, tokens, latency', () => {
    render(<PromptInspector record={makeRecord({ temperature: 0.5, tokens: 2000, latency: 1500 })} onClose={vi.fn()} />);
    expect(screen.getByText('0.5')).toBeInTheDocument();
    expect(screen.getByText('2000 tokens')).toBeInTheDocument();
    expect(screen.getByText('1500ms')).toBeInTheDocument();
  });

  it('shows close button', () => {
    render(<PromptInspector record={makeRecord()} onClose={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    render(<PromptInspector record={makeRecord({ developerPrompt: undefined, temperature: undefined })} onClose={vi.fn()} />);
    expect(screen.queryByText('Developer Prompt')).not.toBeInTheDocument();
  });
});
