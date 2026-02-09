import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFullLogout } from '../hooks/useFullLogout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserPlus, Loader2, RefreshCw } from 'lucide-react';

export function LoginScreen() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { fullLogout } = useFullLogout();

  const isLoggingIn = loginStatus === 'logging-in';
  const hasStaleSession = !!identity; // If identity exists but we're on login screen, it's stale

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleSwitchAccount = async () => {
    await fullLogout();
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/generated/hans-laser-tech-india-wordmark.dim_1200x300.png"
              alt="HAN'S LASER TECH INDIA"
              className="h-16 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Welcome to HAN'S LASER TECH INDIA</CardTitle>
          <CardDescription>
            Daily Service Report System - Sign up or log in with Internet Identity to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoggingIn ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-lg font-medium">Connecting...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full"
                  size="lg"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Sign Up
                </Button>
                <Button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Log In
                </Button>
              </div>
              
              {hasStaleSession && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center mb-2">
                    Having trouble logging in?
                  </p>
                  <Button
                    onClick={handleSwitchAccount}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Switch Account / Log Out Completely
                  </Button>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground text-center">
                New users will complete a signup form after authentication
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
