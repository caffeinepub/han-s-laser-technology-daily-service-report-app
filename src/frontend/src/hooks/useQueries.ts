import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { DailyServiceReport, UserProfile, Role } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

// ============================================================================
// Profile Queries
// ============================================================================

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getUserProfile(userPrincipal);
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSignupWithRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['pendingSignupsCount'] });
    },
  });
}

export function useSignupAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['pendingSignupsCount'] });
    },
  });
}

// ============================================================================
// User Management Queries
// ============================================================================

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useListUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<[Principal, UserProfile][]>({
    queryKey: ['users'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listUsers();
    },
    enabled: !!actor && !actorFetching && isAdmin === true,
    retry: false,
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useGetPendingSignupsCount() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<bigint>({
    queryKey: ['pendingSignupsCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getPendingSignupsCount();
    },
    enabled: !!actor && !actorFetching && isAdmin === true,
    refetchInterval: 30000,
  });
}

export function useProcessPendingSignups() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.processPendingSignups();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingSignupsCount'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// ============================================================================
// Report Queries
// ============================================================================

export function useCreateReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: DailyServiceReport) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createReport(report);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useListReports() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DailyServiceReport[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReports();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetReportById(id: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DailyServiceReport | null>({
    queryKey: ['report', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getReportById(id);
    },
    enabled: !!actor && !actorFetching && !!id,
  });
}

export function useGetReportsForDownload() {
  const { actor } = useActor();

  return useQuery<DailyServiceReport[]>({
    queryKey: ['reportsForDownload'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReportsForDownload();
    },
    enabled: false,
    staleTime: 0,
    gcTime: 0,
  });
}

// ============================================================================
// Admin Data Management
// ============================================================================

export function usePurgeLegacyReportsAndUsers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.purgeLegacyReportsAndUsers();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

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
