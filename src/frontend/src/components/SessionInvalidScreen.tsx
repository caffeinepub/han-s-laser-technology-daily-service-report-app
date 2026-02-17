import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useFullLogout } from '../hooks/useFullLogout';

export function SessionInvalidScreen() {
  const { performLogout } = useFullLogout();

  const handleRecovery = async () => {
    // Clear local session and cached data, then return to signed-out state
    await performLogout();
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Session Error
          </CardTitle>
          <CardDescription>
            Your session has expired or is no longer valid. Please sign in again to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRecovery}
            className="w-full"
          >
            Return to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
