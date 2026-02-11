import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { DailyServiceReport, UserProfile, Role } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

// ============================================================================
// Profile Queries - Principal-scoped to prevent cross-account data leakage
// ============================================================================

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', principalId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
    // Prevent showing previous user's data during account switch
    placeholderData: undefined,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const callerPrincipalId = identity?.getPrincipal().toString() || 'anonymous';

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', callerPrincipalId, userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getUserProfile(userPrincipal);
    },
    enabled: !!actor && !actorFetching && !!userPrincipal && !!identity,
    retry: false,
    placeholderData: undefined,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      // Invalidate principal-scoped profile and admin status
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalId] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin', principalId] });
    },
  });
}

export function useSignupWithRole() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useMutation({
    mutationFn: async ({ profile, requestedRole }: { profile: UserProfile; requestedRole: Role }) => {
      if (!actor) throw new Error('Actor not available');
      
      const payload = {
        name: profile.name,
        username: profile.username,
        mobileNumber: profile.mobileNumber,
        email: profile.email,
        role: profile.role,
      };
      
      return actor.signupWithRole(payload, requestedRole);
    },
    onSuccess: async () => {
      // After signup, immediately process pending signups to assign role
      if (!actor) return;
      
      try {
        // Process pending signups to assign access control role
        await actor.processPendingSignups();
      } catch (error) {
        console.error('Failed to process pending signup:', error);
      }
      
      // Force refetch of all principal-scoped queries for immediate app access
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalId] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin', principalId] });
      queryClient.invalidateQueries({ queryKey: ['reports', principalId] });
      queryClient.invalidateQueries({ queryKey: ['pendingSignupsCount'] });
      
      // Refetch immediately to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ['currentUserProfile', principalId] });
      await queryClient.refetchQueries({ queryKey: ['isCallerAdmin', principalId] });
    },
  });
}

export function useSignupAdmin() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useMutation({
    mutationFn: async ({ profile, password }: { profile: UserProfile; password: string }) => {
      if (!actor) throw new Error('Actor not available');
      
      const payload = {
        name: profile.name,
        username: profile.username,
        mobileNumber: profile.mobileNumber,
        email: profile.email,
        role: profile.role,
      };
      
      return actor.signupAdmin(payload, password);
    },
    onSuccess: async () => {
      // After admin signup, immediately process pending signups to assign admin role
      if (!actor) return;
      
      try {
        // Process pending signups to assign access control role
        await actor.processPendingSignups();
      } catch (error) {
        console.error('Failed to process pending admin signup:', error);
      }
      
      // Force refetch of all principal-scoped queries for immediate app access
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalId] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin', principalId] });
      queryClient.invalidateQueries({ queryKey: ['reports', principalId] });
      queryClient.invalidateQueries({ queryKey: ['pendingSignupsCount'] });
      
      // Refetch immediately to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ['currentUserProfile', principalId] });
      await queryClient.refetchQueries({ queryKey: ['isCallerAdmin', principalId] });
    },
  });
}

// ============================================================================
// User Management Queries - Principal-scoped
// ============================================================================

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin', principalId],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
    placeholderData: undefined,
  });
}

export function useListUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useQuery<[Principal, UserProfile][]>({
    queryKey: ['users', principalId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listUsers();
    },
    enabled: !!actor && !actorFetching && isAdmin === true && !!identity,
    retry: false,
    placeholderData: undefined,
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', principalId] });
      queryClient.invalidateQueries({ queryKey: ['reports', principalId] });
    },
  });
}

export function useGetPendingSignupsCount() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useQuery<bigint>({
    queryKey: ['pendingSignupsCount', principalId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getPendingSignupsCount();
    },
    enabled: !!actor && !actorFetching && isAdmin === true && !!identity,
    refetchInterval: 30000,
    placeholderData: undefined,
  });
}

export function useProcessPendingSignups() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.processPendingSignups();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingSignupsCount', principalId] });
      queryClient.invalidateQueries({ queryKey: ['users', principalId] });
    },
  });
}

// ============================================================================
// Report Queries - Principal-scoped to prevent cross-account data leakage
// ============================================================================

export function useCreateReport() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useMutation({
    mutationFn: async (report: DailyServiceReport) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createReport(report);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', principalId] });
    },
  });
}

export function useListReports() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useQuery<DailyServiceReport[]>({
    queryKey: ['reports', principalId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReports();
    },
    enabled: !!actor && !actorFetching && !!identity,
    placeholderData: undefined,
  });
}

export function useGetReportById(id: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useQuery<DailyServiceReport | null>({
    queryKey: ['report', principalId, id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getReportById(id);
    },
    enabled: !!actor && !actorFetching && !!id && !!identity,
    placeholderData: undefined,
  });
}

export function useGetReportsForDownload() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  return useQuery<DailyServiceReport[]>({
    queryKey: ['reportsForDownload', principalId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReportsForDownload();
    },
    enabled: false,
    staleTime: 0,
    gcTime: 0,
    placeholderData: undefined,
  });
}

// ============================================================================
// Admin Data Management
// ============================================================================

export function useResetToFreshApp() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetToFreshApp();
    },
    // Do NOT invalidate queries here - let the UI handle cleanup after success
  });
}
