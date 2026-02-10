import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4 border-warning bg-warning/10">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You are offline. Some features may not be available until your connection is restored.
      </AlertDescription>
    </Alert>
  );
}
