import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useFullLogout } from '../hooks/useFullLogout';
import { copyToClipboard } from '../utils/copyToClipboard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, FileText, History, Users, LogOut, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function AppHeader() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { fullLogout } = useFullLogout();
  const [copiedDesktop, setCopiedDesktop] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);

  const isAuthenticated = !!identity;
  const principalId = identity?.getPrincipal().toString() || '';

  const handleLogout = async () => {
    await fullLogout();
  };

  const handleCopyPrincipal = async (isMobile: boolean = false) => {
    const success = await copyToClipboard(principalId);
    if (success) {
      if (isMobile) {
        setCopiedMobile(true);
        setTimeout(() => setCopiedMobile(false), 2000);
      } else {
        setCopiedDesktop(true);
        setTimeout(() => setCopiedDesktop(false), 2000);
      }
      toast.success('User ID copied to clipboard');
    } else {
      toast.error('Failed to copy User ID');
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
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">User ID:</span>
              <code className="px-2 py-1 rounded bg-muted text-foreground font-mono text-xs max-w-[200px] overflow-x-auto whitespace-nowrap">
                {principalId}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCopyPrincipal(false)}
                title="Copy User ID"
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
                  Users
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
                <div className="px-2 py-2 text-xs text-muted-foreground sm:hidden">
                  <div className="font-medium mb-1 flex items-center justify-between">
                    <span>User ID:</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopyPrincipal(true)}
                      title="Copy User ID"
                    >
                      {copiedMobile ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <code className="block px-2 py-1 rounded bg-muted text-foreground font-mono text-xs break-all max-h-20 overflow-y-auto">
                    {principalId}
                  </code>
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
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
                    Users
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="hidden md:flex gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
