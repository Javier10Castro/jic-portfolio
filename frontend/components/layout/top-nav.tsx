'use client';

import { useTheme } from 'next-themes';
import { useWorkspaceStore } from '@/store/workspace';
import { useNotificationsStore } from '@/store/notifications';
import { useAuthStore } from '@/store/auth';
import { useIsTablet } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sun, Moon, Bell, Menu, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export function TopNav() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useWorkspaceStore();
  const { unreadCount, notifications, markAllAsRead } = useNotificationsStore();
  const { session, logout } = useAuthStore();
  const router = useRouter();
  const isTablet = useIsTablet();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
      <div className="flex items-center gap-3">
        {isTablet && (
          <button onClick={toggleSidebar} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 text-sm ${
                        !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                        {n.message && <p className="mt-0.5 text-gray-500 dark:text-gray-400">{n.message}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Avatar size="sm" fallback={session?.user?.name?.charAt(0) || 'U'} />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            logout();
            router.push('/login');
          }}
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
