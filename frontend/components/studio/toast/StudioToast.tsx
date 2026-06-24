'use client';

import { useEffect, useRef } from 'react';
import { StudioNotification, NotificationType } from '@/lib/sync/notifications';

interface Props {
  notifications: StudioNotification[];
  onDismiss: (id: string) => void;
}

const borderColors: Record<NotificationType, string> = {
  success: 'border-green-500 dark:border-green-400',
  error: 'border-red-500 dark:border-red-400',
  info: 'border-blue-500 dark:border-blue-400',
  warning: 'border-yellow-500 dark:border-yellow-400',
};

export default function StudioToast({ notifications, onDismiss }: Props) {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const currentTimers = timers.current;
    notifications.forEach((n) => {
      if (!currentTimers.has(n.id)) {
        const ms = n.duration ?? 5000;
        const timer = setTimeout(() => onDismiss(n.id), ms);
        currentTimers.set(n.id, timer);
      }
    });
    currentTimers.forEach((timer, id) => {
      if (!notifications.find((n) => n.id === id)) {
        clearTimeout(timer);
        currentTimers.delete(id);
      }
    });
  }, [notifications, onDismiss]);

  const visible = notifications.slice(0, 5);

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {visible.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto bg-white dark:bg-gray-800 border-l-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 transition-opacity duration-300 ease-in-out"
          style={{ borderLeftColor: 'inherit' }}
        >
          <div className={`border-l-4 ${borderColors[n.type]} pl-3 -ml-3`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{n.title}</p>
                {n.message && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                )}
                {n.action && (
                  <button
                    onClick={n.action.onClick}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                  >
                    {n.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => onDismiss(n.id)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
