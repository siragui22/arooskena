/**
 * 🔄 Provider pour synchroniser AuthContext avec AuthStore Zustand
 * Charge automatiquement les données user dans le store global
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/useAuthStore';

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const authContext = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthUserId = useAuthStore((state) => state.setAuthUserId);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    // Synchroniser loading
    setLoading(authContext.loading);

    // Synchroniser auth user id
    if (authContext.user) {
      setAuthUserId(authContext.user.id);
    }

    // Synchroniser user data
    if (authContext.userData) {
      console.log('🔄 Syncing user to AuthStore:', authContext.userData);
      setUser(authContext.userData);
    } else if (!authContext.loading) {
      setUser(null);
    }
  }, [authContext.user, authContext.userData, authContext.loading, setUser, setAuthUserId, setLoading]);

  return <>{children}</>;
}
