'use client';

import { useEffect, useRef } from 'react';
import type { ActivityEvent } from './types';
import ActivityItem from './ActivityItem';

interface Props {
  events: ActivityEvent[];
}

export default function ActivityFeed({ events }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(events.length);

  useEffect(() => {
    if (events.length > prevCount.current && listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevCount.current = events.length;
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">
        No activity yet
      </div>
    );
  }

  return (
    <div ref={listRef} className="flex max-h-80 flex-col gap-1 overflow-y-auto">
      {events.map((event, i) => (
        <ActivityItem key={event.id} event={event} isLatest={i === 0} />
      ))}
    </div>
  );
}
