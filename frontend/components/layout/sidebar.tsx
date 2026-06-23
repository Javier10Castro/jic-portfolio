'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/utils/cn';
import { useWorkspaceStore } from '@/store/workspace';
import { useIsTablet } from '@/hooks/use-media-query';
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  GitBranch,
  Rocket,
  Bot,
  Puzzle,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/studio', label: 'AI Studio', icon: Sparkles },
  { href: '/workflows', label: 'Workflows', icon: GitBranch },
  { href: '/deployments', label: 'Deployments', icon: Rocket },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/plugins', label: 'Plugins', icon: Puzzle },
  { href: '/integrations', label: 'Integrations', icon: Link2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useWorkspaceStore();
  const isTablet = useIsTablet();

  const currentSidebarOpen = isTablet ? sidebarOpen : true;

  return (
    <>
      {isTablet && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-900',
          currentSidebarOpen ? 'w-64' : 'w-0 overflow-hidden md:w-16'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
              P
            </div>
            <span className={cn('font-bold text-gray-900 dark:text-gray-100', !currentSidebarOpen && 'hidden')}>
              Platform
            </span>
          </Link>
          {isTablet ? (
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button onClick={toggleSidebar} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn(!currentSidebarOpen && 'hidden')}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
              pathname === '/profile' && 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-medium dark:bg-gray-700 dark:text-gray-300">
              U
            </div>
            <span className={cn(!currentSidebarOpen && 'hidden')}>Profile</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
