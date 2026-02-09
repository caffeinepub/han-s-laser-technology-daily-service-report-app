import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { DailyServiceReport, UserProfile, Role } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { logSignupFlow, sanitizeErrorMessage } from '../utils/signupFlowDebug';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      logSignupFlow('Profile query starting', { actorAvailable: !!actor });
      
      if (!actor) throw new Error('Actor not available');
      
      try {
        const profile = await actor.getCallerUserProfile();
        logSignupFlow('Profile query success', { 
          hasProfile: profile !== null,
        });
        return profile;
      } catch (error) {
        logSignupFlow('Profile query error', {
          error: sanitizeErrorMessage(error),
        });
        throw error;
      }
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
      logSignupFlow('Signup mutation starting', { 
        actorAvailable: !!actor,
        requestedRole,
      });
      
      if (!actor) throw new Error('Actor not available');
      
      // Explicitly construct backend payload with only UserProfile fields
      // Password is never included - it's frontend-only for validation
      const backendProfile: UserProfile = {
        name: profile.name,
        username: profile.username,
        mobileNumber: profile.mobileNumber,
        email: profile.email,
        role: profile.role,
      };
      
      try {
        const result = await actor.signupWithRole(backendProfile, requestedRole);
        logSignupFlow('Signup mutation success');
        return result;
      } catch (error) {
        // Log error without any password data (sanitizeErrorMessage ensures this)
        logSignupFlow('Signup mutation error', {
          error: sanitizeErrorMessage(error),
        });
        throw error;
      }
    },
    onSuccess: () => {
      logSignupFlow('Invalidating queries after signup');
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useSignupAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profile, 
      password, 
    }: { 
      profile: UserProfile; 
      password: string; 
    }) => {
      logSignupFlow('Admin signup mutation starting', { 
        actorAvailable: !!actor,
      });
      
      if (!actor) throw new Error('Actor not available');
      
      // Explicitly construct backend payload with only UserProfile fields
      const backendProfile: UserProfile = {
        name: profile.name,
        username: profile.username,
        mobileNumber: profile.mobileNumber,
        email: profile.email,
        role: profile.role,
      };
      
      try {
        // Password is sent to backend for validation but never logged
        const result = await actor.signupAdmin(backendProfile, password);
        logSignupFlow('Admin signup mutation success');
        return result;
      } catch (error) {
        // Log error without password (sanitizeErrorMessage ensures this)
        logSignupFlow('Admin signup mutation error', {
          error: sanitizeErrorMessage(error),
        });
        throw error;
      }
    },
    onSuccess: () => {
      logSignupFlow('Invalidating queries after admin signup');
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
  const { data: isAdmin, isFetched: adminCheckFetched } = useIsCallerAdmin();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['users'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !actorFetching && adminCheckFetched && isAdmin === true,
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
