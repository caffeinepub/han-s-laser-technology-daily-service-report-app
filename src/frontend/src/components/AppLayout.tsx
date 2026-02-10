import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { OfflineBanner } from './OfflineBanner';
import { ServiceWorkerUpdateBanner } from './ServiceWorkerUpdateBanner';
import { getBuildVersionDisplay } from '../utils/buildInfo';
import { Heart } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const appIdentifier = typeof window !== 'undefined' 
    ? encodeURIComponent(window.location.hostname) 
    : 'unknown-app';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <ServiceWorkerUpdateBanner />
        <OfflineBanner />
        {children}
      </main>
      <footer className="border-t border-border bg-card py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-1">
          <div>
            © {new Date().getFullYear()}. Built with <Heart className="inline h-3 w-3 text-destructive fill-destructive" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </div>
          <div className="text-xs opacity-70">
            {getBuildVersionDisplay()}
          </div>
        </div>
      </footer>
    </div>
  );
}
