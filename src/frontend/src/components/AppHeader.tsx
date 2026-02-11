import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useGetCallerUserProfile } from '../hooks/useQueries';
import { useFullLogout } from '../hooks/useFullLogout';
import { copyToClipboard } from '../utils/copyToClipboard';
import { formatPrincipal } from '../utils/formatPrincipal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Menu, FileText, History, Users, LogOut, Copy, Check, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AppHeader() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: userProfile } = useGetCallerUserProfile();
  const { performLogout } = useFullLogout();
  const [copiedDesktop, setCopiedDesktop] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthenticated = !!identity;
  const principalId = identity?.getPrincipal().toString() || '';
  const username = userProfile?.username || formatPrincipal(principalId);
  const displayName = userProfile?.name || username;

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-click
    
    setIsLoggingOut(true);
    try {
      await performLogout();
      // performLogout will reload the page, so no need to reset state
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      toast.error('Logout failed. Please try again.');
    }
  };

  const handleCopyUsername = async (isMobile: boolean = false) => {
    const success = await copyToClipboard(username);
    if (success) {
      if (isMobile) {
        setCopiedMobile(true);
        setTimeout(() => setCopiedMobile(false), 2000);
      } else {
        setCopiedDesktop(true);
        setTimeout(() => setCopiedDesktop(false), 2000);
      }
      toast.success('Username copied to clipboard');
    } else {
      toast.error('Failed to copy username');
    }
  };

  const handleCopyPrincipal = async () => {
    const success = await copyToClipboard(principalId);
    if (success) {
      toast.success('Principal ID copied to clipboard');
    } else {
      toast.error('Failed to copy Principal ID');
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

        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">@{username}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCopyUsername(false)}
                title="Copy username"
                disabled={isLoggingOut}
              >
                {copiedDesktop ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                onClick={() => navigate({ to: '/' })}
                className="gap-2"
                disabled={isLoggingOut}
              >
                <FileText className="h-4 w-4" />
                New Report
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate({ to: '/history' })}
                className="gap-2"
                disabled={isLoggingOut}
              >
                <History className="h-4 w-4" />
                History
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  onClick={() => navigate({ to: '/admin/users' })}
                  className="gap-2"
                  disabled={isLoggingOut}
                >
                  <Users className="h-4 w-4" />
                  Users
                </Button>
              )}
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" disabled={isLoggingOut}>
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-2 sm:hidden">
                  <DropdownMenuLabel className="flex items-center gap-2 px-0">
                    <User className="h-4 w-4" />
                    {displayName}
                  </DropdownMenuLabel>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-xs text-muted-foreground font-medium">
                      @{username}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopyUsername(true)}
                      title="Copy username"
                      disabled={isLoggingOut}
                    >
                      {copiedMobile ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <button
                    onClick={handleCopyPrincipal}
                    className="text-xs text-muted-foreground/70 hover:text-muted-foreground mt-2 flex items-center gap-1 w-full"
                    title="Copy Principal ID"
                    disabled={isLoggingOut}
                  >
                    <span className="truncate font-mono">{formatPrincipal(principalId)}</span>
                    <Copy className="h-3 w-3 flex-shrink-0" />
                  </button>
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem onClick={() => navigate({ to: '/' })} disabled={isLoggingOut}>
                  <FileText className="mr-2 h-4 w-4" />
                  New Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: '/history' })} disabled={isLoggingOut}>
                  <History className="mr-2 h-4 w-4" />
                  History
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: '/admin/users' })} disabled={isLoggingOut}>
                    <Users className="mr-2 h-4 w-4" />
                    Users
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="hidden md:flex gap-2"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
