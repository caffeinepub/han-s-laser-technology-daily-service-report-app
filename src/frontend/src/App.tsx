import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/AppLayout';
import { AuthGate } from './components/AuthGate';
import { ReportEntryPage } from './pages/ReportEntryPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AccessDeniedScreen } from './components/AccessDeniedScreen';
import { useIsCallerAdmin } from './hooks/useQueries';
import { useLocalSessionAuth, LocalSessionAuthProvider } from './hooks/useLocalSessionAuth';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { ensureNoInternetIdentityAutoAuth } from './utils/ensureNoInternetIdentityAutoAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useLocalSessionAuth();
  const { data: isAdmin, isLoading, isFetched } = useIsCallerAdmin();

  // Anonymous users cannot access admin routes - show access denied without login prompt
  if (!isAuthenticated) {
    return <AccessDeniedScreen />;
  }

  if (isLoading || !isFetched) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Treat as non-admin unless positively confirmed
  if (!isAdmin) {
    return <AccessDeniedScreen />;
  }

  return <>{children}</>;
}

// Root layout component that wraps all routes with AuthGate
function RootLayout() {
  return (
    <AppLayout>
      <AuthGate>
        <Outlet />
      </AuthGate>
    </AppLayout>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ReportEntryPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: ReportHistoryPage,
});

const reportDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/report/$reportId',
  component: ReportDetailPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  component: () => (
    <AdminRouteGuard>
      <AdminUsersPage />
    </AdminRouteGuard>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  historyRoute,
  reportDetailRoute,
  adminUsersRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  // Clean up any Internet Identity persistence on mount
  useEffect(() => {
    ensureNoInternetIdentityAutoAuth();
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalSessionAuthProvider>
        <AppContent />
      </LocalSessionAuthProvider>
    </QueryClientProvider>
  );
}
