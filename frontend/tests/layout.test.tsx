import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mockUsePathname = vi.fn().mockReturnValue('/dashboard');
const mockUseRouter = vi.fn().mockReturnValue({ push: vi.fn() });

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => mockUseRouter(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

vi.mock('@/hooks/use-media-query', () => ({
  useIsTablet: () => false,
}));

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';

// We need to set up auth store for components that consume it
import { useAuthStore } from '@/store/auth';
import { useWorkspaceStore } from '@/store/workspace';
import { useNotificationsStore } from '@/store/notifications';

beforeEach(() => {
  useAuthStore.setState({ session: null, isAuthenticated: false, error: null, isLoading: false });
  useWorkspaceStore.setState({ sidebarOpen: true, activeView: 'dashboard', sidebarWidth: 280 });
  useNotificationsStore.setState({ notifications: [], unreadCount: 0 });
});

describe('Breadcrumbs', () => {
  it('renders nothing for root path', () => {
    mockUsePathname.mockReturnValue('/');
    const { container } = render(<Breadcrumbs />);
    expect(container.firstChild).toBeNull();
  });
});

describe('Sidebar', () => {
  it('renders navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('AI Studio')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});

describe('TopNav', () => {
  it('renders theme toggle button', () => {
    render(<TopNav />);
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
  });
});

// Helper to get the mock function from the cached module
function usePathname() {
  return '/dashboard';
}
