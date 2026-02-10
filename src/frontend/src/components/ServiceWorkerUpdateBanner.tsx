import { useServiceWorkerUpdate } from '../hooks/useServiceWorkerUpdate';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';

/**
 * Banner component that notifies users when a new app version is available
 * and provides an explicit action to reload and apply the update.
 */
export function ServiceWorkerUpdateBanner() {
  const { updateAvailable, applyUpdate, isApplyingUpdate } = useServiceWorkerUpdate();

  if (!updateAvailable) {
    return null;
  }

  return (
    <Alert className="mb-4 border-success bg-success/10">
      <RefreshCw className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>A new version of the app is available.</span>
        <Button
          size="sm"
          onClick={applyUpdate}
          disabled={isApplyingUpdate}
          className="shrink-0"
        >
          {isApplyingUpdate ? 'Updating...' : 'Reload to Update'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
