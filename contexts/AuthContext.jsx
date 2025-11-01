'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { cachedFetch, cache } from '@/utils/cache';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (authUser) => {
    if (!authUser) {
      setUserData(null);
      return;
    }
    try {
      const data = await cachedFetch(
        `user_data_${authUser.id}`,
        async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*, roles(name, label)')
            .eq('auth_user_id', authUser.id)
            .single();
          if (error) throw error;
          return data;
        },
        10 * 60 * 1000 // 10 minutes cache
      );
      setUserData(data);
    } catch (error) {
      console.warn('Erreur récupération données utilisateur:', error);
      setUserData(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user || null;
        setUser(authUser);
        await fetchUserData(authUser);
      } catch (error) {
        console.warn('Erreur initialisation auth:', error);
        setUser(null);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user || null;
      setUser(authUser);
      fetchUserData(authUser);
      if (event === 'SIGNED_OUT') {
        cache.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signOut = async () => {
    try {
      if (user) {
        cache.delete(`user_data_${user.id}`);
      }
      await supabase.auth.signOut();
      // Rediriger vers l'accueil après déconnexion
      router.push('/');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const value = useMemo(() => ({
    user,
    userData,
    loading,
    signOut,
    isAuthenticated: !!user,
    userRole: userData?.roles?.name || null
  }), [user, userData, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
