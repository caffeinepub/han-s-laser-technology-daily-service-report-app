import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FileText, LogOut, Users } from 'lucide-react';
import { Role } from '../backend';

export function AppHeader() {
  const navigate = useNavigate();
  const { identity, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingOut = loginStatus === 'logging-in';
  const isAdmin = userProfile?.role === Role.admin;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="/assets/generated/hans-laser-tech-india-wordmark.dim_1200x300.png"
              alt="HAN'S LASER TECH INDIA"
              className="h-12 w-auto object-contain"
            />
          </button>

          {isAuthenticated && (
            <nav className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/' })}
              >
                <FileText className="h-4 w-4 mr-2" />
                New Report
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/history' })}
              >
                <FileText className="h-4 w-4 mr-2" />
                History
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/admin/users' })}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
