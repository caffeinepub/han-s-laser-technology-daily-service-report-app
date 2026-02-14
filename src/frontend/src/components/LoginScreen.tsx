import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';

export function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const [error, setError] = useState<string>('');

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    setError('');
    try {
      await login();
    } catch (err: any) {
      // Sanitize error message - don't expose internal details
      const errorMessage = err?.message || 'Login failed';
      if (errorMessage.toLowerCase().includes('user') && errorMessage.toLowerCase().includes('interrupt')) {
        setError('Login was cancelled. Please try again.');
      } else if (errorMessage.toLowerCase().includes('popup') || errorMessage.toLowerCase().includes('window')) {
        setError('Login window was blocked or closed. Please allow popups and try again.');
      } else {
        setError('Unable to sign in. Please try again.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Sign In Required
          </CardTitle>
          <CardDescription>
            Please sign in with Internet Identity to access the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In with Internet Identity
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              New users will be prompted to complete signup after signing in
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
