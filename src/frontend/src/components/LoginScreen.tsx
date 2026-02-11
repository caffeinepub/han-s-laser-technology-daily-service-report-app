import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFullLogout } from '../hooks/useFullLogout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserPlus, Loader2, RefreshCw } from 'lucide-react';

export function LoginScreen() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { performLogout } = useFullLogout();
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const isLoggingIn = loginStatus === 'logging-in';
  const hasStaleSession = !!identity; // If identity exists but we're on login screen, it's stale
  const isDisabled = isLoggingIn || isCleaningUp;

  const handleLogin = async () => {
    try {
      // If there's a stale session, clean it up first
      if (hasStaleSession) {
        setIsCleaningUp(true);
        console.log('Detected stale session, cleaning up before login...');
        
        // Perform cleanup without reload
        await performLogout({ skipReload: true });
        
        // Small delay to ensure cleanup completes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsCleaningUp(false);
      }
      
      // Now attempt fresh login
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      setIsCleaningUp(false);
      
      // If we get "already authenticated" error, force cleanup and retry
      if (error.message === 'User is already authenticated') {
        console.log('Got "already authenticated" error, forcing cleanup...');
        setIsCleaningUp(true);
        await performLogout({ skipReload: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsCleaningUp(false);
        
        // Retry login
        try {
          await login();
        } catch (retryError) {
          console.error('Retry login error:', retryError);
        }
      }
    }
  };

  const handleSwitchAccount = async () => {
    setIsCleaningUp(true);
    await performLogout();
    // performLogout will reload the page, so no need to reset state
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
          {isCleaningUp ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-lg font-medium">Preparing login...</span>
            </div>
          ) : isLoggingIn ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-lg font-medium">Connecting...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleLogin}
                  disabled={isDisabled}
                  className="w-full"
                  size="lg"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Sign Up
                </Button>
                <Button
                  onClick={handleLogin}
                  disabled={isDisabled}
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
                    disabled={isDisabled}
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
