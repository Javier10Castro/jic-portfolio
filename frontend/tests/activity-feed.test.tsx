import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ActivityFeed from '@/components/studio/activity/ActivityFeed';
import type { ActivityEvent } from '@/components/studio/activity/types';

vi.mock('@/components/studio/activity/ActivityItem', () => ({
  default: ({ event, isLatest }: { event: ActivityEvent; isLatest: boolean }) => (
    <div data-testid="activity-item" data-latest={isLatest}>
      {event.stage} - {event.action}
    </div>
  ),
}));

const makeEvent = (overrides: Partial<ActivityEvent> = {}): ActivityEvent => ({
  id: 'e1',
  stage: 'planner',
  agent: 'Planner',
  action: 'completed',
  status: 'completed',
  timestamp: Date.now(),
  duration: 1200,
  ...overrides,
});

describe('ActivityFeed', () => {
  it('renders empty state when no events', () => {
    render(<ActivityFeed events={[]} />);
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });

  it('renders all events', () => {
    const events = [makeEvent({ id: '1' }), makeEvent({ id: '2', stage: 'design' })];
    render(<ActivityFeed events={events} />);
    const items = screen.getAllByTestId('activity-item');
    expect(items).toHaveLength(2);
  });

  it('marks latest event as isLatest', () => {
    const events = [makeEvent({ id: '1' }), makeEvent({ id: '2' })];
    render(<ActivityFeed events={events} />);
    const items = screen.getAllByTestId('activity-item');
    expect(items[0]).toHaveAttribute('data-latest', 'true');
    expect(items[1]).toHaveAttribute('data-latest', 'false');
  });
});
