import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useIsCallerAdmin, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFullLogout } from '../hooks/useFullLogout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, FileText, History, Users, LogOut, Loader2 } from 'lucide-react';

export function AppHeader() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isFetched: adminFetched } = useIsCallerAdmin();
  const { data: userProfile } = useGetCallerUserProfile();
  const { performLogout } = useFullLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthenticated = !!identity;

  // Only show admin nav when authenticated and positively confirmed
  const showAdminNav = isAuthenticated && adminFetched && isAdmin === true;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await performLogout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/assets/hans%20logo.png" 
            alt="Hans Laser Tech India" 
            className="h-10 w-10 object-contain"
          />
          <h1 className="text-xl font-bold tracking-tight">
            HAN'S LASER TECH INDIA
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && userProfile && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="font-medium">{userProfile.name}</span>
            </div>
          )}

          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/' })}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              New Report
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/history' })}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              History
            </Button>
            {showAdminNav && (
              <Button
                variant="ghost"
                onClick={() => navigate({ to: '/admin/users' })}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Users
              </Button>
            )}
            {isAuthenticated && (
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="gap-2"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Sign Out
              </Button>
            )}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {isAuthenticated && userProfile && (
                <>
                  <div className="px-2 py-2 sm:hidden">
                    <div className="font-medium">{userProfile.name}</div>
                    <div className="text-xs text-muted-foreground">@{userProfile.username}</div>
                  </div>
                  <DropdownMenuSeparator className="sm:hidden" />
                </>
              )}
              <DropdownMenuItem onClick={() => navigate({ to: '/' })}>
                <FileText className="mr-2 h-4 w-4" />
                New Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: '/history' })}>
                <History className="mr-2 h-4 w-4" />
                History
              </DropdownMenuItem>
              {showAdminNav && (
                <DropdownMenuItem onClick={() => navigate({ to: '/admin/users' })}>
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </DropdownMenuItem>
              )}
              {isAuthenticated && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Sign Out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
