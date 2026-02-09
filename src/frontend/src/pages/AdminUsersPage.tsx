import { useState } from 'react';
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
import { Loader2, Trash2, Users, ShieldCheck, Wrench, AlertTriangle, XCircle } from 'lucide-react';
import { AccessDeniedScreen } from '../components/AccessDeniedScreen';
import { Role } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

export function AdminUsersPage() {
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();
  const { data: users, isLoading: usersLoading, error } = useListUsers();
  const deleteUser = useDeleteUser();
  const purgeLegacyData = usePurgeLegacyReportsAndUsers();
  const resetToFreshApp = useResetToFreshApp();
  const { clear } = useInternetIdentity();
  const [userToDelete, setUserToDelete] = useState<Principal | null>(null);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  if (adminCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDeniedScreen />;
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
      // The app will automatically redirect to login screen
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset application. Please try again.';
      setResetError(errorMessage);
    }
  };

  if (usersLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Users</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Failed to load users. Please try again.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage system users and their access permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => setShowPurgeDialog(true)}
            disabled={purgeLegacyData.isPending}
            className="flex items-center gap-2"
          >
            {purgeLegacyData.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Delete all old data
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowResetDialog(true)}
            disabled={resetToFreshApp.isPending}
            className="flex items-center gap-2 bg-destructive/90 hover:bg-destructive"
          >
            {resetToFreshApp.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Full System Reset
              </>
            )}
          </Button>
        </div>
      </div>

      {!users || users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map(([principal, profile]) => (
            <Card key={principal.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {profile.role === Role.admin ? (
                        <ShieldCheck className="h-5 w-5 text-accent" />
                      ) : (
                        <Wrench className="h-5 w-5 text-muted-foreground" />
                      )}
                      {profile.name}
                    </CardTitle>
                    <CardDescription className="mt-2 font-mono text-xs break-all">
                      {principal.toString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={profile.role === Role.admin ? 'default' : 'secondary'}>
                      {profile.role === Role.admin ? 'Admin' : 'Engineer'}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(principal)}
                      disabled={deleteUser.isPending}
                    >
                      {deleteUser.isPending && userToDelete?.toString() === principal.toString() ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Delete single user dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone. All reports created by this user will also be deleted.
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

      {/* Purge all data dialog */}
      <AlertDialog open={showPurgeDialog} onOpenChange={(open) => {
        setShowPurgeDialog(open);
        if (!open) setPurgeError(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Old Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all service reports and all users except yourself. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {purgeError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All Old Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full system reset dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={(open) => {
        setShowResetDialog(open);
        if (!open) setResetError(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Full System Reset</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold">
                WARNING: This will permanently delete ALL data from the application:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All user accounts (including your current admin account)</li>
                <li>All service reports</li>
                <li>All access permissions</li>
              </ul>
              <p className="font-semibold text-destructive">
                This action cannot be undone. You will be logged out and must sign up again to use the application.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resetError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Everything'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
