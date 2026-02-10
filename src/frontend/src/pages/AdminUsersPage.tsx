import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useListUsers, useDeleteUser, useIsCallerAdmin, usePurgeLegacyReportsAndUsers, useResetToFreshApp } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2, Users, ShieldCheck, Wrench, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { AccessDeniedScreen } from '../components/AccessDeniedScreen';
import { Role } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminCheckLoading, isFetched: adminCheckFetched } = useIsCallerAdmin();
  const { data: users, isLoading: usersLoading, error } = useListUsers();
  const deleteUser = useDeleteUser();
  const purgeLegacyData = usePurgeLegacyReportsAndUsers();
  const resetToFreshApp = useResetToFreshApp();
  const { clear, identity } = useInternetIdentity();
  const [userToDelete, setUserToDelete] = useState<Principal | null>(null);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Show loading while checking admin status
  if (adminCheckLoading || !adminCheckFetched) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return <AccessDeniedScreen />;
  }

  // Handle authorization errors from backend (e.g., non-admin trying to list users)
  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('admin')) {
      return <AccessDeniedScreen />;
    }
  }

  const handleDeleteClick = (user: Principal) => {
    setUserToDelete(user);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await deleteUser.mutateAsync(userToDelete);
        setUserToDelete(null);
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handlePurgeConfirm = async () => {
    setPurgeError(null);
    try {
      await purgeLegacyData.mutateAsync();
      setShowPurgeDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete all old data. Please try again.';
      setPurgeError(errorMessage);
    }
  };

  const handleResetConfirm = async () => {
    setResetError(null);
    try {
      await resetToFreshApp.mutateAsync();
      // Force logout and clear all cached data
      await clear();
      setShowResetDialog(false);
      // The app will automatically reload to anonymous state
      window.location.reload();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset system. Please try again.';
      setResetError(errorMessage);
    }
  };

  const handleViewUserReports = (principal: Principal) => {
    navigate({
      to: '/history',
      search: { userPrincipal: principal.toString() },
    });
  };

  const currentUserPrincipal = identity?.getPrincipal().toString();
  const adminCount = users?.filter(([_, profile]) => profile.role === Role.admin).length || 0;
  const engineerCount = users?.filter(([_, profile]) => profile.role === Role.engineer).length || 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all registered users in the system
          </p>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Wrench className="h-4 w-4" />
              Engineers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{engineerCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* All Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Registered Users</CardTitle>
          <CardDescription>
            Complete list of all users with their roles and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-3">
              {users.map(([principal, profile]) => {
                const isCurrentUser = principal.toString() === currentUserPrincipal;
                return (
                  <div
                    key={principal.toString()}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      isCurrentUser ? 'bg-accent/10 border-accent' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium truncate">{profile.name}</p>
                        <Badge variant={profile.role === Role.admin ? 'default' : 'secondary'}>
                          {profile.role === Role.admin ? (
                            <>
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <Wrench className="h-3 w-3 mr-1" />
                              Engineer
                            </>
                          )}
                        </Badge>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {profile.email} • {profile.mobileNumber}
                      </p>
                      <p className="text-xs text-muted-foreground/70 truncate mt-1 font-mono">
                        Principal: {principal.toString().slice(0, 20)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUserReports(principal)}
                        title="View this user's reports"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Reports
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(principal)}
                        disabled={deleteUser.isPending || isCurrentUser}
                        title={isCurrentUser ? "Cannot delete your own account" : "Delete user"}
                      >
                        <Trash2 className={`h-4 w-4 ${isCurrentUser ? 'text-muted-foreground' : 'text-destructive'}`} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Delete All Old Data
            </CardTitle>
            <CardDescription>
              Remove all reports and users except your own account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowPurgeDialog(true)}
              disabled={purgeLegacyData.isPending}
            >
              {purgeLegacyData.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Old Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Full System Reset
            </CardTitle>
            <CardDescription>
              Clear all data and log out (requires re-authentication)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowResetDialog(true)}
              disabled={resetToFreshApp.isPending}
            >
              {resetToFreshApp.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Full System Reset
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This will also delete all their reports. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purge Legacy Data Confirmation Dialog */}
      <AlertDialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Old Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All service reports</li>
                <li>All user accounts except yours</li>
              </ul>
              <p className="mt-2 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {purgeError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {purgeError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurgeConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All Old Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full System Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Full System Reset</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All service reports</li>
                <li>All user accounts (including yours)</li>
                <li>All system data</li>
              </ul>
              <p className="mt-2 font-semibold text-destructive">
                You will be logged out and need to sign up again. This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resetError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {resetError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
