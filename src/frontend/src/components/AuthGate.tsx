import { useLocalSessionAuth } from '../hooks/useLocalSessionAuth';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';
import { ProfileSetup } from './ProfileSetup';
import { SignupPendingAccessScreen } from './SignupPendingAccessScreen';
import { SessionInvalidScreen } from './SessionInvalidScreen';
import { isPendingAccessError, isAuthError } from '../utils/authErrorDetection';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, login, status, error: authError } = useLocalSessionAuth();
  const { data: userProfile, isLoading: profileLoading, isFetched, error: profileError } = useGetCallerUserProfile();

  const isSigningIn = status === 'signing-in';
  const isInitializing = status === 'initializing';

  // Show login screen when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In Required
            </CardTitle>
            <CardDescription>
              Please sign in to access the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={login}
              disabled={isSigningIn || isInitializing}
              className="w-full"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for genuine session/auth errors from profile query
  if (profileError && isAuthError(profileError)) {
    return <SessionInvalidScreen />;
  }

  // Check for pending access error (expected post-signup state)
  if (profileError && isPendingAccessError(profileError)) {
    return <SignupPendingAccessScreen />;
  }

  // Show loading while fetching profile
  if (profileLoading || !isFetched) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Show profile setup if no profile exists
  const showProfileSetup = isAuthenticated && isFetched && userProfile === null;
  if (showProfileSetup) {
    return <ProfileSetup />;
  }

  // Render children when authenticated and profile exists
  return <>{children}</>;
}
