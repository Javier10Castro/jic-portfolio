# Platform Frontend Architecture

## Overview

The Platform frontend is a Next.js 16 application using the App Router, built with TypeScript, TailwindCSS, and modern React patterns. It serves as the unified user interface for the Platform API, consuming all existing backend services.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS v4
- **UI Components**: Custom design system built with Radix UI primitives + class-variance-authority
- **State Management**: Zustand (5 stores)
- **Server State**: TanStack React Query (configured, ready for API integration)
- **HTTP Client**: Axios with interceptors, retry logic, token refresh
- **Animation**: Framer Motion (available, not yet applied)
- **Icons**: Lucide React
- **Theme**: next-themes (dark/light/system)
- **Testing**: Vitest + @testing-library/react

## Folder Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth route group
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/        # Protected dashboard route group
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── studio/
│   │   ├── workflows/
│   │   ├── deployments/
│   │   ├── agents/
│   │   ├── plugins/
│   │   ├── integrations/
│   │   ├── settings/
│   │   └── profile/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── not-found.tsx       # 404
│   ├── error.tsx           # 500 error boundary
│   ├── globals.css         # Global styles + Tailwind
│   ├── manifest.ts         # PWA manifest
│   └── robots.ts           # SEO robots
├── components/
│   ├── layout/             # Layout components
│   │   ├── sidebar.tsx
│   │   ├── top-nav.tsx
│   │   └── breadcrumbs.tsx
│   └── ui/                 # Design system
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── skeleton.tsx
│       ├── modal.tsx
│       ├── dropdown.tsx
│       ├── tabs.tsx
│       ├── alert.tsx
│       ├── toast.tsx
│       ├── avatar.tsx
│       ├── progress.tsx
│       ├── table.tsx
│       ├── empty-state.tsx
│       └── loading-spinner.tsx
├── hooks/                  # Custom React hooks
│   ├── use-auth.ts
│   ├── use-projects.ts
│   └── use-media-query.ts
├── providers/              # React context providers
│   ├── index.tsx
│   ├── theme-provider.tsx
│   ├── query-provider.tsx
│   └── session-provider.tsx
├── services/               # API client
│   └── api.ts
├── store/                  # Zustand state stores
│   ├── auth.ts
│   ├── workspace.ts
│   ├── projects.ts
│   ├── notifications.ts
│   └── theme.ts
├── types/                  # TypeScript type definitions
│   ├── api.ts
│   ├── auth.ts
│   ├── project.ts
│   ├── studio.ts
│   ├── workflow.ts
│   └── index.ts
├── utils/                  # Utility functions
│   ├── cn.ts
│   └── format.ts
├── public/                 # Static assets
├── tests/                  # Test files
│   ├── api.test.ts
│   ├── auth.test.tsx
│   ├── components.test.tsx
│   ├── layout.test.tsx
│   ├── stores.test.ts
│   ├── theme.test.tsx
│   └── setup.ts
├── middleware.ts           # Auth middleware
├── vitest.config.ts
├── next.config.ts
└── package.json
```

## Routing Architecture

Route groups separate public and protected routes:

### Public Routes (no auth required)
| Path | Page | Description |
|------|------|-------------|
| `/` | Landing | Marketing page with hero, features, pricing |
| `/login` | Login | Authentication |
| `/register` | Register | New user registration |
| `/forgot-password` | Forgot Password | Password reset |

### Protected Routes (auth required via middleware + session check)
| Path | Page | Description |
|------|------|-------------|
| `/dashboard` | Dashboard | Overview with stats and recent activity |
| `/projects` | Projects | Project management |
| `/studio` | AI Studio | AI Product Studio interface |
| `/workflows` | Workflows | Workflow management |
| `/deployments` | Deployments | Deployment tracking |
| `/agents` | Agents | AI agent management |
| `/plugins` | Plugins | Plugin marketplace |
| `/integrations` | Integrations | Third-party connections |
| `/settings` | Settings | User and app settings |
| `/profile` | Profile | User profile |

### Error Pages
| Path | Type | Description |
|------|------|-------------|
| `/_not-found` | 404 | Page not found |
| `error.tsx` | 500 | Error boundary |

## Component Hierarchy

```
RootLayout
├── ThemeProvider (next-themes)
├── QueryProvider (React Query)
├── SessionProvider (auth context)
├── ToastProvider
│
├── Landing Page (public)
│
└── Auth Pages (public)
│
└── DashboardLayout (protected)
    ├── Sidebar
    ├── TopNav
    │   ├── ThemeToggle
    │   ├── NotificationsDropdown
    │   ├── Avatar
    │   └── LogoutButton
    ├── Breadcrumbs
    └── Page Content
```

## State Management

### Zustand Stores

| Store | Key State | Persistence |
|-------|-----------|-------------|
| `auth` | session, isAuthenticated | localStorage (auth-session) |
| `workspace` | sidebarOpen, activeView | None |
| `projects` | projects[], selectedProject | None |
| `notifications` | notifications[], unreadCount | None |
| `theme` | theme (light/dark/system) | localStorage (theme-preference) |

### Data Flow

```
User Action → Component → Zustand Store Action → API Client (Axios)
                                                        ↓
Component ← Zustand State Update ← Response (with retry/auth refresh)
```

## API Integration

The API client (`services/api.ts`) provides:

- **Automatic retry**: Up to 3 retries with exponential backoff
- **Token management**: Bearer token injection from auth store
- **Token refresh**: Automatic 401 handling with refresh token
- **Request IDs**: Each request gets a unique `X-Request-ID`
- **Error normalization**: Consistent error objects
- **Typed methods**: `get<T>()`, `post<T>()`, `put<T>()`, `patch<T>()`, `delete<T>()`

### Authentication Flow

```
Login → POST /api/v1/auth/login → Token + User
    ↓
Store in Zustand (persisted to localStorage)
    ↓
API client reads token from store → Bearer header
    ↓
Token expires → 401 → API client auto-refreshes
    ↓
Refresh fails → Clear session → Redirect to /login
```

### Middleware Protection

```
Request → middleware.ts
    ↓
Public path? → Allow
    ↓
Protected path → Check auth cookie → Valid? → Allow
    ↓
Invalid → Redirect to /login
```

## Theme System

- **Provider**: next-themes with `attribute="class"`
- **Modes**: light, dark, system (follows OS preference)
- **Persistence**: Theme preference stored in localStorage
- **CSS**: TailwindCSS dark mode via `dark:` prefix
- **Implementation**: Theme toggle in TopNav calls `setTheme()`

## Design System

All components support:
- **Dark mode** via TailwindCSS `dark:` variants
- **Accessibility**: ARIA attributes, keyboard navigation, focus management
- **Responsive**: Mobile-first with breakpoints at sm/md/lg/xl
- **Variants**: Using `class-variance-authority` for component variants

## Performance

- **Static Generation**: All pages are statically generated (○) where possible
- **Code Splitting**: Automatic via Next.js App Router
- **Image Optimization**: Next.js Image component available
- **Lazy Loading**: Dynamic imports available via `next/dynamic`
- **Memoization**: React.memo available for expensive components

## SEO

- Metadata in root layout (title, description, OG)
- OpenGraph + Twitter card support
- robots.txt (public/disallow rules)
- manifest.json (PWA support)
- Semantic HTML throughout

## Testing

43 tests across 6 files:

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `api.test.ts` | 3 | API client methods |
| `auth.test.tsx` | 5 | Auth store state management |
| `components.test.tsx` | 14 | Button, Badge, Card, EmptyState, LoadingSpinner |
| `layout.test.tsx` | 3 | Sidebar, TopNav, Breadcrumbs |
| `stores.test.ts` | 14 | All 5 Zustand stores |
| `theme.test.tsx` | 4 | Theme provider + store |

## Deployment

- **Platform**: Vercel (compatible)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Environment Variables**: `NEXT_PUBLIC_API_URL` (API base URL)
- **Node Version**: 22.x

### Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

## Developer Guide

### Quick Start

```bash
cd frontend
npm install
npm run dev      # Development server at localhost:3000
npm run build    # Production build
npm run test     # Run tests
npm run lint     # ESLint
```

### Adding a New Page

1. Create the page file in the appropriate route group
2. Import the layout (public pages) or use dashboard layout (protected)
3. Add sidebar link in `components/layout/sidebar.tsx`
4. Add breadcrumb label in `components/layout/breadcrumbs.tsx`

### Adding a New Store

1. Create in `store/filename.ts`
2. Use `create()` or `create(persist())` from Zustand
3. Consume with `useStoreName()` hook

### Adding a New Component

1. Create in `components/ui/filename.tsx`
2. Use `cn()` utility for className merging
3. Support `className` prop for customization
4. Support dark mode via `dark:` variants
5. Add ARIA attributes for accessibility
