import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useListUsers, useDeleteUser, useIsCallerAdmin, usePurgeLegacyReportsAndUsers, useResetToFreshApp } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFullLogout } from '../hooks/useFullLogout';
import { copyToClipboard } from '../utils/copyToClipboard';
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
import { Loader2, Trash2, Users, ShieldCheck, Wrench, AlertTriangle, XCircle, FileText, Copy, Check } from 'lucide-react';
import { AccessDeniedScreen } from '../components/AccessDeniedScreen';
import { Role } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminCheckLoading, isFetched: adminCheckFetched } = useIsCallerAdmin();
  const { data: users, isLoading: usersLoading, error } = useListUsers();
  const deleteUser = useDeleteUser();
  const purgeLegacyData = usePurgeLegacyReportsAndUsers();
  const resetToFreshApp = useResetToFreshApp();
  const { identity } = useInternetIdentity();
  const { performLogout } = useFullLogout();
  const [userToDelete, setUserToDelete] = useState<Principal | null>(null);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

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
      // Call backend reset
      await resetToFreshApp.mutateAsync();
      
      // On success: clear auth, storage, cache, PWA caches, and reload
      setShowResetDialog(false);
      await performLogout({ isReset: true });
    } catch (error) {
      // On failure: show error, do NOT log out
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

  const handleCopyUsername = async (username: string) => {
    const success = await copyToClipboard(username);
    if (success) {
      setCopiedItem(`username-${username}`);
      setTimeout(() => setCopiedItem(null), 2000);
      toast.success('Username copied to clipboard');
    } else {
      toast.error('Failed to copy username');
    }
  };

  const handleCopyPrincipal = async (principal: Principal) => {
    const principalString = principal.toString();
    const success = await copyToClipboard(principalString);
    if (success) {
      setCopiedItem(`principal-${principalString}`);
      setTimeout(() => setCopiedItem(null), 2000);
      toast.success('Principal ID copied to clipboard');
    } else {
      toast.error('Failed to copy Principal ID');
    }
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
                const principalString = principal.toString();
                const isUsernameCopied = copiedItem === `username-${profile.username}`;
                const isPrincipalCopied = copiedItem === `principal-${principalString}`;
                return (
                  <div
                    key={principalString}
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
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 flex-shrink-0"
                          onClick={() => handleCopyUsername(profile.username)}
                          title="Copy username"
                        >
                          {isUsernameCopied ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {profile.email} • {profile.mobileNumber}
                      </p>
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer text-muted-foreground/70 hover:text-muted-foreground select-none">
                          Principal ID
                        </summary>
                        <div className="flex items-center gap-2 mt-1 pl-2">
                          <code className="text-xs text-muted-foreground/70 font-mono break-all">
                            {principalString}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 flex-shrink-0"
                            onClick={() => handleCopyPrincipal(principal)}
                            title="Copy Principal ID"
                          >
                            {isPrincipalCopied ? (
                              <Check className="h-3 w-3 text-success" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </details>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
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
              variant="outline"
              onClick={() => setShowPurgeDialog(true)}
              disabled={purgeLegacyData.isPending}
              className="w-full"
            >
              {purgeLegacyData.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
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
              Reset System
            </CardTitle>
            <CardDescription>
              Complete system reset - permanently deletes all users and reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowResetDialog(true)}
              disabled={resetToFreshApp.isPending}
              className="w-full"
            >
              {resetToFreshApp.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reset System (Full Wipe)
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
              Are you sure you want to delete this user? This will permanently remove their account and all associated reports. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
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
              <p className="mt-2 font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {purgeError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
              {purgeError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purgeLegacyData.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurgeConfirm}
              disabled={purgeLegacyData.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {purgeLegacyData.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All Old Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset System Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset System (Full Wipe)</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All service reports</li>
                <li>All user accounts (including yours)</li>
                <li>All system data</li>
              </ul>
              <p className="mt-2 font-medium text-destructive">
                You will be logged out and the system will return to its initial state. This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resetError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
              {resetError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetToFreshApp.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              disabled={resetToFreshApp.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetToFreshApp.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset System (Full Wipe)'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
