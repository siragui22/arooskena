/**
 * 🔄 Hook pour synchroniser AuthContext avec AuthStore
 * Charge les données user dans le store Zustand
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Hook pour synchroniser les données auth
 * À appeler dans le layout ou au début de l'app
 */
export function useAuthSync() {
  const { user: authUser, userData, loading } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthUserId = useAuthStore((state) => state.setAuthUserId);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    if (loading) {
      setLoading(true);
      return;
    }

    if (authUser) {
      setAuthUserId(authUser.id);
    }

    if (userData) {
      setUser(userData);
    } else {
      setUser(null);
    }

    setLoading(false);
  }, [authUser, userData, loading, setUser, setAuthUserId, setLoading]);

  return {
    user: userData,
    isLoading: loading,
    isAuthenticated: !!authUser,
  };
}
