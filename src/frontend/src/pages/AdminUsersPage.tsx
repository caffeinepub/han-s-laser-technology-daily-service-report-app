import { useState } from 'react';
import { useListUsers, useDeleteUser, useGetCallerUserProfile } from '../hooks/useQueries';
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
import { Loader2, Trash2, Users, ShieldCheck, Wrench } from 'lucide-react';
import { AccessDeniedScreen } from '../components/AccessDeniedScreen';
import { Role } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

export function AdminUsersPage() {
  const { data: currentProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: users, isLoading: usersLoading, error } = useListUsers();
  const deleteUser = useDeleteUser();
  const [userToDelete, setUserToDelete] = useState<Principal | null>(null);

  // Check if current user is admin
  const isAdmin = currentProfile?.role === Role.admin;

  if (profileLoading) {
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage system users and their access permissions
        </p>
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
    </div>
  );
}
