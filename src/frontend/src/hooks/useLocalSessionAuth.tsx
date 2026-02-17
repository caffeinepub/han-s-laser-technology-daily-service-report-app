import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { 
  loadLocalSessionIdentity, 
  saveLocalSessionIdentity, 
  clearLocalSessionIdentity 
} from '../utils/localSessionIdentityStorage';

interface LocalSessionAuthContextValue {
  identity: Ed25519KeyIdentity | null;
  principalId: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'initializing' | 'signing-in' | 'authenticated' | 'error';
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const LocalSessionAuthContext = createContext<LocalSessionAuthContextValue | null>(null);

export function LocalSessionAuthProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Ed25519KeyIdentity | null>(null);
  const [status, setStatus] = useState<'idle' | 'initializing' | 'signing-in' | 'authenticated' | 'error'>('initializing');
  const [error, setError] = useState<string | null>(null);

  // Initialize: try to restore session from storage
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const storedIdentity = loadLocalSessionIdentity();
        if (storedIdentity) {
          setIdentity(storedIdentity);
          setStatus('authenticated');
        } else {
          setStatus('idle');
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        setStatus('idle');
      }
    };

    initializeSession();
  }, []);

  const login = useCallback(async () => {
    // Immediately set signing-in status for UI feedback
    setStatus('signing-in');
    setError(null);

    try {
      // Generate a new local identity
      const newIdentity = Ed25519KeyIdentity.generate();
      
      // Persist it
      saveLocalSessionIdentity(newIdentity);
      
      // Update state only after persistence completes
      setIdentity(newIdentity);
      setStatus('authenticated');
    } catch (err) {
      console.error('Login failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in. Please try again.';
      setError(errorMessage);
      setStatus('error');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clear persisted identity
      clearLocalSessionIdentity();
      
      // Clear state
      setIdentity(null);
      setStatus('idle');
      setError(null);
    } catch (err) {
      console.error('Logout failed:', err);
      throw err;
    }
  }, []);

  const principalId = identity?.getPrincipal().toString() ?? null;
  const isAuthenticated = !!identity && status === 'authenticated';

  const value: LocalSessionAuthContextValue = {
    identity,
    principalId,
    isAuthenticated,
    status,
    error,
    login,
    logout,
  };

  return (
    <LocalSessionAuthContext.Provider value={value}>
      {children}
    </LocalSessionAuthContext.Provider>
  );
}

export function useLocalSessionAuth(): LocalSessionAuthContextValue {
  const context = useContext(LocalSessionAuthContext);
  if (!context) {
    throw new Error('useLocalSessionAuth must be used within LocalSessionAuthProvider');
  }
  return context;
}
