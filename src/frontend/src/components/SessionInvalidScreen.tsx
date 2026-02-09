import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogOut } from 'lucide-react';
import { useFullLogout } from '../hooks/useFullLogout';

/**
 * Screen displayed when the user's session is invalid or stale.
 * Provides a clear explanation and action to log out and sign in again.
 */
export function SessionInvalidScreen() {
  const { fullLogout } = useFullLogout();

  const handleLogoutAndRetry = async () => {
    await fullLogout();
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Session Invalid</CardTitle>
          <CardDescription>
            Your authentication session has expired or is no longer valid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This can happen if you were logged in with a different Internet Identity or if your session has expired.
              Please log out and sign in again to continue.
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={handleLogoutAndRetry}
            className="w-full"
            size="lg"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Log Out and Sign In Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
