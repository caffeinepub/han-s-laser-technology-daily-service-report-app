import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { DailyServiceReport, UserProfile, Role } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

// User Profile Queries
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

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
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

export function useSignupWithRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profile, 
      requestedRole, 
    }: { 
      profile: UserProfile; 
      requestedRole: Role; 
    }) => {
      if (!actor) throw new Error('Actor not available');
      const backendProfile: UserProfile = {
        name: profile.name,
        username: profile.username,
        mobileNumber: profile.mobileNumber,
        email: profile.email,
        role: profile.role,
      };
      return actor.signupWithRole(backendProfile, requestedRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      // Ensure only UserProfile fields are sent to backend (no password field)
      const backendProfile: UserProfile = {
        name: profile.name,
        username: profile.username,
        mobileNumber: profile.mobileNumber,
        email: profile.email,
        role: profile.role,
      };
      return actor.saveCallerUserProfile(backendProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

// Admin User Management Queries
export function useListUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['users'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !actorFetching,
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

export function usePurgeLegacyReportsAndUsers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.purgeLegacyReportsAndUsers();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
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

// Report Queries
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

export function useGetReportById(id: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DailyServiceReport | null>({
    queryKey: ['report', id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getReportById(id);
    },
    enabled: !!actor && !actorFetching && !!id,
  });
}

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
