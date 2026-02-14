import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/AppLayout';
import { ReportEntryPage } from './pages/ReportEntryPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AccessDeniedScreen } from './components/AccessDeniedScreen';
import { useIsCallerAdmin } from './hooks/useQueries';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading, isFetched } = useIsCallerAdmin();

  // Anonymous users cannot access admin routes - show access denied without login prompt
  if (!identity) {
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

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <RouterProvider router={router} />
    </AppLayout>
  ),
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
