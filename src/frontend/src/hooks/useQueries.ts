import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { DailyServiceReport, UserProfile, Role } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

// =========================
// Query Keys
// =========================

const QUERY_KEYS = {
  currentUserProfile: ['currentUserProfile'],
  userProfile: (principal: string) => ['userProfile', principal],
  isAdmin: ['isAdmin'],
  reports: ['reports'],
  report: (id: string) => ['report', id],
  users: ['users'],
  pendingSignupsCount: ['pendingSignupsCount'],
  reportsForDownload: ['reportsForDownload'],
};

// =========================
// User Profile Queries
// =========================

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;

  const query = useQuery<UserProfile | null>({
    queryKey: QUERY_KEYS.currentUserProfile,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    // Only fetch when authenticated
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && isAuthenticated && query.isFetched,
  };
}

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: principal ? QUERY_KEYS.userProfile(principal.toString()) : ['userProfile', 'null'],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: QUERY_KEYS.isAdmin,
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error) {
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 0,
    gcTime: 0,
  });
}

// =========================
// User Profile Mutations
// =========================

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUserProfile });
    },
  });
}

export function useSignupWithRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profile, requestedRole }: { profile: UserProfile; requestedRole: Role }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.signupWithRole(profile, requestedRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUserProfile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.isAdmin });
    },
  });
}

export function useSignupAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profile, password }: { profile: UserProfile; password: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.signupAdmin(profile, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUserProfile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.isAdmin });
    },
  });
}

export function useUpdateUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, newRole }: { user: Principal; newRole: Role }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUserRole(user, newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
  });
}

// =========================
// Report Queries
// =========================

export function useListReports() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DailyServiceReport[]>({
    queryKey: QUERY_KEYS.reports,
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
    queryKey: id ? QUERY_KEYS.report(id) : ['report', 'undefined'],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getReportById(id);
    },
    enabled: !!actor && !actorFetching && !!id,
  });
}

export function useGetReportsForDownload() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DailyServiceReport[]>({
    queryKey: QUERY_KEYS.reportsForDownload,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReportsForDownload();
    },
    enabled: !!actor && !actorFetching,
  });
}

// =========================
// Report Mutations
// =========================

export function useCreateReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: DailyServiceReport) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createReport(report);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reportsForDownload });
    },
  });
}

// =========================
// Admin Queries
// =========================

export function useListUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: QUERY_KEYS.users,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPendingSignupsCount() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: QUERY_KEYS.pendingSignupsCount,
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getPendingSignupsCount();
    },
    enabled: !!actor && !actorFetching,
  });
}

// =========================
// Admin Mutations
// =========================

export function useProcessPendingSignups() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.processPendingSignups();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingSignupsCount });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
  });
}

export function useResetToFreshApp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetToFreshApp();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
