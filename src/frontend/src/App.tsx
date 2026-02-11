import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from './hooks/useQueries';
import { AppLayout } from './components/AppLayout';
import { LoginScreen } from './components/LoginScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { AccessDeniedScreen } from './components/AccessDeniedScreen';
import { SessionInvalidScreen } from './components/SessionInvalidScreen';
import { ReportEntryPage } from './pages/ReportEntryPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { Toaster } from '@/components/ui/sonner';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { isAuthError, isMissingProfileError } from './utils/authErrorDetection';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, error: profileError, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const isOnline = useNetworkStatus();

  const isAuthenticated = !!identity;

  // Regression verification: After logout -> login as different II -> confirm no stale profile/reports shown
  // All queries are now principal-scoped, preventing cross-account data leakage

  // Show loading while initializing or fetching actor/profile
  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Not authenticated - show login screen
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <LoginScreen />
      </AppLayout>
    );
  }

  // Handle profile load errors with offline awareness
  if (profileError) {
    // Check if it's a genuine auth error (not just missing profile)
    if (isAuthError(profileError) && !isMissingProfileError(profileError)) {
      return (
        <AppLayout>
          <SessionInvalidScreen />
        </AppLayout>
      );
    }

    // For other errors, show user-friendly message with offline context
    if (!isOnline) {
      return (
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold mb-2">You're Offline</h2>
              <p className="text-muted-foreground">
                Unable to load your profile. Please check your internet connection and try again.
              </p>
            </div>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-2">Error Loading Profile</h2>
            <p className="text-muted-foreground">
              {profileError instanceof Error ? profileError.message : 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Wait for profile to be fetched before deciding on signup vs main app
  // This prevents profile setup modal flash when switching accounts
  if (!profileFetched) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Authenticated but no profile - show signup
  if (userProfile === null) {
    return (
      <AppLayout>
        <ProfileSetup />
      </AppLayout>
    );
  }

  // Authenticated with profile - render router
  return <RouterProvider router={router} context={{ isAdmin: isAdmin || false, adminLoading }} />;
}

// Router context type
interface RouterContext {
  isAdmin: boolean;
  adminLoading: boolean;
}

// Router setup
const rootRoute = createRootRoute<RouterContext>({
  component: () => (
    <AppLayout>
      <Outlet />
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
  validateSearch: (search: Record<string, unknown>): { userPrincipal?: string } => {
    return {
      userPrincipal: typeof search.userPrincipal === 'string' ? search.userPrincipal : undefined,
    };
  },
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
  component: () => {
    // Access context with proper type assertion
    const context = adminUsersRoute.useRouteContext() as RouterContext;
    
    if (context.adminLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      );
    }
    
    if (!context.isAdmin) {
      return <AccessDeniedScreen />;
    }
    
    return <AdminUsersPage />;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  historyRoute,
  reportDetailRoute,
  adminUsersRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    isAdmin: false,
    adminLoading: false,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster />
    </QueryClientProvider>
  );
}
