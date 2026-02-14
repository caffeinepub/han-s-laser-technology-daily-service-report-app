import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function SessionInvalidScreen() {
  const handleRefresh = () => {
    window.location.reload();
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
            An error occurred with your session. Please refresh the page to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRefresh}
            className="w-full"
          >
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
