'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { useWorkspaceStore } from '@/store/workspace';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, checkSession } = useAuthStore();
  const { sidebarOpen } = useWorkspaceStore();

  useEffect(() => {
    const valid = checkSession();
    if (!valid) {
      router.push('/login');
    }
  }, [checkSession, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          <Breadcrumbs className="mb-4" />
          {children}
        </main>
      </div>
    </div>
  );
}
