import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFullLogout } from '../hooks/useFullLogout';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, FileText, History, LogIn, LogOut, User, ShieldCheck, Users } from 'lucide-react';
import { formatUsername } from '../utils/formatPrincipal';

export function AppHeader() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const { performLogout } = useFullLogout();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      await performLogout();
    } else {
      await login();
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
          {/* Desktop Navigation */}
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
            {isAdmin && (
              <Button
                variant="ghost"
                onClick={() => navigate({ to: '/admin/users' })}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Admin
              </Button>
            )}
          </nav>

          {/* Auth Button (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && userProfile && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {formatUsername(userProfile.username)}
                </span>
                {isAdmin && (
                  <ShieldCheck className="h-4 w-4 text-warning" />
                )}
              </div>
            )}
            <Button
              variant={isAuthenticated ? "outline" : "default"}
              onClick={handleAuthAction}
              disabled={isLoggingIn}
              className="gap-2"
            >
              {isLoggingIn ? (
                <>
                  <LogIn className="h-4 w-4 animate-pulse" />
                  Signing In...
                </>
              ) : isAuthenticated ? (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </div>

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {isAuthenticated && userProfile && (
                <>
                  <div className="px-2 py-2 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4" />
                      {formatUsername(userProfile.username)}
                      {isAdmin && (
                        <ShieldCheck className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
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
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate({ to: '/admin/users' })}>
                  <Users className="mr-2 h-4 w-4" />
                  Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAuthAction} disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4 animate-pulse" />
                    Signing In...
                  </>
                ) : isAuthenticated ? (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
