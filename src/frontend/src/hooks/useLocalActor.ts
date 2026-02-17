import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { useLocalSessionAuth } from './useLocalSessionAuth';
import { getSecretParameter } from '../utils/urlParams';

export function useLocalActor() {
  const { identity, isAuthenticated, principalId } = useLocalSessionAuth();
  const [actor, setActor] = useState<backendInterface | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    const initActor = async () => {
      try {
        setIsFetching(true);

        let newActor: backendInterface;

        if (isAuthenticated && identity) {
          // Use local session identity when authenticated
          const actorOptions = {
            agentOptions: {
              identity
            }
          };
          newActor = await createActorWithConfig(actorOptions);
          
          // Initialize access control with admin token if available
          const adminToken = getSecretParameter('caffeineAdminToken') || '';
          await newActor._initializeAccessControlWithSecret(adminToken);
        } else {
          // Use anonymous actor when not authenticated
          newActor = await createActorWithConfig();
        }

        if (!cancelled) {
          setActor(newActor);
          setIsFetching(false);
        }
      } catch (error) {
        console.error('Failed to initialize actor:', error);
        if (!cancelled) {
          setActor(null);
          setIsFetching(false);
        }
      }
    };

    initActor();

    return () => {
      cancelled = true;
    };
  }, [identity, isAuthenticated, principalId]);

  // When the actor changes (identity change), invalidate dependent queries
  useEffect(() => {
    if (actor) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          // Don't invalidate actor-related queries
          return !query.queryKey.includes('actor');
        }
      });
    }
  }, [actor, queryClient]);

  return { actor, isFetching };
}
