import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';

export function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
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
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Sign Up / Log In
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center mt-4">
            New users will complete a signup form after authentication
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
