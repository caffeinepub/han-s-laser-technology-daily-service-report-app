import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from './hooks/useQueries';
import { AppLayout } from './components/AppLayout';
import { LoginScreen } from './components/LoginScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { SessionInvalidScreen } from './components/SessionInvalidScreen';
import { ReportEntryPage } from './pages/ReportEntryPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AccessDeniedScreen } from './components/AccessDeniedScreen';
import { isAuthError, isMissingProfileError } from './utils/authErrorDetection';
import { logSignupFlow, sanitizeErrorMessage } from './utils/signupFlowDebug';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched, error: profileError } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  // Debug logging for authentication state
  useEffect(() => {
    logSignupFlow('Auth state changed', {
      isAuthenticated,
      isInitializing,
      profileLoading,
      isFetched,
      hasProfile: userProfile !== null && userProfile !== undefined,
      hasError: !!profileError,
    });
  }, [isAuthenticated, isInitializing, profileLoading, isFetched, userProfile, profileError]);

  // Log profile errors with sanitization
  useEffect(() => {
    if (profileError) {
      logSignupFlow('Profile fetch error', {
        error: sanitizeErrorMessage(profileError),
        isAuthError: isAuthError(profileError),
        isMissingProfile: isMissingProfileError(profileError),
      });
    }
  }, [profileError]);

  // Show loading during initialization
  if (isInitializing || (isAuthenticated && profileLoading)) {
    logSignupFlow('Showing loading state', { isInitializing, profileLoading });
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  // Detect stale/invalid session: authenticated but profile fetch fails with genuine auth error
  // (NOT a missing profile error, which is expected for new users)
  if (isAuthenticated && isFetched && profileError && isAuthError(profileError) && !isMissingProfileError(profileError)) {
    logSignupFlow('Showing session invalid screen', {
      error: sanitizeErrorMessage(profileError),
    });
    return (
      <AppLayout>
        <SessionInvalidScreen />
      </AppLayout>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    logSignupFlow('Showing login screen', { isAuthenticated: false });
    return (
      <AppLayout>
        <LoginScreen />
      </AppLayout>
    );
  }

  // Show profile setup if authenticated but no profile exists
  // This includes both: userProfile === null (backend returned null) OR missing profile error
  const showProfileSetup = 
    isAuthenticated && 
    !profileLoading && 
    isFetched && 
    (userProfile === null || (profileError && isMissingProfileError(profileError)));
    
  if (showProfileSetup) {
    logSignupFlow('Showing profile setup', {
      userProfileIsNull: userProfile === null,
      hasMissingProfileError: profileError && isMissingProfileError(profileError),
    });
    return (
      <AppLayout>
        <ProfileSetup />
      </AppLayout>
    );
  }

  // Show main app
  logSignupFlow('Showing main app', { hasProfile: !!userProfile });
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
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
  path: '/report/$id',
  component: ReportDetailPage,
});

function AdminUsersRouteComponent() {
  const { data: isAdmin, isLoading } = useIsCallerAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDeniedScreen />;
  }

  return <AdminUsersPage />;
}

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  component: AdminUsersRouteComponent,
});

const routeTree = rootRoute.addChildren([indexRoute, historyRoute, reportDetailRoute, adminUsersRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
