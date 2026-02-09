import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useFullLogout } from '../hooks/useFullLogout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, FileText, History, Users, LogOut } from 'lucide-react';

export function AppHeader() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { fullLogout } = useFullLogout();

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await fullLogout();
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/assets/generated/hans-laser-logo.dim_512x512.png" 
            alt="Hans Laser Tech India" 
            className="h-10 w-10"
          />
          <h1 className="text-xl font-bold tracking-tight">
            HAN'S LASER TECH INDIA
          </h1>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-4">
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
              <DropdownMenuContent align="end" className="w-48">
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
