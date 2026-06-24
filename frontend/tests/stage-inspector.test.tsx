import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import StageInspector from '@/components/studio/stage-inspector/StageInspector';

vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  Clock: () => <span data-testid="icon-clock" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  CheckCircle: () => <span data-testid="icon-check" />,
  Loader2: () => <span data-testid="icon-loader" />,
  DollarSign: () => <span data-testid="icon-dollar" />,
  Cpu: () => <span data-testid="icon-cpu" />,
  Activity: () => <span data-testid="icon-activity" />,
}));

describe('StageInspector', () => {
  it('renders stage name and status', () => {
    render(<StageInspector stage={{ name: 'Generation', status: 'running' }} />);
    expect(screen.getByText('Generation')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('shows completed status correctly', () => {
    render(<StageInspector stage={{ name: 'Design', status: 'completed' }} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows failed status with error', () => {
    render(<StageInspector stage={{ name: 'Deploy', status: 'failed', error: 'Timeout connecting to server' }} />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Timeout connecting to server')).toBeInTheDocument();
  });

  it('shows metrics provider, cost, tokens, latency', () => {
    render(<StageInspector stage={{
      name: 'Generation', status: 'completed', provider: 'claude',
      cost: 0.045, tokens: 1500, latency: 3200,
    }} />);
    expect(screen.getByText('claude')).toBeInTheDocument();
    expect(screen.getByText('$0.0450')).toBeInTheDocument();
    expect(screen.getByText('1,500 tokens')).toBeInTheDocument();
    expect(screen.getByText('3.20s')).toBeInTheDocument();
  });

  it('shows duration in the header', () => {
    render(<StageInspector stage={{ name: 'Planner', status: 'completed', duration: 2500 }} />);
    expect(screen.getByText('2.50s')).toBeInTheDocument();
  });

  it('shows output section when output is provided', () => {
    render(<StageInspector stage={{ name: 'Planner', status: 'completed', output: { plan: 'Build site' } }} />);
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByText(/"plan"/)).toBeInTheDocument();
  });

  it('shows logs section when logs exist', () => {
    render(<StageInspector stage={{ name: 'Deploy', status: 'completed', logs: ['Step 1 done', 'Step 2 done'] }} />);
    expect(screen.getByText('Logs (2)')).toBeInTheDocument();
  });

  it('does not show metric icons when all metrics are null', () => {
    const { container } = render(<StageInspector stage={{ name: 'Test', status: 'pending' }} />);
    expect(container.querySelector('[data-testid="icon-dollar"]')).toBeNull();
    expect(container.querySelector('[data-testid="icon-cpu"]')).toBeNull();
    expect(container.querySelector('[data-testid="icon-activity"]')).toBeNull();
  });

  it('renders raw JSON section collapsed', () => {
    render(<StageInspector stage={{ name: 'Test', status: 'pending' }} />);
    expect(screen.getByText('Raw JSON')).toBeInTheDocument();
  });
});
