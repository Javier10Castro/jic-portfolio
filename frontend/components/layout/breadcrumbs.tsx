'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

const labelMap: Record<string, string> = {
  '': 'Home',
  dashboard: 'Dashboard',
  projects: 'Projects',
  studio: 'AI Studio',
  workflows: 'Workflows',
  deployments: 'Deployments',
  agents: 'Agents',
  plugins: 'Plugins',
  integrations: 'Integrations',
  settings: 'Settings',
  profile: 'Profile',
  login: 'Login',
  register: 'Register',
  'forgot-password': 'Forgot Password',
};

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      <Link
        href="/dashboard"
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = index === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {isLast ? (
              <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
